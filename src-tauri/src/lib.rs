use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::mpsc::{channel, Sender};
use std::sync::{Arc, Mutex, Condvar};
use tauri::{AppHandle, Emitter, Listener};
use tiny_http::{Header, Response, Server};
use tracing::{debug, error, info, warn};
use uuid::Uuid;

#[derive(Serialize, Clone)]
struct HttpRequestPayload {
    request_id: String,
    a: f64,
    b: f64,
}

#[derive(Deserialize, Clone)]
struct HttpResponsePayload {
    request_id: String,
    result: String,
}

struct RequestCoordinator {
    active_count: usize,
    queued_count: usize,
}

struct ActiveSlotGuard {
    coordinator: Arc<(Mutex<RequestCoordinator>, Condvar)>,
}

impl Drop for ActiveSlotGuard {
    fn drop(&mut self) {
        let (lock, cvar) = &*self.coordinator;
        let mut coord = lock.lock().unwrap();
        coord.active_count -= 1;
        cvar.notify_one();
        debug!(active = coord.active_count, queued = coord.queued_count, "active slot released");
    }
}

fn send_response(
    request: tiny_http::Request,
    status: u16,
    body: &str,
) {
    let result = request.respond(
        Response::from_string(body)
            .with_status_code(status)
            .with_header(
                Header::from_bytes(&b"Content-Type"[..], &b"text/plain"[..]).unwrap(),
            ),
    );
    if let Err(e) = result {
        error!(status, body, error = %e, "failed to send HTTP response");
    }
}

