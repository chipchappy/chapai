const path = require("node:path");
const { spawn } = require("node:child_process");

const appRoot = process.cwd();
const nextCliCandidates = [
  path.join(appRoot, "node_modules", "next", "dist", "bin", "next"),
  path.join(appRoot, "..", "..", "node_modules", "next", "dist", "bin", "next"),
];
const nextCli = nextCliCandidates.find((candidate) => require("node:fs").existsSync(candidate));

if (!nextCli) {
  console.error("Unable to locate Next.js build binary.");
  process.exit(1);
}

const child = spawn(process.execPath, ["--max-old-space-size=12288", nextCli, "build"], {
  cwd: appRoot,
  stdio: "inherit",
  env: process.env,
});

child.on("close", (code) => {
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
