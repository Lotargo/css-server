import { spawn, exec } from 'child_process';
import test from 'node:test';
import assert from 'node:assert';
import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';

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
  // Clean up old db file if exists
  if (fs.existsSync('css_server.db')) {
    try {
      fs.unlinkSync('css_server.db');
    } catch (e) {}
  }

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

test('E2E-5: Backpressure rate limiting (HTTP 429)', async () => {
  // Fire 10 concurrent requests.
  // MAX_ACTIVE = 3, MAX_QUEUE = 5, total capacity = 8.
  // 8 requests should resolve with 200, 2 should immediately fail with 429.
  const requests = Array.from({ length: 10 }, (_, idx) => {
    return fetch(SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ a: idx, b: 5 })
    }).then(async res => {
      return {
        status: res.status,
        body: (await res.text()).trim()
      };
    }).catch(err => {
      return {
        status: 0,
        body: err.message
      };
    });
  });

  const responses = await Promise.all(requests);

  const statuses = responses.map(r => r.status);
  const count429 = statuses.filter(s => s === 429).length;
  const count200 = statuses.filter(s => s === 200).length;

  console.log(`E2E-5 responses: statuses = ${JSON.stringify(statuses)}`);

  assert.strictEqual(count429, 2, 'Exactly 2 requests should be rejected with 429');
  assert.strictEqual(count200, 8, 'Exactly 8 requests should resolve successfully with 200');
});

test('E2E-6: SQLite Database Persistence (Directive C)', async () => {
  const payload = { a: 4, b: 7 };
  const response = await fetch(SERVER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.strictEqual(response.status, 200);
  const result = await response.text();
  assert.strictEqual(result.trim(), '11');

  // Verify the database contains the saved calculation
  assert.ok(fs.existsSync('css_server.db'), 'Database file css_server.db should be created');
  const db = new DatabaseSync('css_server.db');
  const query = db.prepare('SELECT * FROM calculations WHERE val_a = 4 AND val_b = 7');
  const rows = query.all();

  assert.strictEqual(rows.length, 1, 'Should find exactly one row in DB matching calculation');
  assert.strictEqual(rows[0].result, 11, 'DB calculation result should match expected output');
  assert.ok(rows[0].id, 'Calculation record should have a valid UUID as primary key');
  db.close();
});
