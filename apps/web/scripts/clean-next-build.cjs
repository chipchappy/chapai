const fs = require("node:fs");
const path = require("node:path");

const buildDir = path.join(__dirname, "..", ".next");

fs.rmSync(buildDir, { recursive: true, force: true });
console.log("Cleaned .next build directory.");
