# CSS-Server — Static Runtime

[![Version](https://img.shields.io/badge/version-0.1.0-blue)](package.json)
[![License](https://img.shields.io/badge/license-Apache%202.0-green)](LICENSE)
[![Rust](https://img.shields.io/badge/rust-2021-orange)](src-tauri/Cargo.toml)
[![Tauri](https://img.shields.io/badge/tauri-2-purple)](src-tauri/Cargo.toml)
[![Chromium](https://img.shields.io/badge/chromium-133%2B-red)](#who-is-this-for)

A static browser runtime where **CSS does the computation**. The calculator is the proof module; the GitHub Pages site in `docs/` is the public runtime shell showing local CSS/HTML computation plus outbound HTTP transport without a backend process.

## Why CSS-Server exists

Normally in a web app: HTML is structure, CSS is styling, JavaScript is logic. CSS-Server flips that model: **DOM is memory, CSS is the processor, JavaScript/Rust are constrained I/O buses**.

The project started with a calculator because arithmetic, converters, graphing, and settings are a compact test of deterministic behavior. If CSS/HTML can run that proof module, the same substrate can be attached to other I/O surfaces.

```css
--result: calc(var(--a) + var(--b));
```

CSS-Server is not a replacement for a real backend, and it should not be sold as one. Its value is in the narrow places where normal backend deployment is unavailable, excessive, or intentionally avoided. A static host such as GitHub Pages cannot run private server code, keep secrets, open sockets, or persist durable process state. But the browser still has a runtime, a DOM, CSS evaluation, user-triggered network requests, and enough visible state to model surprising pieces of application behavior.

The point is to ask what remains possible when the backend is absent, constrained, or deliberately pushed to the edge.

The public GitHub Pages direction is deliberately static:

- GitHub Pages serves files only.
- The browser performs computation locally.
- JavaScript uses normal outbound Web APIs such as `fetch`.
- CSS/HTML hold visible task state and classify computed results.
- No shared API secrets are bundled.
- No inbound server is claimed or hidden.

## Try it

### GitHub Pages runtime

The public site source lives entirely in [`docs/`](docs/):

```text
docs/index.html
docs/styles.css
docs/main.js
docs/src/index.html
```

It can be served directly by GitHub Pages from the `docs/` folder. The first runtime demo includes:

- an embedded calculator proof module plus a standalone calculator page;
- a Network Lab that performs user-triggered outbound `fetch`;
- CSS status/latency/payload/content classification from DOM attributes;
- explicit safety and deployment boundaries on the landing page itself.

### Local calculator proof module

```bash
git clone https://github.com/Lotargo/css-server.git
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

| Mode           | CSS-powered math                                                       |
| -------------- | ---------------------------------------------------------------------- |
| **Standard**   | Add, subtract, multiply, divide, percent, square root, square          |
| **Scientific** | sin, cos, tan, log, ln, sqrt, exp, abs — DEG/RAD switchable            |
| **Programmer** | AND, OR, XOR, NOT, bit shifts — decomposed per-bit in CSS              |
| **Graphing**   | Plots function equations point by point via CSS, renders on `<canvas>` |
| **Date**       | Difference between two dates in days, months, years                    |
| **Converters** | Currency, length, volume, weight, temperature, time                    |
| **Settings**   | Theme (system/dark/light), angle mode, precision, sidebar              |

## Who is this for?

**For developers** — a demonstration of how far modern CSS has come: typed `attr()`, `if()` conditionals, `calc()` with `@property`, Style Queries, `:has()` routing, and native math functions all working together as a computation layer.

**For runtime experimenters** — a static-site boundary test: backend-adjacent runtime behavior and outbound API workbench behavior without server-side execution on GitHub Pages.

**For everyone else** — a fully featured local calculator proof module with themes, calculation history, memory, and a built-in HTTP server.

## Developer quick start

```bash
npm install
npm run dev              # SCSS watch + Tauri dev (concurrent)
npm run build:css        # Compile SCSS manually
node --test tests/e2e.test.js    # E2E tests (6 tests, zero external deps)
```

## Local backend architecture

- **Rust** (Tauri) runs an HTTP server on `:8080`, injects requests as DOM nodes
- **CSS** reads typed values via `attr()`, computes via `calc()` + `if()` branching, validates, then triggers an animation on success
- **JS** only catches `animationend`, reads `getComputedStyle`, and sends the result back
- **SQLite** persists calculation history
- **Backpressure** — max 3 active + 5 queued requests; excess gets HTTP 429

Communication is Tauri events only — not a single `#[tauri::command]`.

## Project structure

```
├── docs/                   # GitHub Pages static runtime site
│   ├── index.html          # Landing + calculator proof + Network Lab
│   ├── main.js             # Browser transport/orchestration only
│   ├── styles.css          # Self-contained site CSS and CSS compute demo
│   └── src/                # Standalone public calculator page
├── src/                    # Local calculator proof module
│   ├── index.html          # SPA with all calculator modes
│   ├── main.js             # Bridge, settings, pipeline
│   ├── styles/             # 14 SCSS partials
│   │   └── main.scss       # Entry point
│   ├── styles.css          # Compiled output
│   └── modes/              # JS handlers per mode
├── src-tauri/              # Rust backend (HTTP, IPC, SQLite)
├── tests/e2e.test.js       # E2E tests (node:test)
└── .brains/                # Dev session tracking
```

## GitHub Pages Boundary

CSS-Server does not claim that GitHub Pages runs backend code. Pages serves static assets from `docs/`; the browser executes the runtime locally.

Network Lab uses normal browser `fetch`. That means:

- CORS applies;
- user-triggered requests are visible;
- shared provider API keys must not be committed or bundled;
- abusive traffic generation, scraping at scale, spam, mining, or stealth behavior are out of scope.

## License

Licensed under the [Apache License, Version 2.0](LICENSE).
