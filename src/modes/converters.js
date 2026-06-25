// Converter Mode Event Handlers
// NO ARITHMETIC - all computation delegated to CSS ALU

import { log } from '../main.js';

function injectStandaloneScrollFix() {
  if (document.getElementById("standalone-settings-scroll-fix")) return;

  const style = document.createElement("style");
  style.id = "standalone-settings-scroll-fix";
  style.textContent = `
    #calculator-app[data-active-mode="settings"] #calculator-pane {
      min-height: 0;
      overflow: hidden;
    }

    #calculator-app[data-active-mode="settings"] .mode-settings {
      flex: 1 1 auto;
      min-height: 0;
      height: auto;
      overflow-y: auto;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
      padding-bottom: clamp(24px, 4vh, 40px);
    }

    #calculator-app[data-active-mode="settings"] .settings-panel {
      flex: 0 0 auto;
    }
  `;
  document.head.appendChild(style);
}

injectStandaloneScrollFix();

const converterConfigs = {
  currency: {
    fromSelect: "#currency-from", toSelect: "#currency-to",
    fromInput: "#currency-from-val", toInput: "#currency-to-val",
    swapBtn: "#currency-swap", taskClass: "conv-task-currency"
  },
  volume: {
    fromSelect: "#volume-from", toSelect: "#volume-to",
    fromInput: "#volume-from-val", toInput: "#volume-to-val",
    swapBtn: "#volume-swap", taskClass: "conv-task-volume"
  },
  length: {
    fromSelect: "#length-from", toSelect: "#length-to",
    fromInput: "#length-from-val", toInput: "#length-to-val",
    swapBtn: "#length-swap", taskClass: "conv-task-length"
  },
  weight: {
    fromSelect: "#weight-from", toSelect: "#weight-to",
    fromInput: "#weight-from-val", toInput: "#weight-to-val",
    swapBtn: "#weight-swap", taskClass: "conv-task-weight"
  },
  temperature: {
    fromSelect: "#temp-from", toSelect: "#temp-to",
    fromInput: "#temp-from-val", toInput: "#temp-to-val",
    swapBtn: "#temp-swap", taskClass: "conv-task-temp"
  },
  time: {
    fromSelect: "#time-from", toSelect: "#time-to",
    fromInput: "#time-from-val", toInput: "#time-to-val",
    swapBtn: "#time-swap", taskClass: "conv-task-time"
  }
};

function performConversion(config) {
  const fromSelect = document.querySelector(config.fromSelect);
  const toSelect = document.querySelector(config.toSelect);
  const fromInput = document.querySelector(config.fromInput);
  const toInput = document.querySelector(config.toInput);
  
  if (!fromSelect || !toSelect || !fromInput || !toInput) return;
  
  const value = parseFloat(fromInput.value) || 0;
  const fromUnit = fromSelect.value;
  const toUnit = toSelect.value;
  
  const node = document.createElement("div");
  node.className = `request ${config.taskClass}`;
  node.dataset.value = String(value);
  node.dataset.from = fromUnit;
  node.dataset.to = toUnit;
  
  const aluLane = document.getElementById("alu-lane");
  if (aluLane) aluLane.appendChild(node);
  
  setTimeout(() => {
    const style = getComputedStyle(node);
    const result = parseFloat(style.getPropertyValue("--conv-result").trim()) || 0;
    const formattedResult = String(Number(result.toPrecision(12)));
    const display = toInput.closest(".converter-mode")?.querySelector("#converter-result");

    toInput.value = formattedResult;
    if (display) display.textContent = formattedResult;
    node.remove();
    log("INFO", "converter", `${value} ${fromUnit} = ${formattedResult} ${toUnit}`);
  }, 100);
}

function initConverter(config) {
  const fromSelect = document.querySelector(config.fromSelect);
  const toSelect = document.querySelector(config.toSelect);
  const fromInput = document.querySelector(config.fromInput);
  const swapBtn = document.querySelector(config.swapBtn);
  
  if (fromSelect) fromSelect.addEventListener("change", () => performConversion(config));
  if (toSelect) toSelect.addEventListener("change", () => performConversion(config));
  if (fromInput) fromInput.addEventListener("input", () => performConversion(config));
  if (swapBtn) {
    swapBtn.addEventListener("click", () => {
      const temp = fromSelect.value;
      fromSelect.value = toSelect.value;
      toSelect.value = temp;
      performConversion(config);
    });
  }
  
  performConversion(config);
}

export function initConverters() {
  Object.values(converterConfigs).forEach(config => initConverter(config));
  log("INFO", "converters", "all converter modes initialized");
}
