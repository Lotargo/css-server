# Architectural Disclaimer and Risk Notice

**Project:** CSS-Server (Glass Box Backend Architecture)
**Status:** Experimental Concept / Proof of Concept
**Classification:** Esoteric programming, engineering art, EdTech substrate

---

## 1. Scope of the Experiment

CSS-Server investigates the feasibility of using a browser engine (Blink/WebKit) as a server-side runtime for business logic. With the introduction of `if()`, typed `attr()`, Range Syntax for Style Queries, and `:has()`, the HTML+CSS combination forms a Turing-complete declarative environment capable of arithmetic, branching, and routing without JavaScript in the logic layer. The DOM serves as RAM and AST; CSS serves as the ALU and router.

This project is an exploration of limits, not a production-ready system.

---

## 2. Production Prohibitions

This implementation must **not** be used in production, high-load environments, or any system requiring reliability or security. Fundamental limitations include:

| Limitation | Impact |
|---|---|
| **Performance** | Computation runs through the browser's style pipeline (reflow/repaint), orders of magnitude slower than Go, Rust, or Node.js |
| **Memory (OOM risk)** | Every request is a heavyweight DOM node. Traffic spikes exhaust process memory rapidly |
| **No algorithmic primitives** | CSS lacks loops (`while`/`for`), string manipulation, bitwise operations, and cryptography |
| **Single-threaded** | Style computation blocks the main thread. Parallel request processing is not possible within a single WebView |
| **Browser dependency** | Critical features (`if()`, range style queries) are Chromium-only as of mid-2026. Firefox and Safari support is partial or roadmap-only |

---

## 3. Architectural Taboo: I/O Layer Purity

The system bus (Tauri/Rust or Node.js/JS) is strictly limited to I/O translation:

- **Permitted:** HTTP parsing, DOM injection, `getComputedStyle` reads, `node.remove()`, `animationend` listeners.
- **Forbidden:** `if/else` on business data, arithmetic, data transformation, validation, JWT parsing, cryptography.

Violation of this rule invalidates the architecture. The bus must remain intellectually empty.

---

## 4. Strategic Positioning

This project is classified as:

- **Esoteric programming language** — a deliberately constrained, unconventional computation model.
- **Engineering art** — demonstrates the expressive limits of web standards.
- **EdTech foundation** — visualises invisible server processes, bridging the frontend/backend comprehension gap.

Future work may produce a high-level abstraction layer (JS/Python → CSS compiler), but the current phase deliberately operates at the "raw assembler" level.

---

## 5. Current Phase: Raw CSS Logic Core

The project is in the **Raw Assembler Phase**:

- No developer tooling or abstractions.
- All logic gates (AND, OR, NOT), adders, clock generators, and routers are implemented in raw CSS and HTML.
- The goal is to prove viability at the lowest possible level before considering syntactic sugar.

See `sprint-doc.md` for the current sprint backlog (v0.1.0 "Glass Calculator").
