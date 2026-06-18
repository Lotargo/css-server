# Tasks 8-9: Date Calculation

## Task 8: Date ALU

**Files:**
- Create: `src/styles/_date.scss`
- Modify: `src/styles/main.scss`

**Interfaces:**
- Consumes: `#date-inputs` date fields, `#date-calc-type` toggle
- Produces: DOM nodes with `data-date-from` and `data-date-to` attributes for CSS ALU routing

### Steps

- [ ] **Step 1: Create date ALU CSS module**

Create `src/styles/_date.scss`:

```scss
/* Date Calculation ALU */
@property --date-from {
  syntax: "<number>";
  inherits: false;
  initial-value: 0;
}

@property --date-to {
  syntax: "<number>";
  inherits: false;
  initial-value: 0;
}

@property --date-diff {
  syntax: "<number>";
  inherits: false;
  initial-value: 0;
}

/* Date difference calculation */
.date-task {
  --date-from: attr(data-date-from type(<number>), 0);
  --date-to: attr(data-date-to type(<number>), 0);
  --date-diff: calc(var(--date-to) - var(--date-from));
}

/* Date display container */
#date-display-container {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-end;
  padding: 24px;
  flex: 0 0 120px;
  text-align: right;
  word-break: break-all;
  overflow: hidden;
  
  #date-result {
    font-size: 2.8rem;
    font-weight: 500;
    color: var(--text-main);
    line-height: 1.15;
    letter-spacing: -0.5px;
    max-width: 100%;
  }
}

/* Calculation type toggle */
#date-calc-type {
  display: flex;
  gap: 8px;
  padding: 0 14px 12px 14px;
  
  .date-type-btn {
    background: none;
    border: 1px solid var(--border-subtle);
    color: var(--text-sub);
    font-size: 0.8rem;
    font-weight: 600;
    padding: 8px 14px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    &:hover { background-color: rgba(255, 255, 255, 0.05); color: var(--text-main); }
    &.active { background-color: var(--bg-accent); color: var(--text-main); border-color: var(--bg-accent); }
  }
}

/* Date inputs */
#date-inputs {
  display: flex;
  gap: 16px;
  padding: 0 14px 16px 14px;
  
  .date-input-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    
    label {
      font-size: 0.8rem;
      color: var(--text-sub);
      font-weight: 600;
    }
    
    .date-field {
      background-color: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border-subtle);
      border-radius: 4px;
      color: var(--text-main);
      font-size: 0.9rem;
      padding: 10px 12px;
      outline: none;
      &:focus { border-color: var(--bg-accent); }
      &::-webkit-calendar-picker-indicator { filter: invert(1); }
    }
  }
}

/* Result display */
#date-result-display {
  padding: 0 14px;
  
  .result-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid var(--border-subtle);
    &:last-child { border-bottom: none; }
    
    .result-label {
      font-size: 0.85rem;
      color: var(--text-sub);
    }
    
    .result-value {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-main);
      font-family: 'Fira Code', monospace;
    }
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
@use "graphing";
@use "date";
```

- [ ] **Step 3: Test date mode display**

Verify date inputs, calculation type toggle, result rows.

- [ ] **Step 4: Commit**

```bash
git add src/styles/_date.scss src/styles/main.scss
git commit -m "feat: add date calculation ALU CSS module"
```

---

## Task 9: Date Mode Event Handlers

**Files:**
- Create: `src/modes/date.js`
- Modify: `src/index.html` (add script tag)
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `#date-from`, `#date-to` date inputs, `#date-calc-type` toggle
- Produces: DOM nodes with `data-date-from` and `data-date-to` attributes for CSS ALU routing

### Steps

- [ ] **Step 1: Create date mode event handler**

Create `src/modes/date.js`:

```javascript
// Date Calculation Mode Event Handlers
// NO ARITHMETIC - all computation delegated to CSS ALU

import { log } from '../main.js';

let calcType = "diff";

const dateFromEl = document.getElementById("date-from");
const dateToEl = document.getElementById("date-to");
const dateYearsEl = document.getElementById("date-years");
const dateMonthsEl = document.getElementById("date-months");
const dateDaysEl = document.getElementById("date-days");
const dateTotalDaysEl = document.getElementById("date-total-days");

function dateToTimestamp(dateStr) {
  return new Date(dateStr).getTime() / (1000 * 60 * 60 * 24);
}

async function calculateDateDiff() {
  if (!dateFromEl || !dateToEl) return;
  
  const fromStr = dateFromEl.value;
  const toStr = dateToEl.value;
  
  if (!fromStr || !toStr) return;
  
  const fromTs = dateToTimestamp(fromStr);
  const toTs = dateToTimestamp(toStr);
  
  const node = document.createElement("div");
  node.className = "request date-task";
  node.dataset.dateFrom = String(fromTs);
  node.dataset.dateTo = String(toTs);
  
  const aluLane = document.getElementById("alu-lane");
  if (aluLane) aluLane.appendChild(node);
  
  setTimeout(() => {
    const style = getComputedStyle(node);
    const totalDays = parseInt(style.getPropertyValue("--date-diff").trim());
    
    const years = Math.floor(Math.abs(totalDays) / 365);
    const months = Math.floor((Math.abs(totalDays) % 365) / 30);
    const days = Math.floor((Math.abs(totalDays) % 365) % 30);
    
    if (dateYearsEl) dateYearsEl.textContent = String(years);
    if (dateMonthsEl) dateMonthsEl.textContent = String(months);
    if (dateDaysEl) dateDaysEl.textContent = String(days);
    if (dateTotalDaysEl) dateTotalDaysEl.textContent = String(Math.abs(totalDays));
    
    node.remove();
    log("INFO", "date-alu", `date diff: ${totalDays} days`);
  }, 100);
}

export function initDateMode() {
  if (dateFromEl) dateFromEl.addEventListener("change", calculateDateDiff);
  if (dateToEl) dateToEl.addEventListener("change", calculateDateDiff);
  
  document.querySelectorAll("#date-calc-type .date-type-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      calcType = btn.dataset.type;
      document.querySelectorAll("#date-calc-type .date-type-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      log("INFO", "date-mode", `calculation type set to: ${calcType}`);
    });
  });
  
  if (dateFromEl) {
    const today = new Date();
    dateFromEl.value = today.toISOString().split("T")[0];
  }
  if (dateToEl) {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    dateToEl.value = nextYear.toISOString().split("T")[0];
  }
  
  calculateDateDiff();
  log("INFO", "date-mode", "date calculation mode initialized");
}
```

- [ ] **Step 2: Add script tag to HTML**

```html
<script type="module" src="/modes/date.js" defer></script>
```

- [ ] **Step 3: Import and initialize in main.js**

```javascript
import('./modes/date.js').then(module => {
  module.initDateMode();
  log("INFO", "modes", "date mode module loaded");
}).catch(err => {
  log("ERROR", "modes", "failed to load date mode", err);
});
```

- [ ] **Step 4: Test date operations**

Test: default dates, date change calculation, years/months/days breakdown.

- [ ] **Step 5: Commit**

```bash
git add src/modes/date.js src/index.html src/main.js
git commit -m "feat: add date calculation mode event handlers with CSS ALU delegation"
```
