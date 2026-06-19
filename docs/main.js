let docsDisplayValue = "0";
let docsExpressionValue = "";
let docsAccumulator = null;
let docsPendingOp = null;
let docsShouldResetDisplay = false;
let docsMemoryList = [];

const docsDisplay = document.getElementById("docs-calculator-display");
const docsPreview = document.getElementById("docs-expression-preview");
const docsAluLane = document.getElementById("docs-alu-lane");
const docsAluPreview = document.getElementById("docs-alu-preview");
const docsMemoryButtons = {
  mc: document.getElementById("docs-btn-mc"),
  mr: document.getElementById("docs-btn-mr"),
  mPlus: document.getElementById("docs-btn-m-plus"),
  mMinus: document.getElementById("docs-btn-m-minus"),
  ms: document.getElementById("docs-btn-ms"),
  mList: document.getElementById("docs-btn-m-list")
};

function formatNumber(value) {
  const number = Number.parseFloat(value);
  if (Number.isNaN(number)) return "NaN";
  if (!Number.isFinite(number)) return String(number);
  const text = number.toString();
  if (text.length > 12) {
    if (Math.abs(number) < 1e-6 || Math.abs(number) > 1e12) {
      return number.toExponential(6);
    }
    return String(Number.parseFloat(number.toFixed(10)));
  }
  return Number.isInteger(number) ? String(number) : String(Number.parseFloat(number.toFixed(8)));
}

function getDocsOpSymbol(op) {
  const map = {
    add: "+",
    sub: "−",
    mul: "×",
    div: "÷",
    inv: "1/x",
    sqr: "x²",
    sqrt: "²√x",
    pct: "%"
  };
  return map[op] || op;
}

function updateDocsCalculatorUi() {
  if (!docsDisplay || !docsPreview) return;

  docsDisplay.textContent = docsDisplayValue.replace(".", ",");
  docsPreview.textContent = docsExpressionValue;

  const hasMemory = docsMemoryList.length > 0;
  if (docsMemoryButtons.mc) docsMemoryButtons.mc.disabled = !hasMemory;
  if (docsMemoryButtons.mr) docsMemoryButtons.mr.disabled = !hasMemory;
  if (docsMemoryButtons.mList) docsMemoryButtons.mList.disabled = !hasMemory;
}

function freezeDocsCalculator(freeze) {
  document.querySelectorAll("#docs-calculator-grid button, #docs-memory-bar button").forEach(button => {
    button.disabled = freeze;
  });

  if (!freeze) updateDocsCalculatorUi();
}

function performDocsCssArithmetic(valA, valB, op) {
  if (!docsAluLane) return Promise.resolve(0);

  const task = document.createElement("div");
  task.className = "docs-math-task";
  task.dataset.a = String(valA);
  task.dataset.b = String(valB);
  task.dataset.op = op;
  task.dataset.opSymbol = getDocsOpSymbol(op);
  docsAluLane.replaceChildren(task);

  if (docsAluPreview) {
    docsAluPreview.textContent = `data-a="${valA}" data-b="${valB}" data-op="${op}"`;
  }

  return new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const cssResult = getComputedStyle(task).getPropertyValue("--result").trim();
        resolve(Number.parseFloat(cssResult));
      });
    });
  });
}

function handleDocsNumberInput(value) {
  if (value === ",") {
    if (docsShouldResetDisplay) {
      docsDisplayValue = "0.";
      docsShouldResetDisplay = false;
    } else if (!docsDisplayValue.includes(".")) {
      docsDisplayValue += ".";
    }
  } else if (docsDisplayValue === "0" || docsShouldResetDisplay) {
    docsDisplayValue = value;
    docsShouldResetDisplay = false;
  } else {
    docsDisplayValue += value;
  }

  updateDocsCalculatorUi();
}

