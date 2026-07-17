import { pbkdf2Sync, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = join(root, "apps", "web", "wrangler.clinical-simulation.local.jsonc");
const persistence = join(root, ".local-state", "clinical-simulation");
const envFile = join(root, "apps", "web", ".env.clinical-simulation.local");
const wranglerCli = join(root, "node_modules", "wrangler", "bin", "wrangler.js");
const database = "chapai-clinical-simulation-local";
const defaultEmail = "clinical.sim.test@clarity.local";
const defaultPassword = "ClinicalSimLocal2026!";
const isolationEmail = "clinical.sim.isolation@clarity.local";
const isolationPassword = "ClinicalSimIsolation2026!";

function fail(message) {
  console.error(`Clinical Simulation local setup failed: ${message}`);
  process.exit(1);
}

function quoteSql(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function run(command, args, options = {}) {
  if (args.includes("--remote")) fail("remote database operations are prohibited");
  let executable = command;
  let commandArgs = args;
  if (process.platform === "win32" && (command === "npm" || command === "npx")) {
    const npmCli = process.env.npm_execpath;
    if (!npmCli) fail("npm_execpath is unavailable");
    const cli = command === "npx" ? join(dirname(npmCli), "npx-cli.js") : npmCli;
    executable = process.execPath;
    commandArgs = [cli, ...args];
  }
  const result = spawnSync(executable, commandArgs, {
    cwd: root,
    env: process.env,
    stdio: options.capture ? "pipe" : "inherit",
    encoding: "utf8",
  });
  if (result.error) fail(result.error.message);
  if (result.status !== 0) {
    if (options.capture && result.stderr) console.error(result.stderr.trim());
    fail(`${command} exited with code ${result.status ?? "unknown"}`);
  }
  return result.stdout ?? "";
}

function wranglerArgs(extra) {
  return [
    "d1",
    "execute",
    database,
    "--local",
    "--persist-to",
    persistence,
    "--config",
    config,
    "--yes",
    ...extra,
  ];
}

function executeFile(relativePath) {
  const file = join(root, relativePath);
  if (!existsSync(file)) fail(`missing migration ${relativePath}`);
  run(process.execPath, [wranglerCli, ...wranglerArgs(["--file", file])]);
}

function executeSql(sql, capture = false) {
  return run(process.execPath, [wranglerCli, ...wranglerArgs(["--command", sql])], { capture });
}

function writeLocalEnvironment() {
  if (existsSync(envFile)) return;
  const authSecret = randomBytes(32).toString("base64url");
  writeFileSync(envFile, [
    "# Generated for the isolated local Clinical Simulation worker. Never deploy this file.",
    "APP_ENV=development",
    "CLINICAL_SIMULATION_ENABLED=true",
    `AUTH_SECRET=${authSecret}`,
    "NEXTAUTH_URL=https://127.0.0.1:8788",
    "NEXT_PUBLIC_APP_URL=https://127.0.0.1:8788",
    "",
  ].join("\n"), "utf8");
}

function createLocalAuthSchema() {
  executeSql(`
    CREATE TABLE IF NOT EXISTS auth_accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_accounts_user_id ON auth_accounts(user_id);
  `);
}

function upsertTestAccount({ email, password, userId, accountId, name }) {
  email = email.trim().toLowerCase();
  if (!email.includes("@") || password.length < 12) fail("test email or password is invalid");
  const salt = randomBytes(16).toString("hex");
  const passwordHash = pbkdf2Sync(password, salt, 100_000, 32, "sha256").toString("base64url");
  executeSql(`
    INSERT INTO users (id, email, name, tier, created_at, updated_at)
    VALUES (${quoteSql(userId)}, ${quoteSql(email)}, ${quoteSql(name)}, 'free', unixepoch(), unixepoch())
    ON CONFLICT(id) DO UPDATE SET email=excluded.email, name=excluded.name, updated_at=unixepoch();
    DELETE FROM auth_accounts WHERE email=${quoteSql(email)} OR user_id=${quoteSql(userId)};
    INSERT INTO auth_accounts (id, user_id, email, password_hash, password_salt, created_at, updated_at)
    VALUES (${quoteSql(accountId)}, ${quoteSql(userId)}, ${quoteSql(email)}, ${quoteSql(passwordHash)}, ${quoteSql(salt)}, unixepoch(), unixepoch());
  `);
  return { email, password };
}

function setup() {
  mkdirSync(persistence, { recursive: true });
  writeLocalEnvironment();
  executeFile("packages/db/drizzle/migration-0001.sql");
  executeFile("packages/db/drizzle/migration-0006-instructor-cohorts.sql");
  executeFile("packages/db/drizzle/migration-0007-clinical-simulation.sql");
  createLocalAuthSchema();
  const credentials = upsertTestAccount({
    email: process.env.CLINICAL_SIM_TEST_EMAIL || defaultEmail,
    password: process.env.CLINICAL_SIM_TEST_PASSWORD || defaultPassword,
    userId: "clinical-simulation-local-tester",
    accountId: "clinical-simulation-local-auth",
    name: "Clinical Simulation Tester",
  });
  upsertTestAccount({
    email: isolationEmail,
    password: isolationPassword,
    userId: "clinical-simulation-local-isolation",
    accountId: "clinical-simulation-local-isolation-auth",
    name: "Clinical Simulation Isolation Tester",
  });
  console.log("\nClinical Simulation local data is ready.");
  console.log("URL:      https://127.0.0.1:8788/clinical-simulation");
  console.log(`Email:    ${credentials.email}`);
  console.log(`Password: ${credentials.password}`);
  console.log("The browser will show a local self-signed certificate warning on first open.");
}

function reset() {
  if (!existsSync(persistence)) {
    console.log("No local Clinical Simulation data exists; nothing to reset.");
    return;
  }
  executeSql("DELETE FROM clinical_simulation_actions; DELETE FROM clinical_simulation_assignments; DELETE FROM clinical_simulation_attempts;");
  console.log("Local Clinical Simulation attempts and assignments were reset. The test account was preserved.");
}

function destroy() {
  const resolvedPersistence = resolve(persistence);
  const expected = resolve(root, ".local-state", "clinical-simulation");
  if (resolvedPersistence !== expected) fail("refusing to remove an unexpected path");
  rmSync(resolvedPersistence, { recursive: true, force: true });
  rmSync(envFile, { force: true });
  console.log("Local Clinical Simulation data and generated environment file were removed.");
}

function inspect() {
  if (!existsSync(persistence)) fail("run npm run clinical-sim:setup first");
  const output = executeSql("SELECT id, scenario_id, scenario_version, status, seed, virtual_minute, updated_at FROM clinical_simulation_attempts ORDER BY updated_at DESC;", true);
  process.stdout.write(output);
}

const command = process.argv[2] ?? "setup";
if (command === "setup") setup();
else if (command === "reset") reset();
else if (command === "destroy") destroy();
else if (command === "inspect") inspect();
else fail(`unknown command ${command}`);
