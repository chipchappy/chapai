import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envFile = join(root, "apps", "web", ".env.clinical-simulation.local");
const config = join(root, "apps", "web", "wrangler.clinical-simulation.local.jsonc");
const persistence = join(root, ".local-state", "clinical-simulation");
const wranglerCli = join(root, "node_modules", "wrangler", "bin", "wrangler.js");

function run(command, args) {
  let executable = command;
  let commandArgs = args;
  if (process.platform === "win32" && (command === "npm" || command === "npx")) {
    const npmCli = process.env.npm_execpath;
    if (!npmCli) throw new Error("npm_execpath is unavailable");
    const cli = command === "npx" ? join(dirname(npmCli), "npx-cli.js") : npmCli;
    executable = process.execPath;
    commandArgs = [cli, ...args];
  }
  const result = spawnSync(executable, commandArgs, {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!existsSync(envFile) || !existsSync(persistence)) {
  console.error("Run npm run clinical-sim:setup before starting the local simulator.");
  process.exit(1);
}

const authSecret = readFileSync(envFile, "utf8")
  .split(/\r?\n/)
  .find((line) => line.startsWith("AUTH_SECRET="))
  ?.slice("AUTH_SECRET=".length)
  .trim();
if (!authSecret || authSecret.length < 24) {
  console.error("The generated local AUTH_SECRET is missing or invalid. Run npm run clinical-sim:setup again.");
  process.exit(1);
}

run("npm", ["run", "build:worker", "--workspace=@chapai/web"]);
run(process.execPath, [
  wranglerCli,
  "dev",
  "--config",
  config,
  "--local",
  "--persist-to",
  persistence,
  "--local-protocol",
  "https",
  "--port",
  "8788",
  "--var",
  `AUTH_SECRET:${authSecret}`,
]);
