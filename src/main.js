const { listen, emit } = window.__TAURI__.event;

const MAX_LOG = 100;
const logPanel = document.getElementById("log-list");

function log(level, source, message, data) {
  const ts = new Date().toISOString().slice(11, 23);
  const prefix = `[${ts}][${level}][${source}]`;
  const text = data ? `${message} ${JSON.stringify(data)}` : message;

  if (level === "ERROR") console.error(prefix, text);
  else if (level === "WARN") console.warn(prefix, text);
  else console.info(prefix, text);

  if (!logPanel) return;
  const entry = document.createElement("div");
  entry.className = `log-entry log-${level.toLowerCase()}`;
  entry.textContent = `${prefix} ${text}`;
  logPanel.appendChild(entry);
  if (logPanel.children.length > MAX_LOG) {
    logPanel.removeChild(logPanel.firstChild);
  }
  logPanel.scrollTop = logPanel.scrollHeight;
}

let activeCount = 0;
const inbound = document.getElementById("inbound");
const aluLane = document.getElementById("alu-lane");

function updateCounter() {
  document.getElementById("status-counter").textContent = `active: ${activeCount}`;
}

async function setup() {
  log("INFO", "sysbus", "listening for http-request events");

  await listen("http-request", (event) => {
    const { request_id, a, b } = event.payload;

    log("INFO", "sysbus", "request received", { request_id, a, b });

    const node = document.createElement("div");
    node.className = "request add-task";
    node.dataset.requestId = request_id;
    node.dataset.a = String(a);
    node.dataset.b = String(b);

    node.addEventListener("animationend", () => {
      const style = getComputedStyle(node);
      const result = style.getPropertyValue("--result").trim();

      log("INFO", "alu", "animation ended", { request_id, result: result || "NaN" });

      emit("http-response", {
        requestId: request_id,
        result: result || "NaN",
      }).then(() => {
        log("DEBUG", "sysbus", "response emitted", { request_id, result: result || "NaN" });
      }).catch((err) => {
        log("ERROR", "sysbus", "failed to emit response", { request_id, error: err });
      });

      node.remove();
      activeCount = Math.max(0, activeCount - 1);
      updateCounter();
    });

    inbound.appendChild(node);
    log("DEBUG", "dom", "node appended to inbound", { request_id });
    activeCount++;
    updateCounter();

    setTimeout(() => {
      aluLane.appendChild(node);
      log("DEBUG", "dom", "node moved to ALU lane", { request_id });
    }, 400);
  });

  log("INFO", "sysbus", "listener established");
}

setup().catch((err) => {
  log("ERROR", "sysbus", "setup failed", { error: err });
});
