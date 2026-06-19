# CSS-Server — Glass Calculator

[![Version](https://img.shields.io/badge/version-0.1.0-blue)](package.json)
[![License](https://img.shields.io/badge/license-Apache%202.0-green)](LICENSE)
[![Rust](https://img.shields.io/badge/rust-2021-orange)](src-tauri/Cargo.toml)
[![Tauri](https://img.shields.io/badge/tauri-2-purple)](src-tauri/Cargo.toml)
[![Chromium](https://img.shields.io/badge/chromium-133%2B-red)](dev_docs/blueprint.md)

A calculator where **CSS does the math**. Not a gimmick — a fully working Windows 11 Calculator clone with every mode, from basic arithmetic to graphing, all computed by CSS `calc()`, `if()`, and `@property`.

## The idea

Normally in a web app: HTML is structure, CSS is styling, JavaScript is logic. Here it's reversed — **CSS is the processor**, JavaScript and Rust are just the I/O bus. Every single calculation, from `2+2` to trigonometry to bitwise AND, lives in CSS rules:

```css
--result: calc(var(--a) + var(--b));
```

The architecture maps the Harvard computer model onto web standards: **DOM as memory**, **CSS as ALU**, **JS/Rust as a deliberately dumb system bus**. The entire request pipeline is visible — DOM nodes physically move through layout zones, animations show each computation's lifecycle.

## Try it

```bash
git clone https://github.com/your-username/css-server.git
cd css-server
```

**Windows:**
```bat
run.bat
```

**Linux / macOS:**
```bash
chmod +x run.sh && ./run.sh
```

Or manually:

```bash
npm install
npm run dev
```

A calculator window opens with all modes. There's also an HTTP server on `:8080` that computes through the same CSS pipeline:

```bash
curl -X POST http://localhost:8080/add -d '{"a":5,"b":10}'
# => 15
```

## Calculator modes

| Mode | CSS-powered math |
|---|---|
| **Standard** | Add, subtract, multiply, divide, percent, square root, square |
| **Scientific** | sin, cos, tan, log, ln, sqrt, exp, abs — DEG/RAD switchable |
| **Programmer** | AND, OR, XOR, NOT, bit shifts — decomposed per-bit in CSS |
| **Graphing** | Plots function equations point by point via CSS, renders on `<canvas>` |
| **Date** | Difference between two dates in days, months, years |
| **Converters** | Currency, length, volume, weight, temperature, time |
| **Settings** | Theme (system/dark/light), angle mode, precision, sidebar |

## Who is this for?

**For developers** — a demonstration of how far modern CSS has come: typed `attr()`, `if()` conditionals, `calc()` with `@property`, Style Queries, `:has()` routing, and native math functions all working together as a computation layer.

**For everyone else** — a fully featured calculator with dark theme, calculation history, memory, and a built-in HTTP server.

## Developer quick start

```bash
npm install
npm run dev              # SCSS watch + Tauri dev (concurrent)
npm run build:css        # Compile SCSS manually
node --test tests/e2e.test.js    # E2E tests (6 tests, zero external deps)
```

## Backend architecture

- **Rust** (Tauri) runs an HTTP server on `:8080`, injects requests as DOM nodes
- **CSS** reads typed values via `attr()`, computes via `calc()` + `if()` branching, validates, then triggers an animation on success
- **JS** only catches `animationend`, reads `getComputedStyle`, and sends the result back
- **SQLite** persists calculation history
- **Backpressure** — max 3 active + 5 queued requests; excess gets HTTP 429

Communication is Tauri events only — not a single `#[tauri::command]`.

## Project structure

```
├── src/                    # Frontend (HTML + SCSS + JS bridge)
│   ├── index.html          # SPA with all calculator modes
│   ├── main.js             # Bridge, settings, pipeline
│   ├── styles/             # 14 SCSS partials
│   │   └── main.scss       # Entry point
│   ├── styles.css          # Compiled output
│   └── modes/              # JS handlers per mode
├── src-tauri/              # Rust backend (HTTP, IPC, SQLite)
├── dev_docs/               # Architecture & sprint documentation
├── dist/pages/             # GitHub Pages static build
├── docs/                   # GitHub Pages landing site
├── tests/e2e.test.js       # E2E tests (node:test)
└── .brains/                # Dev session tracking
```

## GitHub Pages (no Tauri needed)

The full calculator runs in any browser without a desktop runtime:

```bash
npm run build:static   # → dist/pages/
```

Deploy to `https://<user>.github.io/css-server/`.

## Docs

All documentation in [`dev_docs/`](dev_docs/):

| Document | About |
|---|---|
| [`blueprint.md`](dev_docs/blueprint.md) | Architecture, pipeline, browser support matrix |
| [`manifest.md`](dev_docs/manifest.md) | Core principles and philosophy |
| [`sprint-doc.md`](dev_docs/sprint-doc.md) | Backlog, definition of done, verification |
| [`DISCLAIMER.md`](dev_docs/DISCLAIMER.md) | Limitations, risks |

## License

Licensed under the [Apache License, Version 2.0](LICENSE).
