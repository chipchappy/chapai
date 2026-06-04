const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");

const appRoot = process.cwd();
const requiredArtifacts = [
  path.join(appRoot, ".next", "BUILD_ID"),
  path.join(appRoot, ".next", "server", "app-paths-manifest.json"),
  path.join(appRoot, ".next", "server", "pages-manifest.json"),
];

if (requiredArtifacts.every((artifact) => fs.existsSync(artifact))) {
  console.log("OpenNext build command: reusing existing .next build artifacts.");
  process.exit(0);
}

cp.execSync("npm run build", {
  cwd: appRoot,
  stdio: "inherit",
});
