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

  // Emit to Rust system bus
  emit("js-log", { level, source, message, data }).catch(() => {});

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
  log("INFO", "compat", "detecting CSS compatibility...");
  const supportsIf = CSS.supports('color', 'if(style(--foo: 1): red; else: blue)');
  const supportsTypedAttr = CSS.supports('width', 'attr(data-w type(<number>))');
  
  log("INFO", "compat", `CSS if() support: ${supportsIf}`);
  log("INFO", "compat", `CSS typed attr() support: ${supportsTypedAttr}`);
  
  if (!supportsIf || !supportsTypedAttr) {
    log("WARN", "compat", "CRITICAL WARNING: The current WebView does not support CSS if() or typed attr(). Requests will time out!");
  }

  log("INFO", "sysbus", "listening for http-request events");

  await listen("http-request", (event) => {
    const { request_id, a, b } = event.payload;

    log("INFO", "sysbus", `request received [id: ${request_id}]`, { a, b });

    const node = document.createElement("div");
    node.className = "request add-task";
    node.dataset.requestId = request_id;
    node.dataset.a = String(a);
    node.dataset.b = String(b);

    let finished = false;

    // Watchdog timer (3.2 seconds) to catch stuck/silent requests
    const watchdog = setTimeout(() => {
      if (finished) return;
      finished = true;

      // Extract computed variables for diagnostic tracing
      const style = getComputedStyle(node);
      const valA = style.getPropertyValue("--val-a").trim();
      const valB = style.getPropertyValue("--val-b").trim();
      const result = style.getPropertyValue("--result").trim();

      log("ERROR", "alu", `watchdog triggered - execution timed out [id: ${request_id}]`, {
        computed_val_a: valA || "undefined",
        computed_val_b: valB || "undefined",
        computed_result: result || "undefined",
        message: "CSS animation failed to trigger/end. Check feature support."
      });

      emit("http-response", {
        request_id: request_id,
        result: "Error: CSS animation timeout (unsupported features)",
      }).then(() => {
        log("DEBUG", "sysbus", `timeout response emitted [id: ${request_id}]`);
      }).catch((err) => {
        log("ERROR", "sysbus", `failed to emit timeout response [id: ${request_id}]`, { error: err });
      });

      node.remove();
      activeCount = Math.max(0, activeCount - 1);
      updateCounter();
    }, 3200);

    node.addEventListener("animationend", () => {
      if (finished) return;
      finished = true;
      clearTimeout(watchdog);

      const style = getComputedStyle(node);
      const result = style.getPropertyValue("--result").trim();

      log("INFO", "alu", `animation ended [id: ${request_id}]`, { result: result || "NaN" });

      emit("http-response", {
        request_id: request_id,
        result: result || "NaN",
      }).then(() => {
        log("DEBUG", "sysbus", `response emitted [id: ${request_id}]`, { result: result || "NaN" });
      }).catch((err) => {
        log("ERROR", "sysbus", `failed to emit response [id: ${request_id}]`, { error: err });
      });

      node.remove();
      activeCount = Math.max(0, activeCount - 1);
      updateCounter();
    });

    inbound.appendChild(node);
    log("DEBUG", "dom", `node appended to inbound [id: ${request_id}]`);
    activeCount++;
    updateCounter();

    setTimeout(() => {
      if (!finished && node.parentNode === inbound) {
        aluLane.appendChild(node);
        log("DEBUG", "dom", `node moved to ALU lane [id: ${request_id}]`);
      }
    }, 400);
  });

  log("INFO", "sysbus", "listener established");
}

setup().catch((err) => {
  log("ERROR", "sysbus", "setup failed", { error: err });
});
