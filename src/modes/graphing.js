// Graphing Mode Event Handlers
// NO ARITHMETIC - all computation delegated to CSS ALU

import { log } from '../main.js';

let equations = [""]; // Start with one empty expression field
let activeInputIndex = 0;
let xMin = -10;
let xMax = 10;
let yMin = -10;
let yMax = 10;
let angleUnits = "rad";

const colors = ["#a88df8", "#34c759", "#007aff", "#ff9500", "#ff3b30"];

const graphCanvas = document.getElementById("graph-canvas");

function parseEquation(eqStr) {
  if (!eqStr) return null;
  // Normalize string: remove spaces, lowercase
  const str = eqStr.replace(/\s+/g, '').toLowerCase();
  
  let func = "none";
  let scaleY = 1;
  let scaleX = 1;
  let shiftX = 0;
  let shiftY = 0;
  
  if (str === "") return null;
  
  // Try matching: [scaleY? *?] [func] ( [scaleX?] x [+/- shiftX?] ) [+/- shiftY?]
  // Functions: sin, cos, tan, log, ln, sqrt, abs, exp, x2 (as x^2), x3 (as x^3)
  const knownFuncs = ["sin", "cos", "tan", "log", "ln", "sqrt", "abs", "exp", "x^3", "x^2", "x3", "x2"];
  let foundFunc = null;
  for (const f of knownFuncs) {
    if (str.includes(f)) {
      foundFunc = f;
      break;
    }
  }
  
  if (foundFunc) {
    // Determine func identifier for CSS
    if (foundFunc === "x^2" || foundFunc === "x2") func = "x2";
    else if (foundFunc === "x^3" || foundFunc === "x3") func = "x3";
    else func = foundFunc;
    
    // Split by the function
    const parts = str.split(foundFunc);
    
    // Part before function is scaleY
    let before = parts[0];
    if (before !== "") {
      if (before.endsWith("*")) before = before.slice(0, -1);
      if (before === "-") scaleY = -1;
      else if (before === "+") scaleY = 1;
      else {
        const parsedVal = parseFloat(before);
        if (!isNaN(parsedVal)) scaleY = parsedVal;
      }
    }
    
    // Part after function contains (scaleX * x + shiftX) and shiftY
    let after = parts[1];
    if (after !== "") {
      if (func === "x2" || func === "x3") {
        const parsedVal = parseFloat(after);
        if (!isNaN(parsedVal)) shiftY = parsedVal;
      } else {
        // It has parentheses: e.g. (2*x+1) + 3
        const parenMatch = after.match(/^\(([^)]+)\)(.*)$/);
        if (parenMatch) {
          const inside = parenMatch[1];
          const outside = parenMatch[2];
          
          // Parse inside: scaleX * x + shiftX
          if (inside.includes("x")) {
            const xParts = inside.split("x");
            let xBefore = xParts[0];
            if (xBefore !== "") {
              if (xBefore.endsWith("*")) xBefore = xBefore.slice(0, -1);
              if (xBefore === "-") scaleX = -1;
              else if (xBefore === "+") scaleX = 1;
              else {
                const parsedVal = parseFloat(xBefore);
                if (!isNaN(parsedVal)) scaleX = parsedVal;
              }
            }
            let xAfter = xParts[1];
            if (xAfter !== "") {
              const parsedVal = parseFloat(xAfter);
              if (!isNaN(parsedVal)) shiftX = parsedVal;
            }
          }
          
          // Parse outside: shiftY
          if (outside !== "") {
            const parsedVal = parseFloat(outside);
            if (!isNaN(parsedVal)) shiftY = parsedVal;
          }
        }
      }
    }
  } else {
    // Linear function: e.g. 2*x - 3
    if (str.includes("x")) {
      const parts = str.split("x");
      let before = parts[0];
      if (before !== "") {
        if (before.endsWith("*")) before = before.slice(0, -1);
        if (before === "-") scaleY = -1;
        else if (before === "+") scaleY = 1;
        else {
          const parsedVal = parseFloat(before);
          if (!isNaN(parsedVal)) scaleY = parsedVal;
        }
      }
      let after = parts[1];
      if (after !== "") {
        const parsedVal = parseFloat(after);
        if (!isNaN(parsedVal)) shiftY = parsedVal;
      }
      func = "none";
    } else {
      // Constant function: e.g. 5
      const parsedVal = parseFloat(str);
      if (!isNaN(parsedVal)) {
        shiftY = parsedVal;
        scaleY = 0;
      }
      func = "none";
    }
  }
  
  return { func, scaleY, scaleX, shiftX, shiftY };
}

