#!/usr/bin/env node
/**
 * Add claritynclex.com auth callback URLs to the Supabase project allowlist.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/update-supabase-redirect-urls.mjs
 * or:
 *   node scripts/update-supabase-redirect-urls.mjs sbp_xxx
 *
 * Get the token at https://supabase.com/dashboard/account/tokens
 * It only needs the project to be in your dashboard; no extra scopes required.
 */

const PROJECT_REF = "gciwxmfbradcebxnthos"; // claritynclex Supabase project
const SITE_URL = "https://claritynclex.com";

const NEW_REDIRECTS = [
  "https://claritynclex.com/**",
  "https://www.claritynclex.com/**",
  "https://claritynclex.chapaisolutions.com/**",
];

function getToken() {
  const argToken = process.argv[2];
  const envToken = process.env.SUPABASE_ACCESS_TOKEN;
  const token = argToken || envToken;
  if (!token || !token.startsWith("sbp_")) {
    console.error("Missing Personal Access Token (sbp_...).");
    console.error("Generate one at https://supabase.com/dashboard/account/tokens");
    console.error("Then run: SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/update-supabase-redirect-urls.mjs");
    process.exit(1);
  }
  return token;
}

async function api(token, method, path, body) {
  const res = await fetch(`https://api.supabase.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Supabase API ${method} ${path} → ${res.status}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function main() {
  const token = getToken();
  console.log(`Fetching current auth config for project ${PROJECT_REF}...`);

  const current = await api(token, "GET", `/v1/projects/${PROJECT_REF}/config/auth`);

  const existingRedirects = (current.uri_allow_list ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const merged = Array.from(new Set([...existingRedirects, ...NEW_REDIRECTS]));

  console.log("Current redirect allowlist:");
  for (const url of existingRedirects) console.log(`  - ${url}`);
  console.log("\nNew redirect allowlist:");
  for (const url of merged) console.log(`  - ${url}`);
  console.log(`\nUpdating Site URL to ${SITE_URL} and writing allowlist...`);

  await api(token, "PATCH", `/v1/projects/${PROJECT_REF}/config/auth`, {
    site_url: SITE_URL,
    uri_allow_list: merged.join(","),
  });

  console.log("\n✓ Supabase auth redirect URLs updated.");
  console.log(`✓ Site URL set to ${SITE_URL}.`);
  console.log(`✓ Allowlist now contains ${merged.length} entries.`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
