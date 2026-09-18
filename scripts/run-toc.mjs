import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundledRoot = path.join(os.homedir(), ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "python", "python.exe");
const candidates = [
  process.env.PYTHON ? { command: process.env.PYTHON, prefix: [] } : null,
  fs.existsSync(bundledRoot) ? { command: bundledRoot, prefix: [] } : null,
  { command: "python", prefix: [] },
  { command: "py", prefix: ["-3"] }
].filter(Boolean);

const script = path.join(projectRoot, "scripts", "extract-toc.py");
const args = [script, path.join(projectRoot, "data", "pdfs"), "--metadata", path.join(projectRoot, "data", "metadata.json"), "--out", path.join(projectRoot, "data", "toc.json")];
let lastError = "";
for (const candidate of candidates) {
  const result = spawnSync(candidate.command, [...candidate.prefix, ...args], { cwd: projectRoot, stdio: "inherit", windowsHide: true });
  if (!result.error && result.status === 0) process.exit(0);
  lastError = result.error?.message || `exit ${result.status}`;
}
console.error(`No working Python interpreter was found (${lastError}). Set the PYTHON environment variable to a Python 3 executable.`);
process.exit(1);
