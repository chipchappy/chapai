import crypto from "node:crypto";

function getEnv(name) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : "";
}

function percentEncode(value) {
  return encodeURIComponent(value)
    .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function parseQueryParams(url) {
  const parsed = new URL(url);
  const params = [];
  for (const [key, value] of parsed.searchParams.entries()) {
    params.push([key, value]);
  }
  return params;
}

function normalizeUrl(url) {
  const parsed = new URL(url);
  return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
}

function buildOauthParams() {
  return {
    oauth_consumer_key: getEnv("CHAPAI_X_API_KEY"),
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: getEnv("CHAPAI_X_ACCESS_TOKEN"),
    oauth_version: "1.0",
  };
}

function buildSignature({ method, url, oauthParams, extraParams = [] }) {
  const allParams = [
    ...Object.entries(oauthParams),
    ...extraParams,
  ]
    .map(([key, value]) => [percentEncode(String(key)), percentEncode(String(value))])
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      if (leftKey === rightKey) {
        return leftValue.localeCompare(rightValue);
      }
      return leftKey.localeCompare(rightKey);
    });

  const parameterString = allParams.map(([key, value]) => `${key}=${value}`).join("&");
  const baseString = [
    method.toUpperCase(),
    percentEncode(normalizeUrl(url)),
    percentEncode(parameterString),
  ].join("&");

  const signingKey = `${percentEncode(getEnv("CHAPAI_X_API_SECRET"))}&${percentEncode(getEnv("CHAPAI_X_ACCESS_SECRET"))}`;
  return crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
}

function buildAuthorizationHeader(oauthParams) {
  const header = Object.entries(oauthParams)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${percentEncode(key)}="${percentEncode(String(value))}"`)
    .join(", ");

  return `OAuth ${header}`;
}

async function requestX({ method, url, body }) {
  const oauthParams = buildOauthParams();
  const extraParams = parseQueryParams(url);
  oauthParams.oauth_signature = buildSignature({ method, url, oauthParams, extraParams });

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: buildAuthorizationHeader(oauthParams),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await response.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    body: parsed ?? text,
  };
}

async function requestXBearer({ url }) {
  const bearer = getEnv("CHAPAI_X_BEARER_TOKEN");
  if (!bearer) {
    return {
      ok: false,
      status: 0,
      body: { message: "Missing CHAPAI_X_BEARER_TOKEN." },
    };
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${bearer}`,
    },
  });

  const text = await response.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    body: parsed ?? text,
  };
}

function assertCredentials() {
  const required = [
    "CHAPAI_X_API_KEY",
    "CHAPAI_X_API_SECRET",
    "CHAPAI_X_ACCESS_TOKEN",
    "CHAPAI_X_ACCESS_SECRET",
  ];

  const missing = required.filter((name) => !getEnv(name));
  if (missing.length > 0) {
    console.log(JSON.stringify({ ok: false, missing, message: "Missing X credentials." }));
    process.exit(1);
  }
}

function assertBearerToken() {
  if (!getEnv("CHAPAI_X_BEARER_TOKEN")) {
    console.log(JSON.stringify({ ok: false, missing: ["CHAPAI_X_BEARER_TOKEN"], message: "Missing X bearer token." }));
    process.exit(1);
  }
}

async function main() {
  const command = process.argv[2] ?? "validate";
  if (command === "validate") {
    assertCredentials();
    const result = await requestX({
      method: "GET",
      url: "https://api.twitter.com/1.1/account/verify_credentials.json?include_entities=false&skip_status=true",
    });

    if (!result.ok) {
      console.log(JSON.stringify({ ok: false, status: result.status, body: result.body }));
      process.exit(1);
    }

    console.log(JSON.stringify({
      ok: true,
      account: {
        id: result.body.id_str ?? String(result.body.id ?? ""),
        name: result.body.name ?? "",
        handle: result.body.screen_name ?? "",
      },
    }));
    return;
  }

  if (command === "post") {
    assertCredentials();
    const text = (process.argv[3] ?? "").trim();
    if (!text) {
      console.log(JSON.stringify({ ok: false, message: "Missing post text." }));
      process.exit(1);
    }

    const result = await requestX({
      method: "POST",
      url: "https://api.twitter.com/2/tweets",
      body: { text },
    });

    if (!result.ok) {
      console.log(JSON.stringify({ ok: false, status: result.status, body: result.body }));
      process.exit(1);
    }

    console.log(JSON.stringify({
      ok: true,
      tweet: result.body?.data ?? result.body,
    }));
    return;
  }

  if (command === "searchRecent") {
    assertBearerToken();
    const query = (process.argv[3] ?? "").trim();
    const maxResults = Number.parseInt(process.argv[4] ?? "10", 10);
    if (!query) {
      console.log(JSON.stringify({ ok: false, message: "Missing search query." }));
      process.exit(1);
    }

    const params = new URLSearchParams({
      query,
      max_results: String(Number.isFinite(maxResults) ? Math.min(Math.max(maxResults, 10), 100) : 10),
      "tweet.fields": "author_id,created_at,public_metrics,text",
    });

    const result = await requestXBearer({
      url: `https://api.twitter.com/2/tweets/search/recent?${params.toString()}`,
    });

    if (!result.ok) {
      console.log(JSON.stringify({ ok: false, status: result.status, body: result.body, query }));
      process.exit(1);
    }

    console.log(JSON.stringify({
      ok: true,
      query,
      tweets: result.body?.data ?? [],
      meta: result.body?.meta ?? {},
    }));
    return;
  }

  console.log(JSON.stringify({ ok: false, message: `Unknown command: ${command}` }));
  process.exit(1);
}

main().catch((error) => {
  console.log(JSON.stringify({ ok: false, message: error instanceof Error ? error.message : String(error) }));
  process.exit(1);
});
