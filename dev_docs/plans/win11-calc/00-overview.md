# Windows 11 Calculator Features — Overview

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all Windows 11 Calculator modes and converters while maintaining the CSS-Server philosophy where CSS is the processor and JavaScript/Rust is only the I/O transport layer.

**Architecture:** Each calculator mode will be implemented as a separate CSS module (`_scientific.scss`, `_programmer.scss`, `_graphing.scss`, `_date.scss`, `_converters.scss`). The mode switching logic uses CSS classes on the root container to show/hide mode-specific UI and activate corresponding CSS ALU pipelines. All mathematical operations must be performed exclusively in CSS using `calc()`, `if()`, `style()`, and trigonometric functions where available.

**Tech Stack:** HTML5, CSS3 (SCSS), Vanilla JavaScript, Tauri/Rust (system bus only), CSS `if()` (Chrome 137+), typed `attr()` (Chrome 133+), `@property` for typed custom properties.

---

## Global Constraints

1. **CSS-only computation:** ALL business logic (arithmetic, trigonometry, conversions) MUST be implemented in CSS. JavaScript is strictly forbidden from performing any calculations.
2. **Dumb System Bus:** The Tauri/Rust layer and JavaScript event handlers contain zero `if/else` branches on business data, zero arithmetic operations, and zero data transformation.
3. **DOM as Memory:** All state is stored in DOM attributes and CSS custom properties. No external state stores.
4. **Visual Observability:** Every computation must be visually represented as DOM nodes moving through pipeline zones.
5. **Self-Cleaning Lifecycle:** All DOM nodes must be removed after computation via CSS animations and `animationend` events.
6. **Browser Compatibility:** Minimum Chromium 142+ for `if()` with range syntax, `style()` queries, and typed `attr()`.
7. **Modular SCSS:** Each backend module is an isolated `.scss` file compiled into a single CSS binary.

---

## File Structure

### New Files to Create
```
src/styles/
├── _scientific.scss      # Scientific/Engineering calculator ALU and UI
├── _programmer.scss      # Programmer mode (hex, octal, bin) ALU and UI
├── _graphing.scss        # Graphing mode (function plotting) ALU and UI
├── _date.scss            # Date calculation ALU and UI
├── _converters.scss      # Unit converter ALU and UI
├── _mode-switcher.scss   # Mode switching logic and layout transitions
└── _dropdown-menus.scss  # Trigonometry/Function dropdown menus

src/
├── modes/
│   ├── scientific.js     # Mode-specific UI event handlers (NO arithmetic)
│   ├── programmer.js     # Mode-specific UI event handlers (NO arithmetic)
│   ├── graphing.js       # Mode-specific UI event handlers (NO arithmetic)
│   ├── date.js           # Mode-specific UI event handlers (NO arithmetic)
│   └── converters.js     # Mode-specific UI event handlers (NO arithmetic)
```

### Files to Modify
```
src/index.html           # Add mode-specific HTML sections
src/main.js              # Add mode switching and event delegation
src/styles/main.scss     # Import new SCSS modules
```

---

## Task Index

| # | Task | Files | Plan |
|---|------|-------|------|
| 1 | Mode Switching Infrastructure | `_mode-switcher.scss`, `index.html`, `main.js` | [→](01-task-mode-switcher.md) |
| 2 | Scientific ALU | `_scientific.scss` | [→](02-task-scientific.md) |
| 3 | Scientific Event Handlers | `scientific.js` | [→](02-task-scientific.md) |
| 4 | Programmer ALU | `_programmer.scss` | [→](03-task-programmer.md) |
| 5 | Programmer Event Handlers | `programmer.js` | [→](03-task-programmer.md) |
| 6 | Graphing ALU | `_graphing.scss` | [→](04-task-graphing.md) |
| 7 | Graphing Event Handlers | `graphing.js` | [→](04-task-graphing.md) |
| 8 | Date ALU | `_date.scss` | [→](05-task-date.md) |
| 9 | Date Event Handlers | `date.js` | [→](05-task-date.md) |
| 10 | Converters ALU | `_converters.scss` | [→](06-task-converters.md) |
| 11 | Converter Event Handlers | `converters.js` | [→](06-task-converters.md) |
| 12 | Dropdown Menus | `_dropdown-menus.scss` | [→](07-task-dropdowns.md) |
| 13 | Final Integration | all files | [→](08-task-integration.md) |

---

## Execution Handoff

Two execution options:

**1. Subagent-Driven (recommended)** — Dispatch fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
