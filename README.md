# CSS-Server

**Glass Box Backend Architecture** — a reactive graph computation machine that uses HTML+CSS as its runtime environment.

> **Status:** Experimental PoC | Esoteric programming | EdTech substrate
>
> Not intended for production use. See [`dev_docs/DISCLAIMER.md`](dev_docs/DISCLAIMER.md).

## Quick Start

```bash
npm install
npm run tauri dev
```

Server listens on `http://localhost:8080`.

```bash
curl -X POST http://localhost:8080/add -d '{"a":5,"b":10}'
# => 15
```

## Documentation

All project documentation is in [`dev_docs/`](dev_docs/):

| Document | Description |
|---|---|
| [`blueprint.md`](dev_docs/blueprint.md) | Architecture, pipeline, version support matrix |
| [`manifest.md`](dev_docs/manifest.md) | Core principles and philosophy |
| [`sprint-doc.md`](dev_docs/sprint-doc.md) | Current sprint backlog, DoD, verification gate |
| [`DISCLAIMER.md`](dev_docs/DISCLAIMER.md) | Limitations, risks, production prohibitions |

## How It Works (30 Seconds)

1. **Rust** listens on `:8080`, injects HTTP request data as a DOM node
2. **CSS** extracts typed values (`attr()`), computes (`calc()`), validates (`if()` + Range Syntax), and triggers an animation
3. **JavaScript** (bridge only) catches `animationend`, reads the result, sends it back to Rust
4. **Rust** responds to the HTTP client and removes the node

The system bus (Rust/JS) is strictly prohibited from executing business logic.

## Stack

- **Runtime:** Tauri v2 (Rust + WebView2)
- **Memory / AST:** HTML DOM with `data-*` attributes
- **Processor / Router:** CSS (`attr()`, `calc()`, `if()`, `:has()`, Style Queries)
- **Target engine:** Chromium 133+ / WebView2 (Windows)

## Project Structure

```
├── dev_docs/              # Architecture & sprint documentation
├── src/                   # Frontend (HTML + CSS + JS bridge)
│   ├── index.html
│   ├── styles.css
│   └── main.js
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── main.rs
│   │   └── lib.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
└── README.md
```
