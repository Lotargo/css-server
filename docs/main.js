const samples = [
  { a: 21, b: 2, op: "mul", symbol: "x" },
  { a: 144, b: 12, op: "div", symbol: "/" },
  { a: 34, b: 8, op: "add", symbol: "+" },
  { a: 90, b: 17, op: "sub", symbol: "-" }
];

let sampleIndex = 1;

function formatNumber(value) {
  const number = Number.parseFloat(value);
  if (!Number.isFinite(number)) return value;
  return Number.isInteger(number) ? String(number) : String(Number.parseFloat(number.toFixed(8)));
}

function runProof() {
  const task = document.getElementById("proof-task");
  const input = document.getElementById("proof-input");
  const result = document.getElementById("proof-result");
  if (!task || !input || !result) return;

  const sample = samples[sampleIndex % samples.length];
  sampleIndex += 1;

  task.dataset.a = String(sample.a);
  task.dataset.b = String(sample.b);
  task.dataset.op = sample.op;
  task.dataset.opSymbol = sample.symbol;
  input.textContent = `data-a="${sample.a}" data-b="${sample.b}" data-op="${sample.op}"`;
  result.textContent = "...";

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const cssResult = getComputedStyle(task).getPropertyValue("--result").trim();
      result.textContent = formatNumber(cssResult);
    });
  });
}

document.getElementById("run-proof")?.addEventListener("click", runProof);

function setNetworkCard(id, state, text) {
  const card = document.getElementById(id);
  if (!card) return;
  card.dataset.state = state;
  card.textContent = text;
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
  response.textContent = "Request in flight...";

  const startedAt = performance.now();

  try {
    const requestHeaders = parseHeaders(headers.value);
    const request = {
      method: method.value,
      headers: requestHeaders
    };

    if (!["GET", "HEAD"].includes(method.value) && body.value.trim()) {
      request.body = body.value;
    }

    const res = await fetch(endpoint.value, request);
    const elapsed = Math.round(performance.now() - startedAt);
    const text = await res.text();

    setNetworkCard("network-request-card", "done", "request sent");
    setNetworkCard("network-transport-card", "done", `${elapsed} ms`);
    statusCard.dataset.status = String(res.status);
    statusCard.textContent = `${res.status} ${res.statusText || "HTTP"}`;
    response.textContent = previewText(text);
  } catch (error) {
    setNetworkCard("network-request-card", "error", "request failed");
    setNetworkCard("network-transport-card", "error", "blocked");
    statusCard.dataset.status = "0";
    statusCard.textContent = "CORS / network / input error";
    response.textContent = error instanceof Error ? error.message : String(error);
  }
}

document.getElementById("network-form")?.addEventListener("submit", runNetworkRequest);
