// Test script for enrich-row-rationales.mjs using mock data
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

const SYSTEM = `You are a nurse educator who writes rationales for matrix and ordering question rows/steps.
You produce ONLY valid minified JSON. No prose, no markdown, no code fences.
Each value must be 1-2 sentences, at least 15 words, and must mention the specific finding.
Do not repeat information across rows/steps.
Do not give away the answer to the question.
`;

function buildMatrixPrompt(row) {
  return `Generate a JSON object where keys are the row labels from matrixRows and values are 1-2 sentence rationales (>=15 words) explaining why each finding belongs in its assigned column. Use the following data:
Scenario Title: ${row.scenario_title ?? "Untitled"}
Scenario: ${row.scenario}
Stem: ${row.stem}
Matrix Columns: ${row.matrixColumns}
Matrix Rows: ${row.matrixRows}
Each rationale must be clinically accurate, mention the specific finding, and not repeat across rows.
Output ONLY minified JSON, e.g., {\"row1\":\"rationale...\",\"row2\":\"rationale...\"}.
`;
}

function buildOrderingPrompt(row) {
  return `Generate a JSON object where keys are the step labels (from options) and values are 1-2 sentence rationales (>=15 words) explaining why each step precedes the next one in the correct sequence. Use the following data:
Scenario Title: ${row.scenario_title ?? "Untitled"}
Scenario: ${row.scenario}
Stem: ${row.stem}
Options: ${row.options}
Correct Order: ${row.correctOrder}
Each rationale must be clinically accurate, mention the specific step, and follow priority framework (ABC, safety, assessment-before-intervention).
Output ONLY minified JSON, e.g., {\"step1\":\"rationale...\",\"step2\":\"rationale...\"}.
`;
}

async function main() {
  // Mock data: simulate a few matrix and ordering questions
  const mockQuestions = [
    {
      id: "q1",
      type: "matrix",
      scenario_title: "Hyponatremia due to SIADH",
      scenario: "68-year-old man, postoperative day 2 after right hemicolectomy for colon cancer, reports mild nausea and headache. Vitals: T 37.2, HR 88, BP 118/70, RR 16, SpO2 98%. Labs: Na 124 (baseline 138), K 4.1, Cl 110, serum osmolality 265, urine osmolality 520, urine Na 48.",
      stem: "Select ALL appropriate interventions for this patient with hyponatremia due to SIADH.",
      matrixColumns: "[\"Supports tPA\",\"Contraindication to tPA\"]",
      matrixRows: "[\"History of intracranial hemorrhage\",\"Recent major surgery\",\"Platelet count <100k\",\"Systolic BP >180\"]",
      options: null,
      correctOrder: null,
      distractorRationales: null
    },
    {
      id: "q2",
      type: "ordering",
      scenario_title: "Sepsis management",
      scenario: "45-year-old woman with fever, hypotension, and elevated lactate. Suspected sepsis.",
      stem: "Order the following steps in the correct sequence for sepsis management.",
      matrixColumns: null,
      matrixRows: null,
      options: "[\"Draw blood cultures\",\"Administer broad-spectrum antibiotics\",\"Administer fluid bolus\",\"Measure lactate\"]",
      correctOrder: "[\"Draw blood cultures\",\"Administer broad-spectrum antibiotics\",\"Administer fluid bolus\",\"Measure lactate\"]",
      distractorRationales: null
    }
  ];
  
  console.log(`Found ${mockQuestions.length} mock questions to process.`);
  
  const updates = [];
  
  for (const q of mockQuestions) {
    let prompt;
    if (q.type === "matrix") {
      prompt = buildMatrixPrompt(q);
    } else if (q.type === "ordering") {
      prompt = buildOrderingPrompt(q);
    } else {
      continue;
    }
    
    const messages = [
      { role: "system", content: SYSTEM },
      { role: "user", content: prompt }
    ];
    
    let rawResponse = "";
    try {
      rawResponse = await chat(messages, { maxTokens: 800, temperature: 0.2 });
    } catch (err) {
      console.error(`Failed to get response for question ${q.id}:`, err.message);
      continue;
    }
    
    console.log(`Raw response for ${q.id}:`, rawResponse.substring(0, 200));
    
    // Attempt to parse JSON
    let rationalesJson;
    try {
      // Extract JSON from response (in case there is extra text)
      const match = rawResponse.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON object found");
      rationalesJson = JSON.parse(match[0]);
    } catch (err) {
      console.error(`Failed to parse JSON for ${q.id}:`, err.message);
      console.error("Raw response:", rawResponse);
      continue;
    }
    
    // Validate each rationale: length >=15 words, mentions specific finding (key)
    const valid = Object.entries(rationalesJson).every(([key, value]) => {
      if (typeof value !== "string") return false;
      const wordCount = value.trim().split(/\s+/).length;
      if (wordCount < 15) {
        console.warn(`Rationale for ${q.id}[${key}] too short (${wordCount} words): ${value}`);
        return false;
      }
      // Check that the key (row/step label) appears in the value (mentions specific finding)
      if (!value.toLowerCase().includes(key.toLowerCase())) {
        console.warn(`Rationale for ${q.id}[${key}] does not mention the key "${key}": ${value}`);
        return false;
      }
      return true;
    });
    
    if (!valid) {
      console.warn(`Skipping question ${q.id} due to validation failures.`);
      continue;
    }
    
    // Prepare update: set distractorRationales to JSON string of rationalesJson
    const newDistractorRationales = JSON.stringify(rationalesJson);
    updates.push({
      id: q.id,
      distractorRationales: newDistractorRationales,
      type: q.type,
    });
  }
  
  if (updates.length === 0) {
    console.log("No valid updates to apply.");
    return;
  }
  
  console.log(`Prepared ${updates.length} updates.`);
  
  console.log("Updates:");
  for (const u of updates) {
    console.log(`  ID ${u.id} (${u.type}): distractorRationales = ${u.distractorRationales}`);
  }
  
  console.log("Done.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});