function plotFunctionPoints(parsedEq, xArray) {
  const aluLane = document.getElementById("alu-lane");
  if (!aluLane) return Promise.resolve([]);
  
  const nodes = xArray.map(x => {
    const node = document.createElement("div");
    node.className = "request graph-task";
    node.dataset.x = String(x);
    node.dataset.func = parsedEq.func;
    node.dataset.scaleY = String(parsedEq.scaleY);
    node.dataset.scaleX = String(parsedEq.scaleX);
    node.dataset.shiftX = String(parsedEq.shiftX);
    node.dataset.shiftY = String(parsedEq.shiftY);
    aluLane.appendChild(node);
    return node;
  });
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const results = nodes.map(node => {
        const style = getComputedStyle(node);
        const resultStr = style.getPropertyValue("--graph-result").trim();
        const result = parseFloat(resultStr);
        node.remove();
        return result;
      });
      resolve(results);
    }, 25);
  });
}

function calculateStepSize(min, max, targetLines = 8) {
  const range = max - min;
  const rawStep = range / targetLines;
  const log10 = Math.log10(rawStep);
  const power = Math.floor(log10);
  const ratio = rawStep / Math.pow(10, power);
  
  let step;
  if (ratio < 1.5) step = 1;
  else if (ratio < 3.5) step = 2;
  else if (ratio < 7.5) step = 5;
  else step = 10;
  
  return step * Math.pow(10, power);
}

function getScreenCoords(x, y, width, height) {
  const px = ((x - xMin) / (xMax - xMin)) * width;
  const py = height - ((y - yMin) / (yMax - yMin)) * height;
  return { px, py };
}

function getMathCoords(px, py, width, height) {
  const x = xMin + (px / width) * (xMax - xMin);
  const y = yMin + ((height - py) / height) * (yMax - yMin);
  return { x, y };
}

