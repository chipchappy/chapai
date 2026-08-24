// ---------------------------------------------------------------------------
// Shared model access for the content pipeline.
//
// Cerebras first, NVIDIA as fallback. Measured 2026-08-22:
//
//   Cerebras gpt-oss-120b   ~1s per call, 1000 req/min, 500k tok/min
//   NVIDIA   llama-3.1-70b  ~36s per call
//
// That is roughly a 30x difference in wall clock, so the enrichment scripts are
// concurrency-bound rather than model-bound now, and the batch runner below
// exists to actually use that headroom.
//
// gpt-oss-120b is a reasoning model: without reasoning_effort it spends the
// whole token budget thinking and returns an EMPTY content field. That is not a
// failure to retry — it is a configuration error, and it silently produced
// blank output the first time it was tried on this project.
// ---------------------------------------------------------------------------

const clean = (v) => String(v ?? "").replace(/^["']|["']$/g, "").trim();

export const PROVIDERS = [
  {
    name: "cerebras",
    url: "https://api.cerebras.ai/v1/chat/completions",
    key: () => clean(process.env.CEREBRAS_API_KEY),
    model: "gpt-oss-120b",
    extra: { reasoning_effort: "low" },
    timeoutMs: 90_000,
  },
  {
    name: "nvidia",
    url: "https://integrate.api.nvidia.com/v1/chat/completions",
    key: () => clean(process.env.NVIDIA_API_KEY),
    model: "meta/llama-3.1-70b-instruct",
    extra: {},
    timeoutMs: 600_000,
  },
];

/**
 * One completion, walking the provider chain. Returns { text, provider }.
 * Throws only when every configured provider has failed.
 */
export async function complete(messages, options = {}) {
  const { maxTokens = 1600, temperature = 0.3, json = true, attemptsPerProvider = 3 } = options;
  const errors = [];

  for (const provider of PROVIDERS) {
    const key = provider.key();
    if (!key) { errors.push(`${provider.name}: no key`); continue; }

    for (let attempt = 1; attempt <= attemptsPerProvider; attempt += 1) {
      try {
        const response = await fetch(provider.url, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: provider.model,
            messages,
            max_tokens: maxTokens,
            temperature,
            ...(json ? { response_format: { type: "json_object" } } : {}),
            ...provider.extra,
          }),
          signal: AbortSignal.timeout(provider.timeoutMs),
        });

        if (response.status === 429 || response.status >= 500) {
          // Back off within this provider before giving up on it entirely; a
          // minute-window rate limit clears fast.
          await new Promise((r) => setTimeout(r, [2_000, 8_000, 20_000][attempt - 1] ?? 20_000));
          continue;
        }
        if (!response.ok) {
          errors.push(`${provider.name} ${response.status}: ${(await response.text()).slice(0, 120)}`);
          break;   // auth/model errors do not improve with retries
        }
        const text = (await response.json()).choices?.[0]?.message?.content ?? "";
        if (!text.trim()) {
          errors.push(`${provider.name}: empty content (reasoning budget?)`);
          break;
        }
        return { text, provider: provider.name };
      } catch (error) {
        errors.push(`${provider.name}: ${error?.name === "TimeoutError" ? "timeout" : error?.message}`);
      }
    }
  }
  throw new Error(`all providers failed - ${errors.join(" | ")}`);
}

/**
 * Run `worker` over `items` with a fixed number of workers in flight.
 *
 * Plain Promise.all over 1,700 items would open 1,700 sockets at once and trip
 * the per-minute limit immediately; this keeps exactly `concurrency` in flight
 * and starts the next item as soon as one finishes.
 */
export async function mapConcurrent(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.max(1, Math.min(concurrency, items.length)) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

export function parseJsonLoose(raw) {
  const cleaned = String(raw).replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0) return null;
  try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
}
