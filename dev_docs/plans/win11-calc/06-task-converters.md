# Tasks 10-11: Unit Converters

## Task 10: Converters ALU

**Files:**
- Create: `src/styles/_converters.scss`
- Modify: `src/styles/main.scss`

**Interfaces:**
- Consumes: `#converter-inputs` select and input elements
- Produces: DOM nodes with `data-value`, `data-from`, and `data-to` attributes for CSS ALU routing

### Steps

- [x] **Step 1: Create converters ALU CSS module**

Create `src/styles/_converters.scss`:

```scss
/* Unit Converter ALU */
@property --conv-val {
  syntax: "<number>";
  inherits: false;
  initial-value: 0;
}

@property --conv-from {
  syntax: "<custom-ident>";
  inherits: false;
  initial-value: m;
}

@property --conv-to {
  syntax: "<custom-ident>";
  inherits: false;
  initial-value: ft;
}

@property --conv-result {
  syntax: "<number>";
  inherits: false;
  initial-value: 0;
}

/* Length conversion */
.conv-task-length {
  --conv-val: attr(data-value type(<number>), 0);
  --conv-from: attr(data-from type(<custom-ident>), m);
  --conv-to: attr(data-to type(<custom-ident>), ft);
  --conv-result: #{
    if(style(--conv-to: mm): calc(var(--conv-val) * 1000);
    style(--conv-to: cm): calc(var(--conv-val) * 100);
    style(--conv-to: m): var(--conv-val);
    style(--conv-to: km): calc(var(--conv-val) / 1000);
    style(--conv-to: in): calc(var(--conv-val) * 39.3701);
    style(--conv-to: ft): calc(var(--conv-val) * 3.28084);
    style(--conv-to: yd): calc(var(--conv-val) * 1.09361);
    style(--conv-to: mi): calc(var(--conv-val) / 1609.34);
    else: var(--conv-val))
  };
}

/* Weight conversion */
.conv-task-weight {
  --conv-val: attr(data-value type(<number>), 0);
  --conv-to: attr(data-to type(<custom-ident>), lb);
  --conv-result: #{
    if(style(--conv-to: mg): calc(var(--conv-val) * 1000000);
    style(--conv-to: g): calc(var(--conv-val) * 1000);
    style(--conv-to: kg): var(--conv-val);
    style(--conv-to: t): calc(var(--conv-val) / 1000);
    style(--conv-to: oz): calc(var(--conv-val) * 35.274);
    style(--conv-to: lb): calc(var(--conv-val) * 2.20462);
    else: var(--conv-val))
  };
}

/* Temperature conversion */
.conv-task-temp {
  --conv-val: attr(data-value type(<number>), 0);
  --conv-to: attr(data-to type(<custom-ident>), f);
  --conv-result: #{
    if(style(--conv-to: c): var(--conv-val);
    style(--conv-to: f): calc(var(--conv-val) * 9 / 5 + 32);
    style(--conv-to: k): calc(var(--conv-val) + 273.15);
    else: var(--conv-val))
  };
}

/* Time conversion */
.conv-task-time {
  --conv-val: attr(data-value type(<number>), 0);
  --conv-to: attr(data-to type(<custom-ident>), min);
  --conv-result: #{
    if(style(--conv-to: ms): calc(var(--conv-val) * 1000);
    style(--conv-to: s): var(--conv-val);
    style(--conv-to: min): calc(var(--conv-val) / 60);
    style(--conv-to: h): calc(var(--conv-val) / 3600);
    style(--conv-to: d): calc(var(--conv-val) / 86400);
    style(--conv-to: w): calc(var(--conv-val) / 604800);
    style(--conv-to: mth): calc(var(--conv-val) / 2629746);
    style(--conv-to: y): calc(var(--conv-val) / 31556952);
    else: var(--conv-val))
  };
}

/* Converter layout */
.converter-mode {
  #converter-display-container {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: flex-end;
    padding: 24px;
    flex: 0 0 120px;
    text-align: right;
    word-break: break-all;
    overflow: hidden;
    
    #converter-result {
      font-size: 2.8rem;
      font-weight: 500;
      color: var(--text-main);
      line-height: 1.15;
      letter-spacing: -0.5px;
      max-width: 100%;
    }
  }
  
  #converter-inputs {
    padding: 0 14px 16px 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    
    .converter-input-group {
      display: flex;
      gap: 12px;
      align-items: center;
      
      .converter-select {
        flex: 1;
        background-color: rgba(0, 0, 0, 0.3);
        border: 1px solid var(--border-subtle);
        border-radius: 4px;
        color: var(--text-main);
        font-size: 0.85rem;
        padding: 10px 12px;
        outline: none;
        cursor: pointer;
        &:focus { border-color: var(--bg-accent); }
        option { background-color: #2a2a2a; color: var(--text-main); }
      }
      
      .converter-value {
        width: 120px;
        background-color: rgba(0, 0, 0, 0.3);
        border: 1px solid var(--border-subtle);
        border-radius: 4px;
        color: var(--text-main);
        font-size: 1rem;
        font-weight: 600;
        padding: 10px 12px;
        text-align: right;
        outline: none;
        &:focus { border-color: var(--bg-accent); }
        &:readonly { background-color: rgba(0, 0, 0, 0.2); color: var(--text-sub); }
      }
    }
    
    .swap-btn {
      align-self: center;
      width: 36px;
      height: 36px;
      background-color: var(--bg-op);
      border: 1px solid var(--border-subtle);
      border-radius: 50%;
      color: var(--text-main);
      font-size: 1.1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      &:hover { background-color: var(--bg-op-hover); transform: rotate(180deg); }
    }
  }
}
```

