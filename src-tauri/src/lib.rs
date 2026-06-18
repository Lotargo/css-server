use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::mpsc::{channel, Sender};
use std::sync::{Arc, Mutex};
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
            let method = request.method().to_string();
            let url = request.url().to_string();

            if url == "/add" && method == "POST" {
                debug!(method, url, "incoming request");

                let mut body = String::new();
                if let Err(e) = request.as_reader().read_to_string(&mut body) {
                    warn!(error = %e, "failed to read request body");
                    send_response(request, 400, "bad request");
                    continue;
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
                                    continue;
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
                            continue;
                        }
                        debug!(request_id, "event emitted, waiting for result");

                        let result = match rx.recv() {
                            Ok(r) => r,
                            Err(e) => {
                                warn!(request_id, error = %e, "channel recv failed, sender dropped");
                                "internal error".into()
                            }
                        };
                        info!(request_id, result, "result received from webview");

                        if let Ok(n) = result.parse::<f64>() {
                            if n.is_finite() {
                                info!(request_id, status = 200, result = n, "responding OK");
                                send_response(request, 200, &n.to_string());
                            } else {
                                warn!(request_id, status = 400, result = n, "NaN or infinite result");
                                send_response(request, 400, "NaN or infinite result");
                            }
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

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            let app_handle = app.handle().clone();
            let pending_clone = pending.clone();

            start_http_server(app_handle, pending_clone);

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

            info!("CSS-Server setup complete");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
