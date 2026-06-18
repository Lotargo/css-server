# Blueprint: CSS-Server v1.0

**Architecture: Reactive Graph Computation Machine ("Glass Box Backend")**

## 1. Foundational Model

The architecture maps the classic Harvard computer architecture onto web standards:

| Harvard Element | CSS-Server Mapping |
|---|---|
| Memory (RAM + AST) | HTML DOM — state is stored in typed `data-*` attributes, hidden `<input type="checkbox">` registers, and the node tree structure |
| Processor (ALU + Router) | CSS — pattern matching via selectors, typed data extraction via `attr()`, conditional branching via `if()`, arithmetic via `calc()`, and flow control via `:has()` |
| I/O Controller (System Bus) | Tauri/Rust or Node.js/JS — responsible only for translating HTTP/TCP requests into HTML node injection and listening for `animationend` events to dispatch responses |

The system bus is strictly prohibited from executing business logic. Its sole function is data transport.

---

## 2. Computation Pipeline

All backend logic is expressed using CSS Values and Units Module Level 5, CSS Conditional Rules Level 5, and Selectors Level 4.

### Step 1: Request Injection (System Bus → Memory)

On receiving an HTTP request (e.g., `POST /auth {"role": "admin", "age": 22}`), the I/O layer creates a DOM node:

```html
<div class="http-request" data-endpoint="/auth" data-role="admin" data-age="22">
  <div class="css-processor-core"></div>
</div>
```

### Step 2: Typed Data Extraction (Memory → Registers)

The enhanced `attr()` function (Chrome 133+, Baseline 2026) parses typed values from DOM attributes into CSS custom properties:

```css
.http-request {
  --req-endpoint: attr(data-endpoint type(<string>));
  --req-role: attr(data-role type(<custom-ident>));
  --req-age: attr(data-age type(<number>));
}
```

### Step 3: Routing (Selector Pattern Matching)

The `:has()` pseudo-class acts as the request router by scanning the AST for matching endpoints:

```css
body:has(> .http-request[data-endpoint="/auth"]) .auth-module {
  display: flex;
  transform: scale(1);
}
```

### Step 4: Business Logic (CSS ALU)

The `if()` function (Chrome 137+, Aug 2025) provides inline ternary logic. Combined with Range Syntax for Style Queries (Chrome 142+), it evaluates numeric conditions:

```css
.auth-module .css-processor-core {
  --is-authorized: if(
    style(--req-role: admin): 1;
    style(--req-age >= 18): 1;
    else: 0
  );

  animation: if(
    style(--is-authorized: 1): trigger-success-response 0.5s forwards;
    else: trigger-error-response 0.5s forwards;
  );
}
```

### Step 5: Result Dispatch and Garbage Collection

1. The CSS animation completes, firing a standard DOM `animationend` event.
2. The system bus reads computed CSS custom properties via `getComputedStyle(node).getPropertyValue('--result')`.
3. The bus sends the HTTP response and removes the DOM node (`node.remove()`), freeing memory.

---

## 3. Version Support Matrix

| Feature | 2026 Status | Minimum Engine Version | Role in CSS-Server |
|---|---|---|---|
| CSS `if()` | Experimental (Chromium only) | Chromium 137+, Edge 137+ | Conditional property values (if/else) without JS |
| CSS Style Queries | Baseline Widely Available | Chromium 119+, Safari 17.4+ | Reference `--variable` states from `if()` |
| Range Syntax (Style Queries) | Experimental (Chromium only) | Chromium 142+ | Comparison operators (`>=`, `<=`) for numeric values |
| Advanced `attr()` (typed) | Newly Available | Chromium 133+ (Chrome Jan 2025) | Extract typed data from HTML attributes |
| `:has()` pseudo-class | Baseline Widely Available | Chromium 105+, Safari 15.4+, Firefox 121+ | Pattern matching and parent-driven routing |
| CSS Nesting | Baseline Widely Available | Chromium 120+, Safari 17.2+, Firefox 117+ | Modular, composable stylesheets |
| `@scope` | Newly Available | Chromium 118+, Safari 17.4+, Firefox 146+ | Component-scoped CSS without specificity leaks |
| `@function` | Experimental (Chromium only) | Chromium 139+ | Reusable custom functions (future direction) |
| Container Queries | Baseline Widely Available | Chromium 105+, Safari 16+, Firefox 110+ | Component-level responsive routing |

---

## 4. Mathematical Basis: Turing Completeness

HTML+CSS was proven Turing-complete as early as 2010–2022 (e.g., Rule 110 cellular automaton, 2-state 2-symbol Busy Beaver implemented in pure CSS using checkbox hacks and the sibling combinator `~`). The introduction of `if()`, `style()`, and typed `attr()` eliminates the need for checkbox-trick workarounds, providing a native declarative branching mechanism.

The computation model is:
- **State:** DOM subtree (custom properties on specific nodes)
- **Control flow:** CSS selector evaluation + `if()` branching
- **Clock/timing:** CSS animations and transitions (via `animationend` events)

---

## 5. Architectural Constraints

1. **Data locality.** All request state resides in the DOM. No external state store.
2. **No de-serialization.** Debugging reads DOM directly via DevTools — no JSON parsing needed.
3. **Single-threaded execution.** The browser's style engine runs on the main thread. Concurrent requests require WebView-level or OS-level parallelism.
4. **Memory pressure.** Each request is a heavyweight DOM node. At scale, DOM size becomes the limiting resource.

---

## References

1. Chrome Introduces CSS If Function (InfoQ, 2025) — `if()` shipping in Chrome 137.
2. CSS `if()` function — MDN Web Docs (2026).
3. CSS Style Queries: Smarter Components (Medium, 2025) — Style Queries support from Chrome 119+.
4. Range Syntax for Style Queries (Una Kravets, Chrome DevRel, 2025) — Chrome 142+ range operators.
5. Advanced `attr()` — Chrome for Developers (Bramus, Jan 2025) — Typed attr in Chrome 133.
6. CSS in 2026: New features (LogRocket, 2026).
7. Mooninaut/css-is-turing-complete (GitHub, 2022–2025) — Turing completeness proofs.
8. Baseline and browser support in 2026 (cssShowcase, Mar 2026).
