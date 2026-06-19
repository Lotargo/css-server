# Sprint Document: GitHub Pages Runtime

**Codename:** "Static Backend Landing"

**Objective:** Pivot CSS-Server from a Tauri-first calculator experiment into a GitHub Pages-ready static runtime that demonstrates backend-like computation inside the browser using HTML/CSS as the computation substrate and JavaScript as an outbound I/O adapter.

**Project Status:** The calculator and Tauri desktop shell have served their proof role. Tauri may remain as an optional local shell, but it is no longer the main product direction. The next product target is a static site that can be deployed to GitHub Pages while still demonstrating visible computation, network transport, and DOM/CSS task pipelines.

---

## 1. Strategic Thesis

CSS-Server should be presented as a static browser runtime, not merely as a calculator.

The key claim:

> A GitHub Pages site cannot run server-side code, but it can deliver a browser-native runtime where HTML/CSS perform local computation and JavaScript provides transparent outbound network transport.

This is not an attempt to bypass GitHub Pages restrictions. It is an attempt to explore the full legal surface of static hosting:

- GitHub Pages serves static files only.
- The browser performs computation locally.
- JavaScript may call external APIs through normal Web APIs.
- CSS/HTML remain the visible computation and state substrate.
- No inbound server, hidden worker farm, abuse traffic, mining, or secret exfiltration is part of the design.

The project should feel provocative, but remain technically honest and policy-safe.

---

## 2. Why The Calculator Still Matters

The calculator was chosen because it is a compact proof target:

- arithmetic requires deterministic computation;
- converters require coefficient tables and mode routing;
- graphing requires repeated evaluation and visual rendering;
- settings require persisted UI state;
- the app exposes enough complexity to prove the runtime model is not only decorative.

If CSS/HTML can handle calculator semantics, then the next question becomes what I/O surfaces can be attached to that substrate.

The calculator should remain as a live demo module, but not as the whole identity of the project.

---

## 3. New Product Shape

### 3.1 Static Landing

The first screen should explain and demonstrate the idea immediately:

- "backend-like computation without a backend";
- live visual pipeline;
- calculator/converter as proof module;
- network lab as the next proof module;
- links to manifest, source, and deployment notes.

### 3.2 Live Runtime Demo

The landing should include a usable embedded demo, not only marketing copy:

- CSS task creation;
- visible request queue;
- computed result extraction;
- diagnostics panel;
- small examples that work entirely in the browser.

### 3.3 Network Lab

Network Lab is the next major proof surface.

It should let the user:

- choose a CORS-friendly endpoint;
- select HTTP method;
- edit headers and body;
- send an outbound `fetch` request;
- see request/response lifecycle;
- route response metadata into DOM attributes/custom properties;
- let CSS classify, format, or validate parts of the response where practical.

This does not make GitHub Pages an inbound backend. It makes the browser runtime a visible outbound API workbench.

---

## 4. Architecture Boundary

### Allowed

- Static HTML/CSS/JS assets on GitHub Pages.
- Client-side computation in CSS/HTML.
- JavaScript as orchestration and transport glue.
- Outbound `fetch`, `WebSocket`, `EventSource`, and later WebRTC where practical.
- User-provided API keys stored locally by explicit user action.
- Local-only Tauri shell as optional historical/desktop packaging.

### Not Allowed

- Hiding API secrets in the frontend bundle.
- Pretending GitHub Pages is running our server-side code.
- Inbound HTTP listener from the Pages deployment.
- Automated abuse traffic, DDoS patterns, spam, scraping at scale, cryptomining, or stealth behavior.
- Moving business computation into JavaScript just because it is easier.

---

## 5. Technical Risks

- **CORS:** many APIs will reject browser-origin requests.
- **Secrets:** frontend code cannot safely store shared provider keys.
- **Browser support:** the CSS computation model depends on modern Chromium features such as typed `attr()`, `if()`, `:has()`, and advanced `calc()`.
- **Performance:** CSS-as-computation should remain bounded and visible; infinite or excessive task generation would undermine the project.
- **Messaging:** "static backend" must be explained carefully so it reads as a runtime model, not as a claim that GitHub executes backend code for us.

---

## 6. Phase A: Static Profile

**Goal:** Make the app run cleanly as a static browser site without Tauri.

