// Scientific Mode Event Handlers
// NO ARITHMETIC - all computation delegated to CSS ALU

import { log } from '../main.js';

let sciDisplayVal = "0";
let sciExpressionVal = "";
let sciAccumulator = null;
let sciPendingOp = null;
let sciShouldResetDisplay = false;
let angleMode = "rad";

const sciDisplayEl = document.getElementById("sci-calculator-display");
const sciPreviewEl = document.getElementById("sci-expression-preview");

function updateSciUi() {
  if (sciDisplayEl) sciDisplayEl.textContent = sciDisplayVal.replace(".", ",");
  if (sciPreviewEl) sciPreviewEl.textContent = sciExpressionVal;
}

function handleSciNumInput(num) {
  if (num === ",") {
    if (sciShouldResetDisplay) {
      sciDisplayVal = "0.";
      sciShouldResetDisplay = false;
    } else if (!sciDisplayVal.includes(".")) {
      sciDisplayVal += ".";
    }
  } else {
    if (sciDisplayVal === "0" || sciShouldResetDisplay) {
      sciDisplayVal = num;
      sciShouldResetDisplay = false;
    } else {
      sciDisplayVal += num;
    }
  }
  updateSciUi();
}

function performSciOperation(op, val, callback) {
  const node = document.createElement("div");
  node.className = "request sci-task";
  node.dataset.val = String(val);
  node.dataset.op = op;
  
  const aluLane = document.getElementById("alu-lane");
  if (aluLane) aluLane.appendChild(node);
  
  log("INFO", "sci-alu", `scientific operation: ${op}(${val})`);
  
  setTimeout(() => {
    const style = getComputedStyle(node);
    const result = parseFloat(style.getPropertyValue("--sci-result").trim());
    log("INFO", "sci-alu", `scientific result: ${result}`);
    node.remove();
    callback(result);
  }, 100);
}

function handleSciOpInput(id, symbol) {
  const currentVal = parseFloat(sciDisplayVal);
  
  if (id === "sci-btn-c") {
    sciDisplayVal = "0";
    sciExpressionVal = "";
    sciAccumulator = null;
    sciPendingOp = null;
    sciShouldResetDisplay = false;
    updateSciUi();
  } else if (id === "sci-btn-back") {
    sciDisplayVal = sciDisplayVal.slice(0, -1);
    if (sciDisplayVal === "" || sciDisplayVal === "-") sciDisplayVal = "0";
    updateSciUi();
  } else if (id === "sci-btn-neg") {
    if (sciDisplayVal !== "0") {
      sciDisplayVal = sciDisplayVal.startsWith("-") ? sciDisplayVal.substring(1) : "-" + sciDisplayVal;
      updateSciUi();
    }
  } else if (id === "btn-pi") {
    sciDisplayVal = "3.14159265358979";
    sciShouldResetDisplay = true;
    updateSciUi();
  } else if (id === "btn-e") {
    sciDisplayVal = "2.71828182845905";
    sciShouldResetDisplay = true;
    updateSciUi();
  } else if (["btn-sin", "btn-cos", "btn-tan", "btn-csc", "btn-sec", "btn-cot", "btn-log", "btn-ln", "btn-sqrt2", "btn-abs", "btn-exp", "btn-x2", "btn-1/x"].includes(id)) {
    const opMap = {
      "btn-sin": "sin", "btn-cos": "cos", "btn-tan": "tan",
      "btn-csc": "csc", "btn-sec": "sec", "btn-cot": "cot",
      "btn-log": "log", "btn-ln": "ln", "btn-sqrt2": "sqrt",
      "btn-abs": "abs", "btn-exp": "exp", "btn-x2": "sqr", "btn-1/x": "inv"
    };
    
    const op = opMap[id];
    const preview = `${op}(${sciDisplayVal})`;
    
    performSciOperation(op, currentVal, (res) => {
      sciExpressionVal = `${preview} =`;
      sciDisplayVal = String(res);
      sciShouldResetDisplay = true;
      updateSciUi();
    });
  } else {
    let op = "";
    if (id === "sci-btn-add") op = "add";
    else if (id === "sci-btn-sub") op = "sub";
    else if (id === "sci-btn-mul") op = "mul";
    else if (id === "sci-btn-div") op = "div";
    
    if (sciAccumulator === null) {
      sciAccumulator = currentVal;
      sciPendingOp = op;
      sciExpressionVal = `${sciAccumulator} ${symbol}`;
      sciShouldResetDisplay = true;
      updateSciUi();
    } else if (sciPendingOp && !sciShouldResetDisplay) {
      sciAccumulator = currentVal;
      sciPendingOp = op;
      sciExpressionVal = `${sciAccumulator} ${symbol}`;
      sciShouldResetDisplay = true;
      updateSciUi();
    } else {
      sciPendingOp = op;
      sciExpressionVal = `${sciAccumulator} ${symbol}`;
      updateSciUi();
    }
  }
}

