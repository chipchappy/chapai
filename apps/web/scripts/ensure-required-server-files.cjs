const fs = require("node:fs");
const path = require("node:path");

const requiredFiles = [
  path.join(__dirname, "..", ".next", "BUILD_ID"),
  path.join(__dirname, "..", ".next", "routes-manifest.json"),
  path.join(__dirname, "..", ".next", "prerender-manifest.json"),
];

const missing = requiredFiles.filter((file) => !fs.existsSync(file));

if (missing.length > 0) {
  console.error("Next build is missing required output files:");
  for (const file of missing) {
    console.error(`- ${path.relative(path.join(__dirname, ".."), file)}`);
  }
  process.exit(1);
}

console.log("Verified required Next build output files.");