async function handleDocsOperationInput(id) {
  const currentValue = Number.parseFloat(docsDisplayValue);

  if (id === "docs-btn-c") {
    docsDisplayValue = "0";
    docsExpressionValue = "";
    docsAccumulator = null;
    docsPendingOp = null;
    docsShouldResetDisplay = false;
    updateDocsCalculatorUi();
    return;
  }

  if (id === "docs-btn-ce") {
    docsDisplayValue = "0";
    updateDocsCalculatorUi();
    return;
  }

  if (id === "docs-btn-back") {
    docsDisplayValue = docsDisplayValue.slice(0, -1);
    if (docsDisplayValue === "" || docsDisplayValue === "-") docsDisplayValue = "0";
    updateDocsCalculatorUi();
    return;
  }

  if (id === "docs-btn-neg") {
    if (docsDisplayValue !== "0") {
      docsDisplayValue = docsDisplayValue.startsWith("-")
        ? docsDisplayValue.substring(1)
        : `-${docsDisplayValue}`;
      updateDocsCalculatorUi();
    }
    return;
  }

  if (id === "docs-btn-pct") {
    freezeDocsCalculator(true);
    const result = docsAccumulator !== null && docsPendingOp
      ? await performDocsCssArithmetic(docsAccumulator, currentValue, "pct")
      : await performDocsCssArithmetic(currentValue, 100, "div");
    docsDisplayValue = String(result);
    docsShouldResetDisplay = true;
    freezeDocsCalculator(false);
    updateDocsCalculatorUi();
    return;
  }

  if (["docs-btn-inv", "docs-btn-sqr", "docs-btn-sqrt"].includes(id)) {
    const op = id === "docs-btn-inv" ? "inv" : id === "docs-btn-sqr" ? "sqr" : "sqrt";
    const preview = id === "docs-btn-inv"
      ? `1/(${formatNumber(currentValue)})`
      : id === "docs-btn-sqr"
        ? `sqr(${formatNumber(currentValue)})`
        : `√(${formatNumber(currentValue)})`;

    freezeDocsCalculator(true);
    const result = await performDocsCssArithmetic(currentValue, 0, op);
    docsExpressionValue = `${preview} =`;
    docsDisplayValue = String(result);
    docsShouldResetDisplay = true;
    freezeDocsCalculator(false);
    updateDocsCalculatorUi();
    return;
  }

  const opMap = {
    "docs-btn-add": "add",
    "docs-btn-sub": "sub",
    "docs-btn-mul": "mul",
    "docs-btn-div": "div"
  };
  const op = opMap[id];
  if (!op) return;

  if (docsAccumulator === null) {
    docsAccumulator = currentValue;
    docsPendingOp = op;
    docsExpressionValue = `${formatNumber(docsAccumulator)} ${getDocsOpSymbol(op)}`;
    docsShouldResetDisplay = true;
    updateDocsCalculatorUi();
    return;
  }

  if (docsPendingOp && !docsShouldResetDisplay) {
    const previousOp = docsPendingOp;
    freezeDocsCalculator(true);
    const result = await performDocsCssArithmetic(docsAccumulator, currentValue, previousOp);
    docsAccumulator = result;
    docsPendingOp = op;
    docsExpressionValue = `${formatNumber(docsAccumulator)} ${getDocsOpSymbol(op)}`;
    docsDisplayValue = String(result);
    docsShouldResetDisplay = true;
    freezeDocsCalculator(false);
    updateDocsCalculatorUi();
    return;
  }

  docsPendingOp = op;
  docsExpressionValue = `${formatNumber(docsAccumulator)} ${getDocsOpSymbol(op)}`;
  updateDocsCalculatorUi();
}

async function handleDocsEquals() {
  if (docsAccumulator === null || docsPendingOp === null) return;

  const currentValue = Number.parseFloat(docsDisplayValue);
  const op = docsPendingOp;

  freezeDocsCalculator(true);
  const result = await performDocsCssArithmetic(docsAccumulator, currentValue, op);
  docsExpressionValue = `${formatNumber(docsAccumulator)} ${getDocsOpSymbol(op)} ${formatNumber(currentValue)} =`;
  docsDisplayValue = String(result);
  docsAccumulator = null;
  docsPendingOp = null;
  docsShouldResetDisplay = true;
  freezeDocsCalculator(false);
  updateDocsCalculatorUi();
}

document.querySelectorAll("#docs-calculator-grid button").forEach(button => {
  button.addEventListener("click", async () => {
    if (button.classList.contains("docs-btn-num")) {
      handleDocsNumberInput(button.textContent.trim());
    } else if (button.classList.contains("docs-btn-op")) {
      await handleDocsOperationInput(button.id);
    } else if (button.classList.contains("docs-btn-eq")) {
      await handleDocsEquals();
    }
  });
});

docsMemoryButtons.ms?.addEventListener("click", () => {
  docsMemoryList.unshift(Number.parseFloat(docsDisplayValue));
  docsShouldResetDisplay = true;
  updateDocsCalculatorUi();
});

docsMemoryButtons.mc?.addEventListener("click", () => {
  docsMemoryList = [];
  updateDocsCalculatorUi();
});

docsMemoryButtons.mr?.addEventListener("click", () => {
  if (docsMemoryList.length === 0) return;
  docsDisplayValue = String(docsMemoryList[0]);
  docsShouldResetDisplay = true;
  updateDocsCalculatorUi();
});

docsMemoryButtons.mPlus?.addEventListener("click", async () => {
  const currentValue = Number.parseFloat(docsDisplayValue);
  if (docsMemoryList.length === 0) {
    docsMemoryList.push(currentValue);
  } else {
    docsMemoryList[0] = await performDocsCssArithmetic(docsMemoryList[0], currentValue, "add");
  }
  docsShouldResetDisplay = true;
  updateDocsCalculatorUi();
});

docsMemoryButtons.mMinus?.addEventListener("click", async () => {
  const currentValue = Number.parseFloat(docsDisplayValue);
  if (docsMemoryList.length === 0) {
    docsMemoryList.push(await performDocsCssArithmetic(0, currentValue, "sub"));
  } else {
    docsMemoryList[0] = await performDocsCssArithmetic(docsMemoryList[0], currentValue, "sub");
  }
  docsShouldResetDisplay = true;
  updateDocsCalculatorUi();
});

