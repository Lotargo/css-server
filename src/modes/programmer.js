// Programmer Mode Event Handlers
// NO ARITHMETIC - all computation delegated to CSS ALU

import { log } from '../main.js';

let progDisplayVal = "0";
let progExpressionVal = "";
let progAccumulator = null;
let progPendingOp = null;
let progShouldResetDisplay = false;
let currentBase = "dec";
let wordSize = 64;

const progDisplayEl = document.getElementById("prog-calculator-display");
const progPreviewEl = document.getElementById("prog-expression-preview");

function updateProgUi() {
  if (progDisplayEl) progDisplayEl.textContent = progDisplayVal;
  if (progPreviewEl) progPreviewEl.textContent = progExpressionVal;
  
  const decVal = parseInt(progDisplayVal, getBaseRadix(currentBase)) || 0;
  updateBaseDisplays(decVal);
  
  document.querySelectorAll("#programmer-grid .btn-hex").forEach(btn => {
    btn.disabled = currentBase !== "hex";
  });
  
  document.querySelectorAll("#programmer-grid .btn-num:not(.btn-hex)").forEach(btn => {
    const text = btn.textContent.trim();
    if (text >= "0" && text <= "9") {
      const digit = parseInt(text);
      if (currentBase === "oct") btn.disabled = digit >= 8;
      else if (currentBase === "bin") btn.disabled = digit > 1;
      else btn.disabled = false;
    }
  });
}

function getBaseRadix(base) {
  return { hex: 16, dec: 10, oct: 8, bin: 2 }[base] || 10;
}

function updateBaseDisplays(decVal) {
  const hexEl = document.getElementById("prog-hex");
  const decEl = document.getElementById("prog-dec");
  const octEl = document.getElementById("prog-oct");
  const binEl = document.getElementById("prog-bin");
  
  if (hexEl) hexEl.textContent = `HEX: ${decVal.toString(16).toUpperCase()}`;
  if (decEl) decEl.textContent = `DEC: ${decVal}`;
  if (octEl) octEl.textContent = `OCT: ${decVal.toString(8)}`;
  if (binEl) binEl.textContent = `BIN: ${decVal.toString(2)}`;
  
  document.querySelectorAll(".base-value").forEach(el => el.classList.remove("active"));
  const activeEl = document.getElementById(`prog-${currentBase}`);
  if (activeEl) activeEl.classList.add("active");
}

function handleProgNumInput(num) {
  if (progDisplayVal === "0" || progShouldResetDisplay) {
    progDisplayVal = num;
    progShouldResetDisplay = false;
  } else {
    progDisplayVal += num;
  }
  updateProgUi();
}

function handleProgOpInput(id, symbol) {
  const currentVal = parseInt(progDisplayVal, getBaseRadix(currentBase)) || 0;
  
  if (id === "prog-btn-c") {
    progDisplayVal = "0";
    progExpressionVal = "";
    progAccumulator = null;
    progPendingOp = null;
    progShouldResetDisplay = false;
    updateProgUi();
  } else if (id === "prog-btn-ce") {
    progDisplayVal = "0";
    updateProgUi();
  } else if (id === "prog-btn-back") {
    progDisplayVal = progDisplayVal.slice(0, -1);
    if (progDisplayVal === "" || progDisplayVal === "-") progDisplayVal = "0";
    updateProgUi();
  } else if (["prog-btn-and", "prog-btn-or", "prog-btn-xor", "prog-btn-not", "prog-btn-lshift", "prog-btn-rshift"].includes(id)) {
    const opMap = {
      "prog-btn-and": "and", "prog-btn-or": "or", "prog-btn-xor": "xor",
      "prog-btn-not": "not", "prog-btn-lshift": "lshift", "prog-btn-rshift": "rshift"
    };
    
    const op = opMap[id];
    const node = document.createElement("div");
    node.className = "request prog-bitwise-task";
    node.dataset.a = String(currentVal);
    node.dataset.b = "0";
    node.dataset.op = op;
    
    const aluLane = document.getElementById("alu-lane");
    if (aluLane) aluLane.appendChild(node);
    
    setTimeout(() => {
      const style = getComputedStyle(node);
      const result = parseInt(style.getPropertyValue("--result").trim()) || 0;
      progExpressionVal = `${op}(${progDisplayVal}) =`;
      
      // Convert result back to current base representation
      progDisplayVal = result.toString(getBaseRadix(currentBase)).toUpperCase();
      progShouldResetDisplay = true;
      node.remove();
      updateProgUi();
    }, 100);
  } else {
    let op = "";
    if (id === "prog-btn-div") op = "div";
    else if (id === "prog-btn-mul") op = "mul";
    else if (id === "prog-btn-sub") op = "sub";
    else if (id === "prog-btn-add") op = "add";
    else if (id === "prog-btn-mod") op = "mod";
    
    if (progAccumulator === null) {
      progAccumulator = currentVal;
      progPendingOp = op;
      progExpressionVal = `${progAccumulator} ${symbol}`;
      progShouldResetDisplay = true;
      updateProgUi();
    } else {
      progPendingOp = op;
      progExpressionVal = `${progAccumulator} ${symbol}`;
      updateProgUi();
    }
  }
}

