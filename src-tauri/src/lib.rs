use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::mpsc::{channel, Sender};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Listener};
use tiny_http::{Header, Response, Server};
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
    let _ = request.respond(
        Response::from_string(body)
            .with_status_code(status)
            .with_header(
                Header::from_bytes(&b"Content-Type"[..], &b"text/plain"[..]).unwrap(),
            ),
    );
}

fn start_http_server(
    app_handle: AppHandle,
    pending: Arc<Mutex<HashMap<String, Sender<String>>>>,
) {
    std::thread::spawn(move || {
        let server = Server::http("0.0.0.0:8080").expect("Failed to bind HTTP server on :8080");
        eprintln!("[css-server] HTTP server listening on http://localhost:8080");

        for mut request in server.incoming_requests() {
            if request.url() == "/add" && request.method() == &tiny_http::Method::Post {
                let mut body = String::new();
                if request.as_reader().read_to_string(&mut body).is_err() {
                    send_response(request, 400, "bad request");
                    continue;
                }

                let parsed: Result<serde_json::Value, _> = serde_json::from_str(&body);
                if let Ok(val) = parsed {
                    let a = val["a"].as_f64().unwrap_or(f64::NAN);
                    let b = val["b"].as_f64().unwrap_or(f64::NAN);
                    let request_id = Uuid::new_v4().to_string();

                    let (tx, rx) = channel::<String>();
                    {
                        let mut map = pending.lock().unwrap();
                        map.insert(request_id.clone(), tx);
                    }

                    let payload = HttpRequestPayload {
                        request_id: request_id.clone(),
                        a,
                        b,
                    };
                    let _ = app_handle.emit("http-request", payload);

                    let result = rx.recv().unwrap_or_else(|_| "internal error".into());

                    if let Ok(n) = result.parse::<f64>() {
                        if n.is_finite() {
                            send_response(request, 200, &n.to_string());
                        } else {
                            send_response(request, 400, "NaN or infinite result");
                        }
                    } else {
                        send_response(request, 400, &result);
                    }
                } else {
                    send_response(request, 400, "invalid JSON");
                }
            } else {
                send_response(request, 404, "not found");
            }
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
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
                if let Ok(payload) = serde_json::from_str::<HttpResponsePayload>(event.payload()) {
                    let mut map = pending_listener.lock().unwrap();
                    if let Some(tx) = map.remove(&payload.request_id) {
                        let _ = tx.send(payload.result);
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