function handleSciEquals() {
  if (sciAccumulator === null || sciPendingOp === null) return;
  const currentVal = parseFloat(sciDisplayVal);
  
  const node = document.createElement("div");
  node.className = "request math-task";
  node.dataset.a = String(sciAccumulator);
  node.dataset.b = String(currentVal);
  node.dataset.op = sciPendingOp;
  
  const aluLane = document.getElementById("alu-lane");
  if (aluLane) aluLane.appendChild(node);
  
  setTimeout(() => {
    const style = getComputedStyle(node);
    const result = parseFloat(style.getPropertyValue("--result").trim());
    
    const opSymbol = { add: "+", sub: "−", mul: "×", div: "÷" }[sciPendingOp] || sciPendingOp;
    sciExpressionVal = `${sciAccumulator} ${opSymbol} ${currentVal} =`;
    sciDisplayVal = String(result);
    sciAccumulator = null;
    sciPendingOp = null;
    sciShouldResetDisplay = true;
    
    node.remove();
    updateSciUi();
  }, 100);
}

export function initScientificMode() {
  document.querySelectorAll("#scientific-grid .btn-num").forEach(btn => {
    btn.addEventListener("click", () => handleSciNumInput(btn.textContent.trim()));
  });
  
  document.querySelectorAll("#scientific-grid .btn-sci").forEach(btn => {
    btn.addEventListener("click", () => handleSciOpInput(btn.id, btn.textContent.trim()));
  });
  
  const sciEqBtn = document.getElementById("sci-btn-eq");
  if (sciEqBtn) sciEqBtn.addEventListener("click", handleSciEquals);
  
  document.querySelectorAll("#sci-mode-controls .sci-mode-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      angleMode = btn.dataset.angle;
      document.querySelectorAll("#sci-mode-controls .sci-mode-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      if (window.cssServerUpdateSettings) {
        window.cssServerUpdateSettings({ angleMode });
      } else {
        document.getElementById("calculator-app").dataset.angleMode = angleMode;
      }
      log("INFO", "sci-mode", `angle mode set to: ${angleMode}`);
    });
  });
  
  const appContainer = document.getElementById("calculator-app");
  if (appContainer) {
    angleMode = appContainer.dataset.angleMode || angleMode;
    document.querySelectorAll("#sci-mode-controls .sci-mode-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.angle === angleMode);
    });
  }

  // Dropdown menu toggle
  document.querySelectorAll(".sci-dropdown .dropdown-trigger").forEach(trigger => {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const dropdown = trigger.closest(".sci-dropdown");
      
      // Close all other dropdowns
      document.querySelectorAll(".sci-dropdown.open").forEach(d => {
        if (d !== dropdown) d.classList.remove("open");
      });
      
      dropdown.classList.toggle("open");
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener("click", () => {
    document.querySelectorAll(".sci-dropdown.open").forEach(d => {
      d.classList.remove("open");
    });
  });

  // Handle dropdown item clicks
  document.querySelectorAll(".sci-dropdown .dropdown-item").forEach(item => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      const func = item.dataset.func;
      const dropdown = item.closest(".sci-dropdown");
      
      log("INFO", "sci-dropdown", `selected function: ${func}`);
      
      // Trigger the corresponding operation
      if (["sin", "cos", "tan", "csc", "sec", "cot"].includes(func)) {
        const trigBtn = document.getElementById(`btn-${func}`);
        if (trigBtn) {
          trigBtn.click();
        } else {
          // If trig button is not in grid, execute directly
          const currentVal = parseFloat(sciDisplayVal);
          const preview = `${func}(${sciDisplayVal})`;
          performSciOperation(func, currentVal, (res) => {
            sciExpressionVal = `${preview} =`;
            sciDisplayVal = String(res);
            sciShouldResetDisplay = true;
            updateSciUi();
          });
        }
      } else if (["floor", "ceil", "round"].includes(func)) {
        const currentVal = parseFloat(sciDisplayVal);
        const preview = `${func}(${sciDisplayVal})`;
        performSciOperation(func, currentVal, (res) => {
          sciExpressionVal = `${preview} =`;
          sciDisplayVal = String(res);
          sciShouldResetDisplay = true;
          updateSciUi();
        });
      }
      
      dropdown.classList.remove("open");
    });
  });

  log("INFO", "sci-mode", "scientific mode initialized");
}