async function renderGraph() {
  if (!graphCanvas) return;
  
  const dpr = window.devicePixelRatio || 1;
  const rect = graphCanvas.getBoundingClientRect();
  graphCanvas.width = rect.width * dpr;
  graphCanvas.height = rect.height * dpr;
  
  const ctx = graphCanvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const width = rect.width;
  const height = rect.height;
  
  ctx.clearRect(0, 0, width, height);
  
  if (width === 0 || height === 0) return;
  
  // Calculate dynamic steps
  const xStep = calculateStepSize(xMin, xMax, 10);
  const yStep = calculateStepSize(yMin, yMax, 8);
  
  // Draw Grid Lines
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "10px Inter, sans-serif";
  
  // Vertical Grid Lines
  const firstX = Math.ceil(xMin / xStep) * xStep;
  for (let val = firstX; val <= xMax; val += xStep) {
    if (Math.abs(val) < 1e-10) continue;
    
    const { px } = getScreenCoords(val, 0, width, height);
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, height);
    ctx.stroke();
    
    // Position label near horizontal axis
    const center = getScreenCoords(0, 0, width, height);
    let labelY = center.py + 14;
    if (labelY < 14) labelY = 14;
    if (labelY > height - 6) labelY = height - 6;
    
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(String(Number(val.toFixed(4))), px, labelY);
  }
  
  // Horizontal Grid Lines
  const firstY = Math.ceil(yMin / yStep) * yStep;
  for (let val = firstY; val <= yMax; val += yStep) {
    if (Math.abs(val) < 1e-10) continue;
    
    const { py } = getScreenCoords(0, val, width, height);
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(width, py);
    ctx.stroke();
    
    // Position label near vertical axis
    const center = getScreenCoords(0, 0, width, height);
    let labelX = center.px - 6;
    if (labelX < 6) labelX = 6;
    if (labelX > width - 24) labelX = width - 24;
    
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(String(Number(val.toFixed(4))), labelX, py);
  }
  
  // Draw Main Axes
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  const center = getScreenCoords(0, 0, width, height);
  
  // Draw X-axis
  if (center.py >= 0 && center.py <= height) {
    ctx.beginPath();
    ctx.moveTo(0, center.py);
    ctx.lineTo(width, center.py);
    ctx.stroke();
    
    // X arrowhead
    ctx.beginPath();
    ctx.moveTo(width, center.py);
    ctx.lineTo(width - 6, center.py - 3);
    ctx.lineTo(width - 6, center.py + 3);
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.fill();
    
    // X label
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText("x", width - 8, center.py - 4);
  }
  
  // Draw Y-axis
  if (center.px >= 0 && center.px <= width) {
    ctx.beginPath();
    ctx.moveTo(center.px, height);
    ctx.lineTo(center.px, 0);
    ctx.stroke();
    
    // Y arrowhead
    ctx.beginPath();
    ctx.moveTo(center.px, 0);
    ctx.lineTo(center.px - 3, 6);
    ctx.lineTo(center.px + 3, 6);
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.fill();
    
    // Y label
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("y", center.px + 6, 6);
  }
  
  // Draw origin "0" label
  if (center.px >= 0 && center.px <= width && center.py >= 0 && center.py <= height) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText("0", center.px - 4, center.py + 4);
  }
  
  // Plot curves
  for (let i = 0; i < equations.length; i++) {
    const eqStr = equations[i];
    if (!eqStr || eqStr.trim() === "") continue;
    
    const parsedEq = parseEquation(eqStr);
    if (!parsedEq) continue;
    
    const stepCount = Math.floor(width / 2);
    const xArray = [];
    const pxArray = [];
    
    for (let step = 0; step <= stepCount; step++) {
      const px = step * 2;
      const { x } = getMathCoords(px, 0, width, height);
      xArray.push(x);
      pxArray.push(px);
    }
    
    const yArray = await plotFunctionPoints(parsedEq, xArray);
    
    ctx.beginPath();
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = colors[i % colors.length];
    
    let first = true;
    for (let j = 0; j < xArray.length; j++) {
      const y = yArray[j];
      const px = pxArray[j];
      
      if (isNaN(y) || !isFinite(y)) {
        first = true;
        continue;
      }
      
      const { py } = getScreenCoords(0, y, width, height);
      
      // Allow line drawing slightly outside view boundaries for seamless transition
      if (py >= -20 && py <= height + 20) {
        if (first) {
          ctx.moveTo(px, py);
          first = false;
        } else {
          ctx.lineTo(px, py);
        }
      } else {
        first = true;
      }
    }
    ctx.stroke();
  }
  
  log("INFO", "graph", `rendered ${equations.filter(e => e !== "").length} active functions`);
}

