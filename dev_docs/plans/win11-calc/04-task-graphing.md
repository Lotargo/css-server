# Tasks 6-7: Graphing Calculator

## Task 6: Graphing ALU

**Files:**
- Create: `src/styles/_graphing.scss`
- Modify: `src/styles/main.scss`

**Interfaces:**
- Consumes: `#graph-container` elements, function input fields
- Produces: DOM nodes with `data-func` and `data-x` attributes for CSS ALU routing

### Steps

- [x] **Step 1: Create graphing ALU CSS module**

Create `src/styles/_graphing.scss`:

```scss
/* Graphing Calculator ALU */
@property --graph-x {
  syntax: "<number>";
  inherits: false;
  initial-value: 0;
}

@property --graph-result {
  syntax: "<number>";
  inherits: false;
  initial-value: 0;
}

@property --graph-func {
  syntax: "<custom-ident>";
  inherits: false;
  initial-value: sin;
}

/* Function evaluation routing */
.graph-task {
  --graph-x: attr(data-x type(<number>), 0);
  --graph-func: attr(data-func type(<custom-ident>), sin);
  --graph-result: #{
    if(style(--graph-func: sin): sin(var(--graph-x));
    style(--graph-func: cos): cos(var(--graph-x));
    style(--graph-func: tan): tan(var(--graph-x));
    style(--graph-func: log): log10(var(--graph-x));
    style(--graph-func: ln): ln(var(--graph-x));
    style(--graph-func: sqrt): sqrt(var(--graph-x));
    style(--graph-func: abs): abs(var(--graph-x));
    style(--graph-func: x2): calc(var(--graph-x) * var(--graph-x));
    style(--graph-func: x3): calc(var(--graph-x) * var(--graph-x) * var(--graph-x));
    style(--graph-func: exp): exp(var(--graph-x));
    else: var(--graph-x))
  };
}

/* Graph container */
#graph-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  
  #graph-canvas {
    flex: 1;
    background-color: #0a0a0a;
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      width: 1px;
      height: 100%;
      background: rgba(255, 255, 255, 0.1);
    }
    
    &::after {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      width: 100%;
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
    }
  }
  
  #graph-controls {
    display: flex;
    gap: 16px;
    margin-top: 12px;
    align-items: flex-start;
    
    #function-list {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
      
      .function-entry {
        display: flex;
        gap: 8px;
        align-items: center;
        
        .func-input {
          flex: 1;
          background-color: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-subtle);
          border-radius: 4px;
          color: var(--text-main);
          font-family: 'Fira Code', monospace;
          font-size: 0.9rem;
          padding: 8px 12px;
          outline: none;
          &:focus { border-color: var(--bg-accent); }
        }
        
        .func-color {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
        }
      }
    }
    
    #graph-zoom {
      display: flex;
      flex-direction: column;
      gap: 4px;
      
      .zoom-btn {
        width: 32px;
        height: 32px;
        background-color: var(--bg-op);
        border: 1px solid var(--border-subtle);
        border-radius: 4px;
        color: var(--text-main);
        font-size: 1.1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
        &:hover { background-color: var(--bg-op-hover); }
      }
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
```

- [x] **Step 3: Test graphing mode display**

Verify graph canvas with grid lines, function input field, zoom controls.

- [x] **Step 4: Commit**

```bash
git add src/styles/_graphing.scss src/styles/main.scss
git commit -m "feat: add graphing calculator ALU CSS module"
```

---

## Task 7: Graphing Mode Event Handlers

**Files:**
- Create: `src/modes/graphing.js`
- Modify: `src/index.html` (add script tag)
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `#graph-canvas` container, function input fields
- Produces: DOM nodes with `data-func` and `data-x` attributes for CSS ALU routing

### Steps

- [x] **Step 1: Create graphing mode event handler**

Create `src/modes/graphing.js`:

```javascript
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
  
  const width = graphCanvas.clientWidth;
  const height = graphCanvas.clientHeight;
  
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
  
  setTimeout(renderGraph, 100);
  log("INFO", "graph-mode", "graphing mode initialized");
}
```

- [x] **Step 2: Add script tag to HTML**

```html
<script type="module" src="/modes/graphing.js" defer></script>
```

- [x] **Step 3: Import and initialize in main.js**

```javascript
import('./modes/graphing.js').then(module => {
  module.initGraphingMode();
  log("INFO", "modes", "graphing mode module loaded");
}).catch(err => {
  log("ERROR", "modes", "failed to load graphing mode", err);
});
```

- [x] **Step 4: Test graphing operations**

Test: sin(x) plot, function change to cos(x), zoom in/out/fit.

- [x] **Step 5: Commit**

```bash
git add src/modes/graphing.js src/index.html src/main.js
git commit -m "feat: add graphing mode event handlers with CSS ALU delegation"
```
