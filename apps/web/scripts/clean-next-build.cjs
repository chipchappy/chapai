const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const targets = [
  path.join(process.cwd(), ".next"),
  path.join(process.cwd(), ".open-next"),
  path.join(process.cwd(), "tsconfig.tsbuildinfo"),
  path.join(process.cwd(), "tsconfig.typecheck.tsbuildinfo"),
];

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function forceRemove(target) {
  try {
    fs.rmSync(target, { recursive: true, force: true });
  } catch {}

  if (!fs.existsSync(target)) {
    return;
  }

  try {
    execFileSync("powershell", [
      "-NoProfile",
      "-Command",
      `if (Test-Path -LiteralPath '${target.replace(/'/g, "''")}') { Remove-Item -LiteralPath '${target.replace(/'/g, "''")}' -Recurse -Force -ErrorAction SilentlyContinue }`,
    ], { stdio: "ignore" });
  } catch {}

  if (!fs.existsSync(target)) {
    return;
  }

  try {
    execFileSync("cmd.exe", [
      "/d",
      "/s",
      "/c",
      `if exist "${target}" rmdir /s /q "${target}"`,
    ], { stdio: "ignore" });
  } catch {}
}

for (const target of targets) {
  if (!fs.existsSync(target)) {
    continue;
  }

  for (let attempt = 0; attempt < 5 && fs.existsSync(target); attempt += 1) {
    forceRemove(target);
    if (fs.existsSync(target)) {
      sleep(250);
    }
  }
}
