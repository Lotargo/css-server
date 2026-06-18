# Task 13: Final Integration and Testing

**Files:**
- Modify: `src/index.html` (verify all script tags)
- Modify: `src/main.js` (verify all mode initializations)

**Interfaces:**
- Consumes: All mode modules
- Produces: Fully functional calculator with all modes

---

## Steps

- [ ] **Step 1: Verify all script tags in HTML**

Ensure `src/index.html` has all necessary script tags before `</body>`:

```html
<script type="module" src="/main.js" defer></script>
<script type="module" src="/modes/scientific.js" defer></script>
<script type="module" src="/modes/programmer.js" defer></script>
<script type="module" src="/modes/graphing.js" defer></script>
<script type="module" src="/modes/date.js" defer></script>
<script type="module" src="/modes/converters.js" defer></script>
```

- [ ] **Step 2: Verify all mode initializations in main.js**

Ensure `src/main.js` `setup()` function has all mode imports:

```javascript
// Initialize all modes
import('./modes/scientific.js').then(module => {
  module.initScientificMode();
  log("INFO", "modes", "scientific mode module loaded");
}).catch(err => {
  log("ERROR", "modes", "failed to load scientific mode", err);
});

import('./modes/programmer.js').then(module => {
  module.initProgrammerMode();
  log("INFO", "modes", "programmer mode module loaded");
}).catch(err => {
  log("ERROR", "modes", "failed to load programmer mode", err);
});

import('./modes/graphing.js').then(module => {
  module.initGraphingMode();
  log("INFO", "modes", "graphing mode module loaded");
}).catch(err => {
  log("ERROR", "modes", "failed to load graphing mode", err);
});

import('./modes/date.js').then(module => {
  module.initDateMode();
  log("INFO", "modes", "date mode module loaded");
}).catch(err => {
  log("ERROR", "modes", "failed to load date mode", err);
});

import('./modes/converters.js').then(module => {
  module.initConverters();
  log("INFO", "modes", "converter modes loaded");
}).catch(err => {
  log("ERROR", "modes", "failed to load converter modes", err);
});
```

- [ ] **Step 3: Test all modes end-to-end**

Open the application in Chrome 142+ and test each mode:
1. **Standard** → Basic arithmetic (+, −, ×, ÷, %, x², √, 1/x)
2. **Scientific** → Trig functions, logarithms, exponentials, dropdowns
3. **Programmer** → HEX/DEC/OCT/BIN conversion, bitwise operations
4. **Graphing** → Function plotting, zoom controls
5. **Date** → Date difference calculation
6. **Converters** → Length, Weight, Temperature, Time conversions

- [ ] **Step 4: Verify CSS ALU compliance**

Check that no JavaScript performs arithmetic:
- All computation uses `getComputedStyle()` to read CSS `--result` properties
- No `+`, `*`, `/` operators on numbers in mode JS files

- [ ] **Step 5: Run lint and typecheck**

```bash
npm run lint
npm run typecheck
```

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete Windows 11 Calculator features with CSS-only computation

- Added Scientific/Engineering mode with trigonometry and functions
- Added Programmer mode with base conversion and bitwise operations
- Added Graphing mode with function plotting
- Added Date calculation mode
- Added unit converters (Length, Weight, Temperature, Time)
- All computation delegated to CSS ALU (no JavaScript arithmetic)
- Maintained CSS-Server philosophy: CSS as processor, JS as I/O transport"
```

---

## Summary

This plan implements all Windows 11 Calculator features while strictly adhering to the CSS-Server philosophy:

1. **CSS as Processor:** All mathematical operations performed exclusively in CSS
2. **Dumb System Bus:** JavaScript only collects input and reads results
3. **DOM as Memory:** State stored in DOM attributes and CSS custom properties
4. **Visual Observability:** Each computation creates visible DOM nodes
5. **Self-Cleaning Lifecycle:** DOM nodes removed after computation

**New files:** 7 SCSS modules + 5 JS mode handlers = 12 new files
**Modified files:** 3 (index.html, main.js, main.scss)
