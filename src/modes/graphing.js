// Graphing Mode Event Handlers
// NO ARITHMETIC - all computation delegated to CSS ALU

import { log } from '../main.js';

let functions = ["sin(x)"];
let xMin = -10;
let xMax = 10;
let yMin = -10;
let yMax = 10;

const graphCanvas = document.getElementById("graph-canvas");

function parseFunction(funcStr) {
  const match = funcStr.match(/^(\w+)\(x\)$/);
  return match ? match[1] : "sin";
}

function plotFunction(funcName, x) {
  const node = document.createElement("div");
  node.className = "request graph-task";
  node.dataset.x = String(x);
  node.dataset.func = funcName;
  
  const aluLane = document.getElementById("alu-lane");
  if (aluLane) aluLane.appendChild(node);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const style = getComputedStyle(node);
      const result = parseFloat(style.getPropertyValue("--graph-result").trim());
      node.remove();
      resolve(result);
    }, 10);
  });
}

async function renderGraph() {
  if (!graphCanvas) return;
  
  graphCanvas.querySelectorAll(".graph-point").forEach(p => p.remove());
  
  const width = graphCanvas.clientWidth || 300;
  const height = graphCanvas.clientHeight || 250;
  
  for (const funcStr of functions) {
    const funcName = parseFunction(funcStr);
    
    for (let px = 0; px < width; px += 2) {
      const x = xMin + (px / width) * (xMax - xMin);
      const y = await plotFunction(funcName, x);
      
      if (!isNaN(y) && isFinite(y)) {
        const py = height - ((y - yMin) / (yMax - yMin)) * height;
        
        if (py >= 0 && py <= height) {
          const point = document.createElement("div");
          point.className = "graph-point";
          point.style.cssText = `left:${px}px;top:${py}px;background:#8553f4;width:2px;height:2px;position:absolute;border-radius:50%;`;
          graphCanvas.appendChild(point);
        }
      }
    }
  }
  
  log("INFO", "graph", `rendered ${functions.length} function(s)`);
}

export function initGraphingMode() {
  const funcInput = document.querySelector(".func-input");
  if (funcInput) {
    funcInput.addEventListener("change", (e) => {
      functions = [e.target.value];
      log("INFO", "graph", `function updated to: ${e.target.value}`);
      renderGraph();
    });
  }
  
  document.getElementById("zoom-in")?.addEventListener("click", () => {
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    xMin += xRange * 0.1;
    xMax -= xRange * 0.1;
    yMin += yRange * 0.1;
    yMax -= yRange * 0.1;
    renderGraph();
  });
  
  document.getElementById("zoom-out")?.addEventListener("click", () => {
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    xMin -= xRange * 0.1;
    xMax += xRange * 0.1;
    yMin -= yRange * 0.1;
    yMax += yRange * 0.1;
    renderGraph();
  });
  
  document.getElementById("zoom-fit")?.addEventListener("click", () => {
    xMin = -10;
    xMax = 10;
    yMin = -10;
    yMax = 10;
    renderGraph();
  });
  
  // Set up resize observer to re-render when canvas size changes
  try {
    const resizeObserver = new ResizeObserver(() => {
      renderGraph();
    });
    resizeObserver.observe(graphCanvas);
  } catch (e) {
    setTimeout(renderGraph, 100);
  }
  
  log("INFO", "graph-mode", "graphing mode initialized");
}
