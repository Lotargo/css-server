# Tasks 2-3: Scientific/Engineering Calculator

## Task 2: Scientific ALU

**Files:**
- Create: `src/styles/_scientific.scss`
- Modify: `src/styles/main.scss`

**Interfaces:**
- Consumes: `#scientific-grid` buttons, `#scientific-mode` container
- Produces: `data-op` attribute for CSS ALU routing, `--result` computed property

### Steps

- [x] **Step 1: Create scientific ALU CSS module**

Create `src/styles/_scientific.scss`:

```scss
/* Scientific Calculator ALU */
@property --sci-val {
  syntax: "<number>";
  inherits: false;
  initial-value: 0;
}

@property --sci-result {
  syntax: "<number>";
  inherits: false;
  initial-value: 0;
}

@property --sci-op {
  syntax: "<custom-ident>";
  inherits: false;
  initial-value: none;
}

/* Scientific operation routing */
.sci-task {
  --sci-val: attr(data-val type(<number>), 0);
  --sci-op: attr(data-op type(<custom-ident>), none);
  --sci-result: #{
    if(style(--sci-op: sin): sin(var(--sci-val));
    style(--sci-op: cos): cos(var(--sci-val));
    style(--sci-op: tan): tan(var(--sci-val));
    style(--sci-op: asin): asin(var(--sci-val));
    style(--sci-op: acos): acos(var(--sci-val));
    style(--sci-op: atan): atan(var(--sci-val));
    style(--sci-op: log): log10(var(--sci-val));
    style(--sci-op: ln): ln(var(--sci-val));
    style(--sci-op: sqrt): sqrt(var(--sci-val));
    style(--sci-op: cbrt): cbrt(var(--sci-val));
    style(--sci-op: abs): abs(var(--sci-val));
    style(--sci-op: exp): exp(var(--sci-val));
    style(--sci-op: floor): floor(var(--sci-val));
    style(--sci-op: ceil): ceil(var(--sci-val));
    style(--sci-op: round): round(var(--sci-val));
    else: var(--sci-val))
  };
}

/* Trigonometric mode (DEG vs RAD) */
#calculator-app[data-angle-mode="deg"] .sci-task-trig {
  --sci-val: attr(data-val type(<number>), 0);
  --sci-op: attr(data-op type(<custom-ident>), sin);
  --sci-result: #{
    if(style(--sci-op: sin): sin(calc(var(--sci-val) * 3.14159265358979 / 180));
    style(--sci-op: cos): cos(calc(var(--sci-val) * 3.14159265358979 / 180));
    style(--sci-op: tan): tan(calc(var(--sci-val) * 3.14159265358979 / 180));
    else: var(--sci-val))
  };
}

#calculator-app[data-angle-mode="rad"] .sci-task-trig {
  --sci-val: attr(data-val type(<number>), 0);
  --sci-op: attr(data-op type(<custom-ident>), sin);
  --sci-result: #{
    if(style(--sci-op: sin): sin(var(--sci-val));
    style(--sci-op: cos): cos(var(--sci-val));
    style(--sci-op: tan): tan(var(--sci-val));
    else: var(--sci-val))
  };
}

/* Grid styling */
#scientific-grid {
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
    transition: background-color 0.15s, border-color 0.15s, transform 0.05s;
    &:active { transform: scale(0.98); }
  }
  
  .btn-num {
    background-color: var(--bg-num);
    &:hover { background-color: var(--bg-num-hover); }
    &:active { background-color: var(--bg-num-active); }
  }
  
  .btn-sci {
    background-color: var(--bg-op);
    font-size: 0.95rem;
    &:hover { background-color: var(--bg-op-hover); }
    &:active { background-color: var(--bg-op-active); }
  }
  
  .btn-eq {
    background-color: var(--bg-accent);
    font-size: 1.3rem;
    border-color: rgba(255, 255, 255, 0.08);
    &:hover { background-color: var(--bg-accent-hover); }
    &:active { background-color: var(--bg-accent-active); }
  }
}

/* Mode controls */
#sci-mode-controls {
  display: flex;
  gap: 8px;
  padding: 0 14px 8px 14px;
  
  .sci-mode-btn {
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

/* Display container */
#sci-display-container {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-end;
  padding: 24px;
  flex: 0 0 140px;
  text-align: right;
  word-break: break-all;
  overflow: hidden;
  
  #sci-expression-preview {
    font-size: 0.9rem;
    color: var(--text-sub);
    min-height: 20px;
    margin-bottom: 6px;
  }
  
  #sci-calculator-display {
    font-size: 2.8rem;
    font-weight: 500;
    color: var(--text-main);
    line-height: 1.15;
    letter-spacing: -0.5px;
    max-width: 100%;
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
```

- [x] **Step 3: Test scientific mode display**

Open the application, switch to Engineering mode, verify the grid shows 5 columns with scientific buttons.

- [x] **Step 4: Commit**

```bash
git add src/styles/_scientific.scss src/styles/main.scss
git commit -m "feat: add scientific calculator ALU CSS module"
```

---

## Task 3: Scientific Mode Event Handlers

**Files:**
- Create: `src/modes/scientific.js`
- Modify: `src/index.html` (add script tag)
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `#scientific-grid` buttons, `performCssArithmetic` function
- Produces: DOM nodes with `data-op` attribute for CSS ALU routing

### Steps

- [x] **Step 1: Create scientific mode event handler**

Create `src/modes/scientific.js`:

```javascript
// Scientific Mode Event Handlers
// NO ARITHMETIC - all computation delegated to CSS ALU

import { log } from '../main.js';

let sciDisplayVal = "0";
let sciExpressionVal = "";
let sciAccumulator = null;
let sciPendingOp = null;
let sciShouldResetDisplay = false;
let angleMode = "deg";

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
  } else if (["btn-sin", "btn-cos", "btn-tan", "btn-log", "btn-ln", "btn-sqrt2", "btn-abs", "btn-exp", "btn-x2", "btn-1/x"].includes(id)) {
    const opMap = {
      "btn-sin": "sin", "btn-cos": "cos", "btn-tan": "tan",
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
      document.getElementById("calculator-app").dataset.angleMode = angleMode;
      log("INFO", "sci-mode", `angle mode set to: ${angleMode}`);
    });
  });
  
  document.getElementById("calculator-app").dataset.angleMode = "deg";
  log("INFO", "sci-mode", "scientific mode initialized");
}
```

- [x] **Step 2: Add script tag to HTML**

Before `</body>`:

```html
<script type="module" src="/modes/scientific.js" defer></script>
```

- [x] **Step 3: Import and initialize in main.js**

At end of `setup()`:

```javascript
import('./modes/scientific.js').then(module => {
  module.initScientificMode();
  log("INFO", "modes", "scientific mode module loaded");
}).catch(err => {
  log("ERROR", "modes", "failed to load scientific mode", err);
});
```

- [x] **Step 4: Test scientific operations**

Test: sin(30°), cos, tan, log, ln, √, |x|, exp, x², 1/x, DEG/RAD toggle.

- [x] **Step 5: Commit**

```bash
git add src/modes/scientific.js src/index.html src/main.js
git commit -m "feat: add scientific mode event handlers with CSS ALU delegation"
```
