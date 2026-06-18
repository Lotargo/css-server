import { spawn, exec } from 'child_process';
import test from 'node:test';
import assert from 'node:assert';

const SERVER_URL = 'http://localhost:8080/add';
let devProcess = null;

// Clean up processes on exit
function cleanup() {
  if (devProcess) {
    try {
      devProcess.kill('SIGTERM');
    } catch (e) {}
  }
  if (process.platform === 'win32') {
    // Forcefully kill css-server.exe on Windows to prevent orphaned ports
    try {
      exec('taskkill /F /IM css-server.exe');
    } catch (e) {}
  }
}

async function waitForServer(url, timeoutMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      // Send OPTIONS request to test port availability
      await fetch(url, { method: 'OPTIONS' });
      return true;
    } catch (err) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}

test.before(async () => {
  console.log('Starting development server...');
  devProcess = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    shell: true,
    stdio: 'ignore' // Suppress output so it doesn't clutter the test runner
  });

  // Wait for port 8080 to become responsive
  await waitForServer(SERVER_URL);
  // Give WebView/Frontend 4.5 seconds to fully load and register Tauri event listeners
  await new Promise(resolve => setTimeout(resolve, 4500));
  console.log('Server is ready. Running tests...');
});

test.after(() => {
  console.log('Cleaning up processes...');
  cleanup();
});

// Guard against early exits or unhandled crashes
process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(1); });
process.on('SIGTERM', () => { cleanup(); process.exit(1); });

test('E2E-1: Valid calculation (5 + 10 = 15)', async () => {
  const response = await fetch(SERVER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ a: 5, b: 10 })
  });

  assert.strictEqual(response.status, 200);
  const result = await response.text();
  assert.strictEqual(result.trim(), '15');
});

test('E2E-2: Negative input validation (a: -1, b: 5)', async () => {
  const response = await fetch(SERVER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ a: -1, b: 5 })
  });

  assert.strictEqual(response.status, 400);
  const result = await response.text();
  assert.match(result, /Error: negative input or constraint violation/);
});

test('E2E-3: Non-numeric input (a: "x", b: 10)', async () => {
  const response = await fetch(SERVER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ a: 'x', b: 10 })
  });

  assert.strictEqual(response.status, 400);
  const result = await response.text();
  assert.match(result, /Error: negative input or constraint violation/);
});

test('E2E-4: Concurrent request processing (5 requests parallel)', async () => {
  const requests = Array.from({ length: 5 }, (_, idx) => {
    return fetch(SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ a: idx, b: idx * 2 })
    }).then(async res => {
      return {
        status: res.status,
        body: (await res.text()).trim()
      };
    });
  });

  const responses = await Promise.all(requests);

  responses.forEach((res, idx) => {
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body, String(idx + idx * 2));
  });
});