function handleProgEquals() {
  if (progAccumulator === null || progPendingOp === null) return;
  const currentVal = parseInt(progDisplayVal, getBaseRadix(currentBase)) || 0;
  
  const node = document.createElement("div");
  node.className = "request math-task";
  node.dataset.a = String(progAccumulator);
  node.dataset.b = String(currentVal);
  node.dataset.op = progPendingOp;
  
  const aluLane = document.getElementById("alu-lane");
  if (aluLane) aluLane.appendChild(node);
  
  setTimeout(() => {
    const style = getComputedStyle(node);
    const result = parseFloat(style.getPropertyValue("--result").trim()) || 0;
    
    const opSymbol = { div: "÷", mul: "×", sub: "−", add: "+", mod: "mod" }[progPendingOp] || progPendingOp;
    progExpressionVal = `${progAccumulator} ${opSymbol} ${currentVal} =`;
    
    // Convert result back to current base representation
    progDisplayVal = result.toString(getBaseRadix(currentBase)).toUpperCase();
    progAccumulator = null;
    progPendingOp = null;
    progShouldResetDisplay = true;
    
    node.remove();
    updateProgUi();
  }, 100);
}

export function initProgrammerMode() {
  document.querySelectorAll("#programmer-grid .btn-num").forEach(btn => {
    btn.addEventListener("click", () => handleProgNumInput(btn.textContent.trim()));
  });
  
  document.querySelectorAll("#programmer-grid .btn-prog, #programmer-grid .btn-op").forEach(btn => {
    btn.addEventListener("click", () => handleProgOpInput(btn.id, btn.textContent.trim()));
  });
  
  const progEqBtn = document.getElementById("prog-btn-eq");
  if (progEqBtn) progEqBtn.addEventListener("click", handleProgEquals);
  
  document.querySelectorAll("#prog-mode-controls .prog-mode-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const oldBase = currentBase;
      const decVal = parseInt(progDisplayVal, getBaseRadix(oldBase)) || 0;
      currentBase = btn.dataset.base;
      
      document.querySelectorAll("#prog-mode-controls .prog-mode-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      // Update display string to new base
      progDisplayVal = decVal.toString(getBaseRadix(currentBase)).toUpperCase();
      
      log("INFO", "prog-mode", `base mode set to: ${currentBase}`);
      updateProgUi();
    });
  });
  
  document.querySelectorAll("#prog-word-size .word-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      wordSize = parseInt(btn.dataset.size);
      document.querySelectorAll("#prog-word-size .word-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      log("INFO", "prog-mode", `word size set to: ${wordSize}`);
    });
  });
  
  updateProgUi();
  log("INFO", "prog-mode", "programmer mode initialized");
}