- [x] Identify and isolate Tauri-only code paths.
- [x] Add a static runtime mode that does not require Rust, Tauri, SQLite, or local HTTP server.
- [x] Ensure `file`/static server execution works without Tauri globals.
- [x] Preserve the CSS computation pipeline.
- [x] Document which features are local-only vs static-compatible.

### Static Profile Notes

The GitHub Pages site is self-contained in `docs/`. This directory is the Pages source, not a generated mirror of `src/`.

Included:

- `docs/index.html`;
- `docs/main.js`;
- `docs/styles.css`;
- site-facing notes under `docs/notes`;
- a small live CSS computation proof.

Excluded:

- calculator app source under `src/`;
- `src-tauri`;
- Rust local HTTP server;
- SQLite bridge;
- development watcher scripts;
- SCSS source modules from the calculator app.

This preserves a clean boundary: the calculator remains a proof module in the repository, while the public GitHub Pages site evolves independently under `docs/`.

---

## 7. Phase B: GitHub Pages Build

**Goal:** Prepare a Pages-compatible build/deploy path.

- [x] Decide whether the Pages app is served from `/`, `/css-server/`, or a dedicated `docs/` output.
- [x] Keep all Pages site assets inside `docs/`.
- [x] Ensure asset paths work under a GitHub Pages project path.
- [x] Add deployment notes inside `docs/notes`.
- [ ] Optionally add GitHub Actions deployment after manual static validation.

### Pages Build Notes

The first deployment target is a GitHub Pages project site under `/css-server/`.

Manual deployment source:

- Pages source: `docs/`;
- entrypoint: `docs/index.html`;
- deployment notes: `docs/notes/deployment.html`.

GitHub Actions deployment remains deferred until the static runtime is manually validated and Network Lab has a stable initial shape.

---

## 8. Phase C: Landing Runtime

**Goal:** Turn the first screen into a live explanation of the project.

- [x] Replace calculator-first framing with runtime-first framing.
- [x] Add concise project thesis.
- [x] Add live CSS task demo in the first viewport.
- [x] Keep calculator available as proof module.
- [x] Link to manifest, disclaimer, and GitHub Pages runtime notes.

---

## 9. Phase D: Network Lab

**Goal:** Demonstrate outbound HTTP from the static runtime.

- [x] Add `Network Lab` mode.
- [x] Add endpoint, method, headers, and body controls.
- [x] Implement transparent `fetch` transport in JavaScript.
- [x] Render request lifecycle as visible DOM tasks.
- [x] Route response status, headers, and body summary into DOM/CSS-readable state.
- [x] Start with CORS-friendly public APIs that do not require secrets.
- [x] Add clear user-facing warnings for custom endpoints and API keys.

---

## 10. Phase E: CSS Response Processing

**Goal:** Keep the "CSS computes" promise alive in the network demo.

- [x] Let CSS classify response status ranges.
- [ ] Let CSS validate simple response fields where feasible.
- [ ] Let CSS compute derived metrics such as latency bands, payload size bands, and result badges.
- [ ] Keep JSON parsing in JavaScript only as I/O normalization, not business decision logic.
- [x] Document every JS boundary that exists because browser APIs require it.

---

## 11. Phase F: Positioning

**Goal:** Explain the project in a way that is provocative, clear, and policy-safe.

- [ ] Add "Why CSS-Server exists" to README.
- [ ] Add "GitHub Pages Runtime" section to the manifest or link this document.
- [ ] Explain that GitHub Pages hosts static files only.
- [ ] Explain that computation happens in the browser.
- [ ] Explain that outbound API calls use normal browser Web APIs.
- [ ] Include a safety/acceptable-use note.

---

## 12. Phase G: Verification

- [ ] Static app works from a local static server.
- [ ] Static app works from GitHub Pages.
- [ ] No Tauri dependency is required for the landing/runtime demo.
- [ ] Network Lab succeeds against at least one public CORS-friendly endpoint.
- [ ] Network Lab handles CORS failure visibly and gracefully.
- [ ] No shared API key is committed or bundled.
- [ ] Browser checks cover desktop and mobile viewports.
- [ ] The project remains understandable to someone arriving from GitHub.

---

## 13. Recommended Execution Order

1. [ ] Phase A: Static Profile.
2. [ ] Phase B: GitHub Pages Build.
3. [ ] Phase C: Landing Runtime.
4. [ ] Phase D: Network Lab.
5. [ ] Phase E: CSS Response Processing.
6. [ ] Phase F: Positioning.
7. [ ] Phase G: Verification.
