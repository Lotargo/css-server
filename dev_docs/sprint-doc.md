# Sprint Document: CSS-Server PoC v0.1.0

**Codename:** "Glass Calculator"

**Objective:** Demonstrate the feasibility of the manifest by building a visual backend endpoint that accepts HTTP requests, performs computation and routing exclusively in CSS, and returns a response — with the entire process visible on screen.

---

## 1. Sprint Backlog

### Task 1: Dumb System Bus (Tauri / JS I/O Layer)
**Status:** `[in progress]` **Priority:** P1

Implement a minimal HTTP server using Tauri (Rust) + WebView.

**Requirements:**
- Listen for `POST` requests on `localhost:8080/add`.
- **Input:** Parse JSON `{ "a": 5, "b": 10 }` and inject a DOM node:
  `<div class="request add-task" data-a="5" data-b="10"></div>`
- **Output:** Use `MutationObserver` or `animationend` listener. When the node acquires class `.ready-for-dispatch`, read the computed CSS variable via `getComputedStyle(node).getPropertyValue('--result')`.
- **Cleanup:** Respond HTTP 200 with the result value; call `node.remove()`.
- **Constraint:** No `if/else`, arithmetic (`+`, `-`, `*`, `/`), or data transformation in Rust/JS. Transport only.

### Task 2: Memory Layout (HTML Architecture)
**Status:** `[pending]` **Priority:** P1

Define the visual "motherboard" layout.

**Requirements:**
- Use CSS Grid to define zones: Inbound slot, ALU Lane, Outbound slot, Error/Trash zone.
- Each zone is a positioned container that nodes enter/exit via CSS transitions.

### Task 3: ALU and Router (CSS Logic Core)
**Status:** `[pending]` **Priority:** P1

Implement backend business logic.

**Requirements:**
- **Routing:** Use `:has()` to detect `.add-task` and activate the addition pipeline.
- **Memory read:** Use typed `attr()`:
  `--val-a: attr(data-a type(<number>));`
- **Computation:** `--result: calc(var(--val-a) + var(--val-b));`
- **Validation:** Use `if()` + `style()` to check for negative or NaN results. Route failures to the error zone.

### Task 4: Visualisation (Glass Box Animations)
**Status:** `[pending]` **Priority:** P2

Animate the computation lifecycle.

**Requirements:**
- Inbound request appears as a grey block in the Inbound slot.
- During `calc()`, the block transitions (via `transform` + `transition`) to the centre zone and changes to blue.
- On success: green block, `slide-to-outbound` animation (1.5s duration).
- On error: red block, `drop-to-trash` animation (1s duration).
- Animation completion triggers the `animationend` event for the system bus.

---

## 2. Definition of Done

1. `curl -X POST http://localhost:8080/add -d '{"a": 5, "b": 10}'` returns `15`.
2. On-screen visual shows a block with values 5 and 10 moving left to right, merging, turning green, and vanishing.
3. Invalid input (e.g., non-numeric values) is handled by CSS and returns HTTP 400.
4. No memory leaks — all DOM nodes are removed after response dispatch.

---

## 3. MVP Directives

### Directive A: Modularity and Build Pipeline

Production code must not reside in a single `styles.css`. Introduce a build step (Sass, Less, or PostCSS) with modular architecture:

- Each backend module is an isolated `.scss` file (e.g., `_auth.scss`, `_router.scss`, `_alu.scss`).
- A compiler assembles them into a single CSS "binary" loaded at server start.

### Directive B: Memory Management and Backpressure

The DOM is a constrained resource. At scale, animations and layout recalculations cause OOM.

- Implement a rate limiter at the system bus level.
- If more than N active request nodes exist in the DOM, queue incoming requests in Rust/JS or reply HTTP 429.
- Release queued requests as slots become available.

### Directive C: Persistent State (Database I/O)

CSS cannot write to disk. MVP requires a synchronous syscall mechanism for persistence.

- The CSS moves a node to a designated I/O zone (`<div id="db-write-queue">`).
- The system bus detects the node, freezes the process, reads data, writes to SQLite, and writes the result back as `data-db-result="..."`.
- CSS continues processing along the success/failure path.

### Directive D: Bus Purity

Under no circumstances should business logic migrate to the system bus. If CSS lacks a capability (e.g., SHA-256 hashing), it must be provided as an external microservice call, not implemented in the bus layer. The bus remains a transparent conduit.