docsMemoryButtons.mList?.addEventListener("click", () => {
  if (!docsAluPreview) return;
  docsAluPreview.textContent = docsMemoryList.length
    ? `memory[0]="${formatNumber(docsMemoryList[0])}"`
    : "memory empty";
});

updateDocsCalculatorUi();

const networkPresets = {
  success: {
    endpoint: "https://api.github.com/zen",
    method: "GET",
    headers: "{}",
    body: ""
  },
  "cors-failure": {
    endpoint: "http://127.0.0.1:9/cors-boundary",
    method: "GET",
    headers: "{}",
    body: ""
  }
};

function setNetworkCard(id, state, text) {
  const card = document.getElementById(id);
  if (!card) return;
  card.dataset.state = state;
  card.textContent = text;
}

function setMetricCard(id, text, dataset) {
  const card = document.getElementById(id);
  if (!card) return;
  card.textContent = text;
  for (const [key, value] of Object.entries(dataset)) {
    card.dataset[key] = String(value);
  }
}

function previewText(text) {
  if (!text) return "(empty response)";
  return text.length > 900 ? `${text.slice(0, 900)}\n...` : text;
}

function parseHeaders(rawHeaders) {
  const trimmed = rawHeaders.trim();
  if (!trimmed) return {};
  const parsed = JSON.parse(trimmed);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Headers JSON must be an object.");
  }
  return parsed;
}

function normalizeContentType(contentType) {
  const value = contentType.toLowerCase();
  if (value.includes("json")) return "json";
  if (value.includes("html")) return "html";
  if (value.includes("text")) return "text";
  return "unknown";
}

async function runNetworkRequest(event) {
  event.preventDefault();

  const endpoint = document.getElementById("network-endpoint");
  const method = document.getElementById("network-method");
  const headers = document.getElementById("network-headers");
  const body = document.getElementById("network-body");
  const statusCard = document.getElementById("network-status-card");
  const response = document.getElementById("network-response");

  if (!endpoint || !method || !headers || !body || !statusCard || !response) return;

  statusCard.dataset.status = "0";
  statusCard.textContent = "pending";
  setNetworkCard("network-request-card", "queued", `${method.value} ${endpoint.value}`);
  setNetworkCard("network-transport-card", "fetching", "fetch()");
  setMetricCard("network-latency-card", "latency pending", { ms: -1 });
  setMetricCard("network-payload-card", "payload pending", { bytes: -1 });
  setMetricCard("network-body-card", "body pending", { body: "unknown" });
  setMetricCard("network-content-card", "content pending", { content: "unknown" });
  response.textContent = "Request in flight...";

  const startedAt = performance.now();
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);

  try {
    const requestHeaders = parseHeaders(headers.value);
    const request = {
      method: method.value,
      headers: requestHeaders,
      signal: controller.signal
    };

    if (!["GET", "HEAD"].includes(method.value) && body.value.trim()) {
      request.body = body.value;
    }

    const res = await fetch(endpoint.value, request);
    window.clearTimeout(timeoutId);
    const elapsed = Math.round(performance.now() - startedAt);
    const contentType = res.headers.get("content-type") || "";
    const contentKind = normalizeContentType(contentType);
    const text = await res.text();

    setNetworkCard("network-request-card", "done", "request sent");
    setNetworkCard("network-transport-card", "done", `${elapsed} ms`);
    statusCard.dataset.status = String(res.status);
    statusCard.textContent = `${res.status} ${res.statusText || "HTTP"}`;
    setMetricCard("network-latency-card", `${elapsed} ms`, { ms: elapsed });
    setMetricCard("network-payload-card", `${text.length} chars`, { bytes: text.length });
    setMetricCard("network-body-card", text.length > 0 ? "body non-empty" : "body empty", {
      body: text.length > 0 ? "nonempty" : "empty"
    });
    setMetricCard("network-content-card", contentKind, { content: contentKind });
    response.textContent = previewText(text);
  } catch (error) {
    window.clearTimeout(timeoutId);
    setNetworkCard("network-request-card", "error", "request failed");
    setNetworkCard("network-transport-card", "error", "blocked");
    statusCard.dataset.status = "0";
    statusCard.textContent = "CORS / network / input error";
    setMetricCard("network-latency-card", "latency failed", { ms: -1 });
    setMetricCard("network-payload-card", "payload failed", { bytes: -1 });
    setMetricCard("network-body-card", "body unavailable", { body: "unknown" });
    setMetricCard("network-content-card", "content unavailable", { content: "unknown" });
    response.textContent = error instanceof Error ? error.message : String(error);
  }
}

document.getElementById("network-form")?.addEventListener("submit", runNetworkRequest);

document.querySelectorAll("[data-network-preset]").forEach(button => {
  button.addEventListener("click", () => {
    const preset = networkPresets[button.dataset.networkPreset];
    if (!preset) return;

    document.getElementById("network-endpoint").value = preset.endpoint;
    document.getElementById("network-method").value = preset.method;
    document.getElementById("network-headers").value = preset.headers;
    document.getElementById("network-body").value = preset.body;
  });
});
