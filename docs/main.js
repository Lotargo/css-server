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
