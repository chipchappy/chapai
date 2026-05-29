#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const args = new Map();
for (const arg of process.argv.slice(2)) {
  const match = arg.match(/^--([^=]+)=(.*)$/);
  if (match) {
    args.set(match[1], match[2]);
  }
}

const base = args.get("base") || process.env.NO_VISUAL_DIFF_BASE || "HEAD~1";
const head = args.get("head") || process.env.NO_VISUAL_DIFF_HEAD || "HEAD";
const allow = process.env.ALLOW_VISUAL_DIFF === "1";

const zeroSha = /^0{40}$/;

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function resolveRef(ref) {
  if (!ref || zeroSha.test(ref)) return "";
  try {
    return git(["rev-parse", "--verify", `${ref}^{commit}`]);
  } catch {
    return "";
  }
}

const resolvedBase = resolveRef(base) || resolveRef("HEAD~1");
const resolvedHead = resolveRef(head) || resolveRef("HEAD");

if (!resolvedBase || !resolvedHead) {
  console.error("Unable to resolve git refs for visual drift guard.");
  console.error(`base=${base}`);
  console.error(`head=${head}`);
  process.exit(1);
}

const changed = git([
  "diff",
  "--name-only",
  "--diff-filter=ACMRTUXB",
  `${resolvedBase}..${resolvedHead}`,
])
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const visualRiskPatterns = [
  /^apps\/web\/src\/app\/.*\/page\.tsx$/,
  /^apps\/web\/src\/app\/page\.tsx$/,
  /^apps\/web\/src\/app\/layout\.tsx$/,
  /^apps\/web\/src\/app\/.*\/layout\.tsx$/,
  /^apps\/web\/src\/app\/error\.tsx$/,
  /^apps\/web\/src\/app\/global-error\.tsx$/,
  /^apps\/web\/src\/components\/.*\.(tsx|css)$/,
  /^apps\/web\/src\/styles\//,
  /^apps\/web\/src\/.*\.module\.css$/,
  /^apps\/web\/public\//,
  /^apps\/web\/tailwind\.config\./,
  /^apps\/web\/postcss\.config\./,
];

const blocked = changed.filter((path) =>
  visualRiskPatterns.some((pattern) => pattern.test(path.replaceAll("\\", "/"))),
);

if (blocked.length > 0 && !allow) {
  console.error("Visual drift guard failed.");
  console.error("This push changes files that can alter the public UI/visuals:");
  for (const path of blocked) {
    console.error(`- ${path}`);
  }
  console.error("");
  console.error("Backend/data-only deploys must not include visual-risk files.");
  console.error("Set ALLOW_VISUAL_DIFF=1 only when the UI change is explicitly approved.");
  process.exit(1);
}

if (blocked.length > 0) {
  console.warn("Visual drift guard overridden by ALLOW_VISUAL_DIFF=1.");
  for (const path of blocked) {
    console.warn(`- ${path}`);
  }
} else {
  console.log(`Visual drift guard passed for ${resolvedBase.slice(0, 7)}..${resolvedHead.slice(0, 7)}.`);
}
