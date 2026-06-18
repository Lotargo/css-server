const { listen, emit } = window.__TAURI__.event;

let activeCount = 0;
const inbound = document.getElementById("inbound");
const aluLane = document.getElementById("alu-lane");

function updateCounter() {
  document.getElementById("status-counter").textContent = `active: ${activeCount}`;
}

async function setup() {
  await listen("http-request", (event) => {
    const { request_id, a, b } = event.payload;

    const node = document.createElement("div");
    node.className = "request add-task";
    node.dataset.requestId = request_id;
    node.dataset.a = String(a);
    node.dataset.b = String(b);

    node.addEventListener("animationend", () => {
      const style = getComputedStyle(node);
      const result = style.getPropertyValue("--result").trim();

      emit("http-response", {
        requestId: request_id,
        result: result || "NaN",
      });

      node.remove();
      activeCount = Math.max(0, activeCount - 1);
      updateCounter();
    });

    inbound.appendChild(node);
    activeCount++;
    updateCounter();

    // Transfer to ALU lane after a brief visualisation delay
    setTimeout(() => {
      aluLane.appendChild(node);
    }, 400);
  });
}

setup();
