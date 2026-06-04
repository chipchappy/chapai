#!/usr/bin/env node
// Stamps NEXT_PUBLIC_COMMIT_SHA + NEXT_PUBLIC_BUILD_AT into .env.production
// so /api/version can return them at runtime. Idempotent; rewrites the values
// each build.
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function safeExec(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const commit = safeExec("git rev-parse HEAD") || "unknown";
const builtAt = new Date().toISOString();

const envPath = path.join(__dirname, "..", ".env.production");
let content = "";
try {
  content = fs.readFileSync(envPath, "utf8");
} catch {
  // File doesn't exist yet
}

function setVar(content, key, value) {
  const escapedValue = JSON.stringify(value);
  const line = `${key}=${escapedValue}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(content)) {
    return content.replace(re, line);
  }
  return content + (content && !content.endsWith("\n") ? "\n" : "") + line + "\n";
}

content = setVar(content, "NEXT_PUBLIC_COMMIT_SHA", commit);
content = setVar(content, "NEXT_PUBLIC_BUILD_AT", builtAt);

fs.writeFileSync(envPath, content, "utf8");
console.log(`[stamp-build-meta] commit=${commit.slice(0, 8)} builtAt=${builtAt}`);
