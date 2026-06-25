// Converter Mode Event Handlers
// NO ARITHMETIC - all computation delegated to CSS ALU

import { log } from '../main.js';

function setImportantStyle(element, property, value) {
  if (!element) return;
  element.style.setProperty(property, value, "important");
}

function applyStandaloneSettingsScrollFix() {
  const app = document.getElementById("calculator-app");
  const calculatorPane = document.getElementById("calculator-pane");
  const settingsMode = document.querySelector(".mode-settings");
  const settingsPanel = document.querySelector(".settings-panel");
  const aboutCard = document.querySelector(".settings-about-card");

  if (!app || !calculatorPane || !settingsMode || !settingsPanel) return false;

  setImportantStyle(calculatorPane, "min-height", "0");
  setImportantStyle(calculatorPane, "overflow", "hidden");

  setImportantStyle(settingsMode, "flex", "1 1 auto");
  setImportantStyle(settingsMode, "min-height", "0");
  setImportantStyle(settingsMode, "height", "auto");
  setImportantStyle(settingsMode, "max-height", "none");
  setImportantStyle(settingsMode, "overflow-x", "hidden");
  setImportantStyle(settingsMode, "overflow-y", "auto");
  settingsMode.style.setProperty("overscroll-behavior", "contain");
  settingsMode.style.setProperty("-webkit-overflow-scrolling", "touch");

  setImportantStyle(settingsPanel, "flex", "0 0 auto");
  setImportantStyle(settingsPanel, "height", "auto");
  setImportantStyle(settingsPanel, "max-height", "none");
  setImportantStyle(settingsPanel, "overflow", "visible");
  setImportantStyle(settingsPanel, "padding-bottom", "calc(clamp(16px, 3vw, 26px) + max(28px, env(safe-area-inset-bottom)))");

  if (aboutCard) {
    setImportantStyle(aboutCard, "overflow", "visible");
    setImportantStyle(aboutCard, "margin-bottom", "28px");
  }

  return true;
}

function injectStandaloneScrollFix() {
  if (!document.getElementById("standalone-settings-scroll-fix")) {
    const style = document.createElement("style");
    style.id = "standalone-settings-scroll-fix";
    style.textContent = `
      #calculator-app[data-active-mode="settings"] #calculator-pane {
        min-height: 0 !important;
        overflow: hidden !important;
      }

      #calculator-app[data-active-mode="settings"] .mode-settings {
        flex: 1 1 auto !important;
        min-height: 0 !important;
        height: auto !important;
        max-height: none !important;
        overflow-x: hidden !important;
        overflow-y: auto !important;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
      }

      #calculator-app[data-active-mode="settings"] .settings-panel {
        flex: 0 0 auto !important;
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
        padding-bottom: calc(clamp(16px, 3vw, 26px) + max(28px, env(safe-area-inset-bottom))) !important;
      }

      #calculator-app[data-active-mode="settings"] .settings-about-card {
        overflow: visible !important;
        margin-bottom: 28px !important;
      }
    `;
    document.head.appendChild(style);
  }

  if (applyStandaloneSettingsScrollFix()) {
    log("INFO", "settings", "standalone settings scroll fix applied");
  }

  requestAnimationFrame(() => applyStandaloneSettingsScrollFix());
  window.addEventListener("load", () => applyStandaloneSettingsScrollFix(), { once: true });

  const app = document.getElementById("calculator-app");
  if (app && !app.dataset.scrollFixObserverAttached) {
    const observer = new MutationObserver(() => applyStandaloneSettingsScrollFix());
    observer.observe(app, { attributes: true, attributeFilter: ["data-active-mode", "class"] });
    app.dataset.scrollFixObserverAttached = "true";
  }
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
