# Tasks 4-5: Programmer Calculator

## Task 4: Programmer ALU

**Files:**
- Create: `src/styles/_programmer.scss`
- Modify: `src/styles/main.scss`

**Interfaces:**
- Consumes: `#programmer-grid` buttons, `#programmer-mode` container
- Produces: `data-base` attribute for CSS ALU routing, `--result` computed property

### Steps

- [ ] **Step 1: Create programmer ALU CSS module**

Create `src/styles/_programmer.scss`:

```scss
/* Programmer Calculator ALU */
@property --prog-val {
  syntax: "<number>";
  inherits: false;
  initial-value: 0;
}

@property --prog-result {
  syntax: "<number>";
  inherits: false;
  initial-value: 0;
}

/* Bitwise operations */
.prog-bitwise-task {
  --val-a: attr(data-a type(<number>), 0);
  --val-b: attr(data-b type(<number>), 0);
  --op: attr(data-op type(<custom-ident>), and);
  --result: #{
    if(style(--op: and): calc(var(--val-a) bitand var(--val-b));
    style(--op: or): calc(var(--val-a) bitor var(--val-b));
    style(--op: xor): calc(var(--val-a) bitxor var(--val-b));
    style(--op: not): calc(0 - var(--val-a) - 1);
    style(--op: lshift): calc(var(--val-a) * 2);
    style(--op: rshift): calc(var(--val-a) / 2);
    else: var(--val-b))
  };
}

/* Display container */
#prog-display-container {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-end;
  padding: 24px;
  flex: 0 0 180px;
  text-align: right;
  word-break: break-all;
  overflow: hidden;
  
  #prog-expression-preview {
    font-size: 0.9rem;
    color: var(--text-sub);
    min-height: 20px;
    margin-bottom: 6px;
  }
  
  #prog-calculator-display {
    font-size: 2.8rem;
    font-weight: 500;
    color: var(--text-main);
    line-height: 1.15;
    letter-spacing: -0.5px;
    max-width: 100%;
  }
  
  #prog-base-display {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-top: 8px;
    font-size: 0.8rem;
    color: var(--text-sub);
    font-family: 'Fira Code', monospace;
    
    .base-value {
      padding: 2px 0;
      &.active { color: var(--text-main); font-weight: 600; }
    }
  }
}

/* Mode controls */
#prog-mode-controls {
  display: flex;
  gap: 8px;
  padding: 0 14px 8px 14px;
  
  .prog-mode-btn {
    background: none;
    border: 1px solid var(--border-subtle);
    color: var(--text-sub);
    font-size: 0.8rem;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    &:hover { background-color: rgba(255, 255, 255, 0.05); color: var(--text-main); }
    &.active { background-color: var(--bg-accent); color: var(--text-main); border-color: var(--bg-accent); }
  }
}

/* Word size */
#prog-word-size {
  display: flex;
  gap: 8px;
  padding: 0 14px 8px 14px;
  
  .word-btn {
    background: none;
    border: 1px solid var(--border-subtle);
    color: var(--text-sub);
    font-size: 0.75rem;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    &:hover { background-color: rgba(255, 255, 255, 0.05); color: var(--text-main); }
    &.active { background-color: rgba(133, 83, 244, 0.2); color: var(--text-main); border-color: var(--bg-accent); }
  }
}

/* Programmer grid */
#programmer-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2px;
  padding: 0 14px 14px 14px;
  flex: 1;
  
  button {
    border: 1px solid rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    font-size: 1.05rem;
    font-weight: 450;
    color: var(--text-main);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.15s, transform 0.05s;
    &:active { transform: scale(0.98); }
    &:disabled { opacity: 0.3; cursor: not-allowed; }
  }
  
  .btn-num {
    background-color: var(--bg-num);
    &:hover { background-color: var(--bg-num-hover); }
  }
  
  .btn-prog {
    background-color: var(--bg-op);
    font-size: 0.95rem;
    &:hover { background-color: var(--bg-op-hover); }
    &.btn-hex {
      background-color: #1a1a2e;
      color: #7c3aed;
      &:disabled { background-color: #1a1a2e; color: #7c3aed; opacity: 0.2; }
    }
  }
  
  .btn-op {
    background-color: var(--bg-op);
    &:hover { background-color: var(--bg-op-hover); }
  }
  
  .btn-eq {
    background-color: var(--bg-accent);
    font-size: 1.3rem;
    &:hover { background-color: var(--bg-accent-hover); }
  }
}
```

