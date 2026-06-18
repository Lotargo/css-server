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

const inbound = document.getElementById("inbound");
const aluLane = document.getElementById("alu-lane");

function updateCounter() {
  const count = document.querySelectorAll(".request").length;
  document.getElementById("status-counter").textContent = `active: ${count}`;
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
      updateCounter();
    }, 3200);

    node.addEventListener("animationend", (evt) => {
      if (finished) return;
      finished = true;
      clearTimeout(watchdog);

      const style = getComputedStyle(node);
      const result = style.getPropertyValue("--result").trim();

      log("INFO", "alu", `animation ended [id: ${request_id}]`, {
        animationName: evt.animationName,
        result: result || "NaN"
      });

      let responseResult = result;
      if (evt.animationName === "drop-to-trash") {
        responseResult = "Error: negative input or constraint violation";
      }

      emit("http-response", {
        request_id: request_id,
        result: responseResult || "NaN",
      }).then(() => {
        log("DEBUG", "sysbus", `response emitted [id: ${request_id}]`, { result: responseResult || "NaN" });
      }).catch((err) => {
        log("ERROR", "sysbus", `failed to emit response [id: ${request_id}]`, { error: err });
      });

      node.remove();
      updateCounter();
    });

    inbound.appendChild(node);
    log("DEBUG", "dom", `node appended to inbound [id: ${request_id}]`);
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
