# Task 12: Dropdown Menus for Scientific Mode

**Files:**
- Create: `src/styles/_dropdown-menus.scss`
- Modify: `src/styles/main.scss`
- Modify: `src/modes/scientific.js`

**Interfaces:**
- Consumes: `#sci-dropdown-menus` dropdown triggers and items
- Produces: Open/close state management via CSS classes

---

## Steps

- [ ] **Step 1: Create dropdown menus SCSS module**

Create `src/styles/_dropdown-menus.scss`:

```scss
/* Dropdown Menus for Scientific Mode */
.sci-dropdown {
  position: relative;
  display: inline-block;
  
  .dropdown-trigger {
    background: none;
    border: 1px solid var(--border-subtle);
    color: var(--text-sub);
    font-size: 0.85rem;
    font-weight: 500;
    padding: 8px 14px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.05);
      color: var(--text-main);
    }
    
    &::after {
      content: '▾';
      font-size: 0.7rem;
      margin-left: 4px;
    }
  }
  
  .dropdown-content {
    display: none;
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    background-color: #2a2a2a;
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    z-index: 1000;
    min-width: 140px;
    padding: 6px 0;
    opacity: 0;
    transform: translateY(-8px);
    transition: opacity 0.15s, transform 0.15s;
    
    .dropdown-item {
      display: block;
      width: 100%;
      padding: 10px 16px;
      background: none;
      border: none;
      color: var(--text-main);
      font-size: 0.9rem;
      text-align: left;
      cursor: pointer;
      transition: background-color 0.1s;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.08);
      }
      
      &:active {
        background-color: rgba(133, 83, 244, 0.2);
      }
    }
  }
  
  &.open .dropdown-content {
    display: block;
    opacity: 1;
    transform: translateY(0);
  }
}

/* Trigonometry dropdown */
#trig-dropdown .dropdown-content .dropdown-item {
  font-family: 'Fira Code', monospace;
  font-size: 0.85rem;
}

/* Function dropdown */
#func-dropdown .dropdown-content .dropdown-item {
  font-family: 'Fira Code', monospace;
  font-size: 0.85rem;
  
  &::before {
    margin-right: 8px;
    opacity: 0.6;
  }
  
  &[data-func="floor"]::before { content: '⌊'; }
  &[data-func="ceil"]::before { content: '⌈'; }
  &[data-func="round"]::before { content: '⌊⌉'; }
  &[data-func="rand"]::before { content: '?'; }
  &[data-func="dms"]::before { content: '→'; }
  &[data-func="deg"]::before { content: '→'; }
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
@use "converters";
@use "dropdown-menus";
```

- [ ] **Step 3: Add dropdown toggle JavaScript**

In `src/modes/scientific.js`, add after the `initScientificMode()` function:

```javascript
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
      if (trigBtn) trigBtn.click();
    } else if (["floor", "ceil", "round"].includes(func)) {
      const funcBtn = document.getElementById(`btn-${func}`);
      if (funcBtn) funcBtn.click();
    } else if (func === "rand") {
      const randBtn = document.getElementById("btn-rand");
      if (randBtn) randBtn.click();
    }
    
    dropdown.classList.remove("open");
  });
});
```

- [ ] **Step 4: Test dropdown menus**

Test: Click "Тригонометрия" dropdown, select function, verify close. Click "Функция" dropdown. Click outside to close.

- [ ] **Step 5: Commit**

```bash
git add src/styles/_dropdown-menus.scss src/styles/main.scss src/modes/scientific.js
git commit -m "feat: add dropdown menus for scientific mode"
```
