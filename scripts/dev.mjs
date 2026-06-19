import { spawn, execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWindows = process.platform === "win32";
const nodeCmd = process.execPath;
const sassCli = path.join(rootDir, "node_modules", "sass", "sass.js");
const tauriCli = path.join(rootDir, "node_modules", "@tauri-apps", "cli", "tauri.js");

const children = new Map();
let shuttingDown = false;

function prefixStream(stream, prefix, target) {
  let buffer = "";
  stream.on("data", chunk => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.length > 0) target.write(`[${prefix}] ${line}\n`);
    }
  });
  stream.on("end", () => {
    if (buffer.length > 0) target.write(`[${prefix}] ${buffer}\n`);
  });
}

function start(name, args) {
  const child = spawn(nodeCmd, args, {
    cwd: rootDir,
    detached: !isWindows,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  children.set(name, child);
  prefixStream(child.stdout, name, process.stdout);
  prefixStream(child.stderr, name, process.stderr);

  child.on("exit", (code, signal) => {
    children.delete(name);
    const suffix = signal ? `signal ${signal}` : `code ${code}`;
    process.stdout.write(`[dev] ${name} exited with ${suffix}\n`);
    if (!shuttingDown) {
      shutdown(code ?? 0);
    }
  });

  child.on("error", error => {
    process.stderr.write(`[dev] failed to start ${name}: ${error.message}\n`);
    if (!shuttingDown) shutdown(1);
  });
}

function killChild(child) {
  if (child.exitCode !== null || child.killed) return;

  if (isWindows) {
    execFile("taskkill", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true }, () => {});
  } else {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      child.kill("SIGTERM");
    }
  }
}

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  process.stdout.write("[dev] shutting down child processes\n");

  for (const child of children.values()) {
    killChild(child);
  }

  setTimeout(() => {
    process.exit(exitCode);
  }, isWindows ? 700 : 300);
}

process.on("SIGINT", () => shutdown(130));
process.on("SIGTERM", () => shutdown(143));
process.on("SIGHUP", () => shutdown(129));

start("css", [sassCli, "src/styles/main.scss", "src/styles.css", "--watch", "--no-source-map"]);
start("tauri", [tauriCli, "dev"]);
