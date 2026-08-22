import { API_KEY, MODEL } from './env.js';
import { fetch } from 'undici';

const REQUEST_TIMEOUT_MS = 600000;
const MAX_ATTEMPTS = 6;

async function chat(messages, options = {}) {
  let lastReason = "unknown";
  const { maxTokens = 1400, temperature = 0.4, response_format } = options;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens, temperature, ...(options.response_format ? { response_format: options.response_format } : {} ) }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (response.status === 429 || response.status >= 500) {
        lastReason = `${response.status}`;
        const wait = [15_000, 45_000, 120_000, 240_000, 360_000][attempt - 1] ?? 150_000;
        console.log(`    (capacity ${lastReason}, waiting ${Math.round(wait / 1000)}s — attempt ${attempt}/${MAX_ATTEMPTS})`);
        await sleep(wait);
        continue;
      }
      if (!response.ok) throw new Error(`${response.status} ${(await response.text()).slice(0, 180)}`);
      const payload = await response.json();
      return payload.choices?.[0]?.message?.content ?? "";
    } catch (error) {
      lastReason = error?.name === "TimeoutError" ? "timeout" : (error?.message ?? "error");
      if (attempt === MAX_ATTEMPTS) break;
      console.log(`    (${lastReason}, retrying — attempt ${attempt}/${MAX_ATTEMPTS})`);
      await sleep(10_000 * attempt);
    }
  }
  throw new Error(`exhausted retries (${lastReason})`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test the chat function with a simple prompt
async function testChat() {
  const messages = [
    { role: "system", content: "You are a helpful assistant. Respond in JSON format." },
    { role: "user", content: 'Generate a JSON object with a key "test" and value "hello world". Output only JSON.' }
  ];
  try {
    const resp = await chat(messages, { maxTokens: 50, temperature: 0.2 });
    console.log("Raw response:", resp);
    // Try to parse JSON
    const match = resp.match(/\{[\s\S]*\}/);
    if (match) {
      const json = JSON.parse(match[0]);
      console.log("Parsed JSON:", json);
    } else {
      console.log("No JSON found in response.");
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

testChat();