fn start_http_server(
    app_handle: AppHandle,
    pending: Arc<Mutex<HashMap<String, Sender<String>>>>,
    coordinator: Arc<(Mutex<RequestCoordinator>, Condvar)>,
) {
    std::thread::spawn(move || {
        let server = match Server::http("0.0.0.0:8080") {
            Ok(s) => {
                info!("HTTP server listening on http://localhost:8080");
                s
            }
            Err(e) => {
                error!(error = %e, "failed to bind HTTP server on :8080");
                return;
            }
        };

        for mut request in server.incoming_requests() {
            let app_handle = app_handle.clone();
            let pending = pending.clone();
            let coordinator = coordinator.clone();

            // Check if queue is full immediately (avoid spawning thread if rejected with 429)
            {
                let (lock, _cvar) = &*coordinator;
                let mut coord = lock.lock().unwrap();
                if coord.active_count >= 3 && coord.queued_count >= 5 {
                    warn!("Rate limit exceeded (active={}, queued={}). Responding HTTP 429.", coord.active_count, coord.queued_count);
                    send_response(request, 429, "Too Many Requests (Queue Full)");
                    continue;
                }
                // Register in queue
                coord.queued_count += 1;
                debug!(active = coord.active_count, queued = coord.queued_count, "request added to backpressure queue");
            }

            let thread_coordinator = coordinator.clone();
            std::thread::spawn(move || {
                // Wait in queue until active slot is available
                {
                    let (lock, cvar) = &*thread_coordinator;
                    let mut coord = lock.lock().unwrap();
                    while coord.active_count >= 3 {
                        coord = cvar.wait(coord).unwrap();
                    }
                    // Transition from queued to active
                    coord.queued_count -= 1;
                    coord.active_count += 1;
                    debug!(active = coord.active_count, queued = coord.queued_count, "request slot acquired, starting processing");
                }

                // Instantiate RAII slot guard to release slot automatically when thread exits
                let _guard = ActiveSlotGuard { coordinator: thread_coordinator.clone() };

                let method = request.method().to_string();
                let url = request.url().to_string();

                if url == "/add" && method == "POST" {
                    debug!(method, url, "incoming request");

                    let mut body = String::new();
                    if let Err(e) = request.as_reader().read_to_string(&mut body) {
                        warn!(error = %e, "failed to read request body");
                        send_response(request, 400, "bad request");
                        return;
                    }
                    debug!(body_len = body.len(), "request body read");

                    let parsed: Result<serde_json::Value, _> = serde_json::from_str(&body);
                    match parsed {
                        Ok(val) => {
                            let a = val["a"].as_f64().unwrap_or(f64::NAN);
                            let b = val["b"].as_f64().unwrap_or(f64::NAN);
                            let request_id = Uuid::new_v4().to_string();

                            info!(request_id, a, b, "request parsed, dispatching to webview");

                            let (tx, rx) = channel::<String>();
                            {
                                let mut map = match pending.lock() {
                                    Ok(m) => m,
                                    Err(e) => {
                                        error!(request_id, error = %e, "mutex poisoned");
                                        send_response(request, 500, "internal error");
                                        return;
                                    }
                                };
                                map.insert(request_id.clone(), tx);
                            }

                            let payload = HttpRequestPayload {
                                request_id: request_id.clone(),
                                a,
                                b,
                            };
                            if let Err(e) = app_handle.emit("http-request", payload) {
                                error!(request_id, error = %e, "failed to emit http-request event");
                                let mut map = pending.lock().unwrap();
                                map.remove(&request_id);
                                send_response(request, 500, "internal error");
                                return;
                            }
                            debug!(request_id, "event emitted, waiting for result");

                            let timeout = std::time::Duration::from_secs(4);
                            let result = match rx.recv_timeout(timeout) {
                                Ok(r) => r,
                                Err(std::sync::mpsc::RecvTimeoutError::Timeout) => {
                                    warn!(request_id, "request timed out waiting for webview response");
                                    if let Ok(mut map) = pending.lock() {
                                        map.remove(&request_id);
                                    }
                                    "timeout".into()
                                }
                                Err(std::sync::mpsc::RecvTimeoutError::Disconnected) => {
                                    warn!(request_id, "channel disconnected");
                                    "disconnected".into()
                                }
                            };
                            info!(request_id, result, "result received from webview");

                            if result == "timeout" {
                                send_response(request, 504, "CSS execution timeout (unsupported features or stuck animation)");
                            } else if result == "disconnected" || result == "internal error" {
                                send_response(request, 500, "internal error");
                            } else if let Ok(n) = result.parse::<f64>() {
                                info!(request_id, status = 200, result = n, "responding OK");
                                send_response(request, 200, &n.to_string());
                            } else {
                                warn!(request_id, status = 400, result, "non-numeric result");
                                send_response(request, 400, &result);
                            }
                        }
                        Err(e) => {
                            warn!(error = %e, body, "invalid JSON");
                            send_response(request, 400, "invalid JSON");
                        }
                    }
                } else {
                    debug!(method, url, "unhandled route");
                    send_response(request, 404, "not found");
                }
            });
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "css_server=debug".into()),
        )
        .with_target(true)
        .init();

    info!("CSS-Server starting");

    let pending: Arc<Mutex<HashMap<String, Sender<String>>>> =
        Arc::new(Mutex::new(HashMap::new()));

    let coordinator = Arc::new((
        Mutex::new(RequestCoordinator {
            active_count: 0,
            queued_count: 0,
        }),
        Condvar::new(),
    ));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            let app_handle = app.handle().clone();
            let pending_clone = pending.clone();
            let coordinator_clone = coordinator.clone();

            start_http_server(app_handle, pending_clone, coordinator_clone);

            let pending_listener = pending.clone();
            app.listen("http-response", move |event| {
                match serde_json::from_str::<HttpResponsePayload>(event.payload()) {
                    Ok(payload) => {
                        debug!(request_id = %payload.request_id, result = %payload.result, "http-response event received");
                        let mut map = match pending_listener.lock() {
                            Ok(m) => m,
                            Err(e) => {
                                error!(error = %e, "mutex poisoned in listener");
                                return;
                            }
                        };
                        match map.remove(&payload.request_id) {
                            Some(tx) => {
                                if let Err(e) = tx.send(payload.result) {
                                    error!(request_id = %payload.request_id, error = %e, "failed to send result through channel");
                                }
                            }
                            None => {
                                warn!(request_id = %payload.request_id, "no pending request found for response");
                            }
                        }
                    }
                    Err(e) => {
                        error!(error = %e, payload = %event.payload(), "failed to deserialize http-response event");
                    }
                }
            });

            app.listen("js-log", move |event| {
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(event.payload()) {
                    let level = val["level"].as_str().unwrap_or("INFO");
                    let source = val["source"].as_str().unwrap_or("js");
                    let message = val["message"].as_str().unwrap_or("");
                    let data_val = &val["data"];
                    let data_str = if data_val.is_null() {
                        "".to_string()
                    } else {
                        format!(" data={}", data_val)
                    };
                    match level {
                        "ERROR" => error!(target: "css_server::webview", source, "{}{}", message, data_str),
                        "WARN" => warn!(target: "css_server::webview", source, "{}{}", message, data_str),
                        "DEBUG" => debug!(target: "css_server::webview", source, "{}{}", message, data_str),
                        _ => info!(target: "css_server::webview", source, "{}{}", message, data_str),
                    }
                } else {
                    info!(target: "css_server::webview", "raw: {}", event.payload());
                }
            });

            info!("CSS-Server setup complete");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
