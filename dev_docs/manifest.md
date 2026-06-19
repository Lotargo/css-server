# Manifest: CSS-Server — The Glass Backend Era

## Statement of Purpose

Server-side development has historically operated inside opaque containers where process state is inferred from log files and monitoring dashboards rather than observed directly. CSS-Server proposes an alternative: a server architecture built on the principle of **absolute visual observability** and **DOM-isomorphic state**, where code execution and its visualization are the same operation.

---

## Core Principles

### 1. DOM as Memory

The DOM tree replaces the traditional heap and call stack.

- Every `<div>`, `<input>`, or `<span>` is a memory cell and an active process.
- Parent–child relationships form the data bus and AST routing paths.
- Program state is a visible, mutable DOM structure — inspectable and editable via DevTools at runtime. No abstraction layer hides it.

### 2. CSS as Processor

CSS is not a styling language. It is a declarative, reactive, Turing-complete computation layer.

- Selectors continuously scan the DOM for pattern matches.
- `calc()` performs arithmetic.
- `if()` (Chrome 137+) provides inline conditional branching.
- `attr()` (typed, Chrome 133+) extracts structured data from DOM attributes.
- `:has()` implements routing and context propagation.

Business logic is expressed in selectors and property values.

### 3. Dumb System Bus

The I/O layer (JavaScript, Rust, or any system language) has zero decision-making authority.

- Its contract: translate network requests into DOM nodes; read results from `getComputedStyle` after `animationend`; remove processed nodes.
- No `if/else`, no arithmetic, no data transformation on the bus.
- Any business logic in the system bus is an architectural violation.

### 4. Observability by Default

The runtime environment is its own dashboard.

- Request flow is physically visible as DOM nodes moving through layout regions.
- Bottlenecks appear as visual congestion (accumulated nodes in a zone).
- Errors render as rejected blocks routed to a visible error zone.
- Debugging is tactile — a stuck process can be unblocked by toggling a checkbox in DevTools.

### 5. Self-Cleaning Lifecycle

Every process has a finite lifecycle managed by CSS animations.

- Animation duration defines time-to-live.
- `animationend` signals completion.
- The system bus removes the node, triggering DOM garbage collection.

---

## GitHub Pages Runtime

CSS-Server is no longer framed only as a local desktop calculator shell. The calculator remains the proof module, while the GitHub Pages site demonstrates the broader claim: static hosting can deliver a browser-native runtime where backend-like computation happens locally.

This boundary is explicit:

- GitHub Pages serves static files only.
- The browser owns execution.
- CSS/HTML act as the visible computation and state substrate.
- JavaScript provides transparent outbound transport through normal Web APIs such as `fetch`.
- API secrets are not bundled into the frontend.
- No inbound server, hidden process, mining, spam, scraping at scale, or abusive traffic generation is part of the architecture.

Network Lab exists to make this boundary inspectable. JavaScript normalizes browser I/O into DOM attributes; CSS classifies status families, response metrics, and simple response fields from those attributes.

---

## Call to Action

CSS-Server exists to make server internals visible. We invite engineers to reconsider the assumption that backend logic must be invisible. The web platform has evolved beyond its origins — it is now a capable computation environment that renders its own execution.

We build with what exists: the DOM, CSS, and a deliberately constrained I/O layer.

*CSS-Server Team. 2026.*