function renderEquationsList() {
  const listEl = document.getElementById("graph-equations-list");
  if (!listEl) return;
  
  listEl.innerHTML = "";
  
  equations.forEach((eq, index) => {
    const item = document.createElement("div");
    item.className = "equation-item";
    
    const dot = document.createElement("button");
    dot.className = "eq-color-dot";
    dot.style.backgroundColor = colors[index % colors.length];
    
    const input = document.createElement("input");
    input.type = "text";
    input.className = "eq-input-field";
    input.value = eq;
    input.placeholder = "Введите выражение (например, sin(x))";
    input.dataset.index = index;
    
    input.addEventListener("input", (e) => {
      equations[index] = e.target.value;
      renderGraph();
    });
    
    input.addEventListener("focus", () => {
      activeInputIndex = index;
    });
    
    const delBtn = document.createElement("button");
    delBtn.className = "eq-delete-btn";
    delBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
    `;
    delBtn.addEventListener("click", () => {
      equations.splice(index, 1);
      if (equations.length === 0) {
        equations.push("");
      }
      activeInputIndex = Math.min(activeInputIndex, equations.length - 1);
      renderEquationsList();
      renderGraph();
    });
    
    item.appendChild(dot);
    item.appendChild(input);
    item.appendChild(delBtn);
    listEl.appendChild(item);
  });
}

function insertAtCursor(text) {
  const inputs = document.querySelectorAll(".eq-input-field");
  const activeInput = inputs[activeInputIndex];
  if (!activeInput) return;
  
  const start = activeInput.selectionStart || 0;
  const end = activeInput.selectionEnd || 0;
  const val = activeInput.value;
  
  activeInput.value = val.substring(0, start) + text + val.substring(end);
  activeInput.selectionStart = activeInput.selectionEnd = start + text.length;
  activeInput.focus();
  
  equations[activeInputIndex] = activeInput.value;
  renderGraph();
}

export function initGraphingMode() {
  renderEquationsList();
  
  // Set up equations add button
  document.getElementById("add-equation-btn")?.addEventListener("click", () => {
    equations.push("");
    activeInputIndex = equations.length - 1;
    renderEquationsList();
    
    // Focus the newly added input
    const inputs = document.querySelectorAll(".eq-input-field");
    const lastInput = inputs[inputs.length - 1];
    if (lastInput) lastInput.focus();
  });
  
  // Set up math keyboard
  document.querySelectorAll("#graph-keyboard .kb-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.key;
      const keyMap = {
        "pi": "π",
        "e": "e",
        "x^2": "x^2",
        "1/x": "1/x",
        "abs": "abs(x)",
        "x": "x",
        "y": "y",
        "sqrt": "sqrt(x)",
        "(": "(",
        ")": ")",
        "=": "=",
        "/": "/",
        "x^y": "^",
        "10^x": "10^",
        "log": "log(x)",
        "ln": "ln(x)",
        "neg": "-",
        ",": ",",
        "*": "*",
        "+": "+",
        "-": "-",
        "7": "7", "8": "8", "9": "9",
        "4": "4", "5": "5", "6": "6",
        "1": "1", "2": "2", "3": "3",
        "0": "0"
      };
      
      const inputs = document.querySelectorAll(".eq-input-field");
      const activeInput = inputs[activeInputIndex];
      
      if (key === "clear") {
        if (activeInput) {
          activeInput.value = "";
          equations[activeInputIndex] = "";
          activeInput.focus();
          renderGraph();
        }
      } else if (key === "backspace") {
        if (activeInput) {
          const start = activeInput.selectionStart || 0;
          const end = activeInput.selectionEnd || 0;
          const val = activeInput.value;
          if (start === end) {
            if (start > 0) {
              activeInput.value = val.substring(0, start - 1) + val.substring(end);
              activeInput.selectionStart = activeInput.selectionEnd = start - 1;
            }
          } else {
            activeInput.value = val.substring(0, start) + val.substring(end);
            activeInput.selectionStart = activeInput.selectionEnd = start;
          }
          equations[activeInputIndex] = activeInput.value;
          activeInput.focus();
          renderGraph();
        }
      } else if (key === "enter") {
        renderGraph();
      } else if (keyMap[key]) {
        insertAtCursor(keyMap[key]);
      }
    });
  });
  
  // Set up zoom controls
  const boundsInputs = {
    xmin: document.getElementById("settings-xmin"),
    xmax: document.getElementById("settings-xmax"),
    ymin: document.getElementById("settings-ymin"),
    ymax: document.getElementById("settings-ymax")
  };
  
  function updateSettingsInputs() {
    if (boundsInputs.xmin) boundsInputs.xmin.value = String(Number(xMin.toFixed(4)));
    if (boundsInputs.xmax) boundsInputs.xmax.value = String(Number(xMax.toFixed(4)));
    if (boundsInputs.ymin) boundsInputs.ymin.value = String(Number(yMin.toFixed(4)));
    if (boundsInputs.ymax) boundsInputs.ymax.value = String(Number(yMax.toFixed(4)));
  }
  
  document.getElementById("zoom-in")?.addEventListener("click", () => {
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    xMin += xRange * 0.15;
    xMax -= xRange * 0.15;
    yMin += yRange * 0.15;
    yMax -= yRange * 0.15;
    updateSettingsInputs();
    renderGraph();
  });
  
  document.getElementById("zoom-out")?.addEventListener("click", () => {
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    xMin -= xRange * 0.15;
    xMax += xRange * 0.15;
    yMin -= yRange * 0.15;
    yMax += yRange * 0.15;
    updateSettingsInputs();
    renderGraph();
  });
  
  document.getElementById("zoom-fit")?.addEventListener("click", () => {
    xMin = -10;
    xMax = 10;
    yMin = -10;
    yMax = 10;
    updateSettingsInputs();
    renderGraph();
  });
  
  // Settings popup toggle
  const settingsPopup = document.getElementById("graph-settings-popup");
  const settingsToggle = document.getElementById("graph-settings-toggle");
  const closeSettingsBtn = document.getElementById("close-settings-btn");
  
  if (settingsToggle && settingsPopup) {
    settingsToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      settingsPopup.classList.toggle("open");
    });
  }
  
  if (closeSettingsBtn && settingsPopup) {
    closeSettingsBtn.addEventListener("click", () => {
      settingsPopup.classList.remove("open");
    });
  }
  
  document.addEventListener("click", (e) => {
    if (settingsPopup && settingsPopup.classList.contains("open")) {
      if (!settingsPopup.contains(e.target) && e.target !== settingsToggle) {
        settingsPopup.classList.remove("open");
      }
    }
  });
  
  // Settings limits changes
  function updateBoundsFromSettings() {
    const xn = parseFloat(boundsInputs.xmin.value);
    const xx = parseFloat(boundsInputs.xmax.value);
    const yn = parseFloat(boundsInputs.ymin.value);
    const yx = parseFloat(boundsInputs.ymax.value);
    
    if (!isNaN(xn) && !isNaN(xx) && xx > xn) {
      xMin = xn;
      xMax = xx;
    }
    if (!isNaN(yn) && !isNaN(yx) && yx > yn) {
      yMin = yn;
      yMax = yx;
    }
    renderGraph();
  }
  
  Object.values(boundsInputs).forEach(input => {
    input?.addEventListener("change", updateBoundsFromSettings);
  });
  
  // Angle Units toggle
  const unitBtns = document.querySelectorAll(".unit-toggle-btn");
  unitBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      unitBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      angleUnits = btn.dataset.unit;
      
      const appContainer = document.getElementById("calculator-app");
      if (appContainer) {
        appContainer.dataset.angleMode = angleUnits;
      }
      
      log("INFO", "graph", `coordinate angle units set to: ${angleUnits}`);
      renderGraph();
    });
  });
  
  // Reset Settings View
  document.getElementById("settings-reset-btn")?.addEventListener("click", () => {
    xMin = -10;
    xMax = 10;
    yMin = -10;
    yMax = 10;
    updateSettingsInputs();
    renderGraph();
  });
  
  // View Toggle button (equation vs graph sidebar toggle)
  const viewToggle = document.getElementById("graph-view-toggle");
  const sidePanel = document.getElementById("graph-side-panel");
  if (viewToggle && sidePanel) {
    viewToggle.addEventListener("click", () => {
      const isVisible = sidePanel.style.display !== "none";
      if (isVisible) {
        sidePanel.style.display = "none";
        viewToggle.classList.remove("active");
      } else {
        sidePanel.style.display = "flex";
        viewToggle.classList.add("active");
      }
      setTimeout(renderGraph, 50);
    });
  }
  
  // ResizeObserver for canvas
  try {
    const resizeObserver = new ResizeObserver(() => {
      renderGraph();
    });
    resizeObserver.observe(graphCanvas);
  } catch (e) {
    window.addEventListener("resize", renderGraph);
  }
  
  updateSettingsInputs();
  setTimeout(renderGraph, 100);
  log("INFO", "graph-mode", "graphing mode initialized");
}