- [ ] **Step 2: Update main.scss imports**

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
```

- [ ] **Step 3: Test programmer mode display**

Verify 5-column grid, HEX buttons, base display, word size buttons.

- [ ] **Step 4: Commit**

```bash
git add src/styles/_programmer.scss src/styles/main.scss
git commit -m "feat: add programmer calculator ALU CSS module"
```

---

## Task 5: Programmer Mode Event Handlers

**Files:**
- Create: `src/modes/programmer.js`
- Modify: `src/index.html` (add script tag)
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `#programmer-grid` buttons
- Produces: DOM nodes with `data-op` attribute for CSS ALU routing

### Steps

- [ ] **Step 1: Create programmer mode event handler**

Create `src/modes/programmer.js`:

```javascript
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
  
  const decVal = parseInt(progDisplayVal, getBaseRadix(currentBase));
  updateBaseDisplays(decVal);
  
  document.querySelectorAll("#programmer-grid .btn-hex").forEach(btn => {
    btn.disabled = currentBase !== "hex";
  });
  
  document.querySelectorAll("#programmer-grid .btn-num").forEach(btn => {
    const digit = parseInt(btn.textContent.trim());
    if (currentBase === "oct") btn.disabled = digit >= 8;
    else if (currentBase === "bin") btn.disabled = digit > 1;
    else btn.disabled = false;
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
  const currentVal = parseInt(progDisplayVal, getBaseRadix(currentBase));
  
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
      const result = parseInt(style.getPropertyValue("--result").trim());
      progExpressionVal = `${op}(${progDisplayVal}) =`;
      progDisplayVal = String(result);
      progShouldResetDisplay = true;
      node.remove();
      updateProgUi();
    }, 100);
  } else {
    let op = "";
    if (id === "prog-btn-div") op = "div";
    else if (id === "prog-btn-mul") op = "mul";
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
  const currentVal = parseInt(progDisplayVal, getBaseRadix(currentBase));
  
  const node = document.createElement("div");
  node.className = "request math-task";
  node.dataset.a = String(progAccumulator);
  node.dataset.b = String(currentVal);
  node.dataset.op = progPendingOp;
  
  const aluLane = document.getElementById("alu-lane");
  if (aluLane) aluLane.appendChild(node);
  
  setTimeout(() => {
    const style = getComputedStyle(node);
    const result = parseFloat(style.getPropertyValue("--result").trim());
    
    const opSymbol = { div: "÷", mul: "×", mod: "mod" }[progPendingOp] || progPendingOp;
    progExpressionVal = `${progAccumulator} ${opSymbol} ${currentVal} =`;
    progDisplayVal = String(result);
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
      currentBase = btn.dataset.base;
      document.querySelectorAll("#prog-mode-controls .prog-mode-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
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
  
  log("INFO", "prog-mode", "programmer mode initialized");
}
```

- [ ] **Step 2: Add script tag to HTML**

```html
<script type="module" src="/modes/programmer.js" defer></script>
```

- [ ] **Step 3: Import and initialize in main.js**

```javascript
import('./modes/programmer.js').then(module => {
  module.initProgrammerMode();
  log("INFO", "modes", "programmer mode module loaded");
}).catch(err => {
  log("ERROR", "modes", "failed to load programmer mode", err);
});
```

- [ ] **Step 4: Test programmer operations**

Test: HEX/DEC/OCT/BIN switching, digit enable/disable, bitwise operations (AND, OR, XOR, NOT, <<, >>).

- [ ] **Step 5: Commit**

```bash
git add src/modes/programmer.js src/index.html src/main.js
git commit -m "feat: add programmer mode event handlers with base conversion"
```
