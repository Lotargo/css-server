# Task 1: Mode Switching Infrastructure

**Files:**
- Create: `src/styles/_mode-switcher.scss`
- Modify: `src/index.html:14-202`
- Modify: `src/main.js:876-893`

**Interfaces:**
- Consumes: Existing `#calculator-app`, `#calculator-pane`, `.drawer-item` elements
- Produces: `data-active-mode` attribute on `#calculator-app`, CSS class `.mode-{name}` for conditional display

---

## Steps

- [ ] **Step 1: Add data-active-mode attribute to app container**

In `src/index.html`, add `data-active-mode="standard"` to the root container:

```html
<div id="calculator-app" data-active-mode="standard">
```

- [ ] **Step 2: Create mode-switcher SCSS**

Create `src/styles/_mode-switcher.scss`:

```scss
/* Mode Switching Infrastructure */
#calculator-app {
  --current-mode: standard;
}

/* Hide all mode-specific sections by default */
.mode-section {
  display: none !important;
}

/* Show only the active mode section */
#calculator-app[data-active-mode="standard"] .mode-standard,
#calculator-app[data-active-mode="scientific"] .mode-scientific,
#calculator-app[data-active-mode="programmer"] .mode-programmer,
#calculator-app[data-active-mode="graphing"] .mode-graphing,
#calculator-app[data-active-mode="date"] .mode-date,
#calculator-app[data-active-mode="currency"] .mode-currency,
#calculator-app[data-active-mode="volume"] .mode-volume,
#calculator-app[data-active-mode="length"] .mode-length,
#calculator-app[data-active-mode="weight"] .mode-weight,
#calculator-app[data-active-mode="temperature"] .mode-temperature,
#calculator-app[data-active-mode="energy"] .mode-energy,
#calculator-app[data-active-mode="area"] .mode-area,
#calculator-app[data-active-mode="speed"] .mode-speed,
#calculator-app[data-active-mode="time"] .mode-time,
#calculator-app[data-active-mode="power"] .mode-power,
#calculator-app[data-active-mode="data"] .mode-data,
#calculator-app[data-active-mode="pressure"] .mode-pressure,
#calculator-app[data-active-mode="angle"] .mode-angle {
  display: flex !important;
  flex-direction: column;
}

/* Mode title mapping */
#calculator-app[data-active-mode="scientific"] #calc-title::after { content: "Инженерный"; }
#calculator-app[data-active-mode="programmer"] #calc-title::after { content: "Программист"; }
#calculator-app[data-active-mode="graphing"] #calc-title::after { content: "Построение графиков"; }
#calculator-app[data-active-mode="date"] #calc-title::after { content: "Вычисление даты"; }
#calculator-app[data-active-mode="currency"] #calc-title::after { content: "Валюта"; }
#calculator-app[data-active-mode="volume"] #calc-title::after { content: "Объем"; }
#calculator-app[data-active-mode="length"] #calc-title::after { content: "Длина"; }

/* Hide default title text when using ::after */
#calculator-app:not([data-active-mode="standard"]) #calc-title {
  font-size: 0;
  &::after {
    font-size: 1.1rem;
  }
}
```

- [ ] **Step 3: Update main.scss imports**

In `src/styles/main.scss`, add the new import:

```scss
@use "base";
@use "motherboard";
@use "request";
@use "alu";
@use "animations";
@use "logs";
@use "mode-switcher";
```

- [ ] **Step 4: Update drawer click handler to set mode**

In `src/main.js`, replace the drawer item click handler (lines 876-893):

```javascript
drawerItems.forEach(item => {
  item.addEventListener("click", () => {
    const mode = item.dataset.mode;
    
    // Close drawer
    toggleDrawer(false);
    
    // Set active mode on app container
    const appContainer = document.getElementById("calculator-app");
    if (appContainer) {
      appContainer.dataset.activeMode = mode;
    }
    
    // Update active state in drawer
    drawerItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    
    // Update title
    const titleEl = document.getElementById("calc-title");
    if (titleEl) {
      const modeNames = {
        standard: "Обычный",
        scientific: "Инженерный",
        programmer: "Программист",
        graphing: "Построение графиков",
        date: "Вычисление даты",
        currency: "Валюта",
        volume: "Объем",
        length: "Длина",
        weight: "Вес и масса",
        temperature: "Температура",
        energy: "Энергия",
        area: "Площадь",
        speed: "Скорость",
        time: "Время",
        power: "Мощность",
        data: "Данные",
        pressure: "Давление",
        angle: "Угол",
        settings: "Параметры"
      };
      titleEl.textContent = modeNames[mode] || mode;
    }
    
    log("INFO", "mode", `switched to mode: ${mode}`);
  });
});
```

- [ ] **Step 5: Add mode-specific sections to HTML**

In `src/index.html`, add placeholder sections after the standard calculator grid (after line 201). See `01-html-sections.md` for full HTML.

- [ ] **Step 6: Test mode switching**

Open the application in Chrome 142+, click the hamburger menu, and verify each mode switches correctly without JavaScript errors. Check that the title updates and the correct mode section appears.

- [ ] **Step 7: Commit**

```bash
git add src/index.html src/main.js src/styles/main.scss src/styles/_mode-switcher.scss
git commit -m "feat: add mode switching infrastructure for all calculator modes"
```
