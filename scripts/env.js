// env.js - exports API_KEY and MODEL for NVIDIA API
const API_KEY = (process.env.NVIDIA_API_KEY ?? "").replace(/^[\"']|[\"']$/g, "").trim();
if (!API_KEY) {
  console.error("NVIDIA_API_KEY is required.");
  process.exit(1);
}
const MODEL = process.env.NVIDIA_MODEL ?? "meta/llama-3.3-70b-instruct";
export { API_KEY, MODEL };