- [x] **Step 2: Update main.scss imports**

```scss
@use "base";
@use "motherboard";
@use "request";
@use "alu";
@use "animations";
@use "logs";
@use "mode-switcher";
@use "scientific";
@use "programmer";
@use "graphing";
@use "date";
@use "converters";
```

- [x] **Step 3: Test converter mode display**

Verify converter result display, select dropdowns, input field, swap button.

- [x] **Step 4: Commit**

```bash
git add src/styles/_converters.scss src/styles/main.scss
git commit -m "feat: add unit converter ALU CSS module"
```

---

## Task 11: Converter Event Handlers

**Files:**
- Create: `src/modes/converters.js`
- Modify: `src/index.html` (add script tag)
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `#converter-inputs` select and input elements for all converter modes
- Produces: DOM nodes with `data-value`, `data-from`, and `data-to` attributes for CSS ALU routing

### Steps

- [x] **Step 1: Create converter event handler**

Create `src/modes/converters.js`:

```javascript
// Converter Mode Event Handlers
// NO ARITHMETIC - all computation delegated to CSS ALU

import { log } from '../main.js';

const converterConfigs = {
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
    const result = parseFloat(style.getPropertyValue("--conv-result").trim());
    toInput.value = String(result);
    node.remove();
    log("INFO", "converter", `${value} ${fromUnit} = ${result} ${toUnit}`);
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
```

- [x] **Step 2: Add script tag to HTML**

```html
<script type="module" src="/modes/converters.js" defer></script>
```

- [x] **Step 3: Import and initialize in main.js**

```javascript
import('./modes/converters.js').then(module => {
  module.initConverters();
  log("INFO", "modes", "converter modes loaded");
}).catch(err => {
  log("ERROR", "modes", "failed to load converter modes", err);
});
```

- [x] **Step 4: Test converter operations**

Test: Length (1m → ft), Weight, Temperature, Time conversions, swap button.

- [x] **Step 5: Commit**

```bash
git add src/modes/converters.js src/index.html src/main.js
git commit -m "feat: add unit converter event handlers with CSS ALU delegation"
```
