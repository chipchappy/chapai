import fs from "node:fs";
import path from "node:path";
import { getServerEnv } from "@/lib/env";

export type DailyQuestionLead = {
  email: string;
  exam: "ccrn" | "nclex" | "both";
  role: "student" | "icu-nurse" | "educator" | "other";
  source: string;
  createdAt: string;
  updatedAt: string;
  status: "active";
};

type DailyQuestionLeadStore = {
  leads: DailyQuestionLead[];
};

const KV_KEY = "daily-question-leads";

type KvLike = {
  get?: (key: string) => Promise<string | null>;
  put?: (key: string, value: string) => Promise<void>;
};

function getKv(): KvLike | null {
  try {
    const kv = getServerEnv().KV as KvLike | undefined;
    if (kv && typeof kv.get === "function" && typeof kv.put === "function") {
      return kv;
    }
  } catch {
    // env not available (e.g. build-time) — fall through to fs
  }
  return null;
}

// ── Local-dev filesystem fallback (Cloudflare workers use KV above) ──
function workspaceRoot() {
  let current = process.cwd();
  for (let i = 0; i < 6; i += 1) {
    if (fs.existsSync(path.join(current, "packages", "content"))) {
      return current;
    }
    const next = path.dirname(current);
    if (next === current) {
      break;
    }
    current = next;
  }
  return process.cwd();
}

function storePath() {
  return path.join(workspaceRoot(), "config", "daily-question-subscribers.json");
}

function loadStoreFromFs(): DailyQuestionLeadStore {
  try {
    const filePath = storePath();
    if (!fs.existsSync(filePath)) {
      return { leads: [] };
    }
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as DailyQuestionLeadStore;
  } catch {
    return { leads: [] };
  }
}

function saveStoreToFs(store: DailyQuestionLeadStore) {
  try {
    const filePath = storePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(store, null, 2) + "\n", "utf8");
  } catch {
    // read-only fs (worker) — ignore; KV is the durable path there
  }
}

async function loadStore(): Promise<DailyQuestionLeadStore> {
  const kv = getKv();
  if (kv) {
    try {
      const raw = await kv.get!(KV_KEY);
      return raw ? (JSON.parse(raw) as DailyQuestionLeadStore) : { leads: [] };
    } catch {
      return { leads: [] };
    }
  }
  return loadStoreFromFs();
}

async function saveStore(store: DailyQuestionLeadStore) {
  const kv = getKv();
  if (kv) {
    try {
      await kv.put!(KV_KEY, JSON.stringify(store));
      return;
    } catch {
      // fall through to fs in case KV write fails locally
    }
  }
  saveStoreToFs(store);
}

export async function addDailyQuestionLead(input: {
  email: string;
  exam: "ccrn" | "nclex" | "both";
  role: "student" | "icu-nurse" | "educator" | "other";
  source: string;
}) {
  const store = await loadStore();
  const email = input.email.trim().toLowerCase();
  const now = new Date().toISOString();
  const existing = store.leads.find((lead) => lead.email === email);

  if (existing) {
    existing.exam = input.exam;
    existing.role = input.role;
    existing.source = input.source;
    existing.updatedAt = now;
    existing.status = "active";
  } else {
    store.leads.push({
      email,
      exam: input.exam,
      role: input.role,
      source: input.source,
      createdAt: now,
      updatedAt: now,
      status: "active",
    });
  }

  await saveStore(store);
  return {
    total: store.leads.length,
    email,
  };
}

export async function getDailyQuestionLeadSummary() {
  const store = await loadStore();
  return {
    total: store.leads.length,
    ccrn: store.leads.filter((lead) => lead.exam === "ccrn").length,
    nclex: store.leads.filter((lead) => lead.exam === "nclex").length,
    both: store.leads.filter((lead) => lead.exam === "both").length,
    educators: store.leads.filter((lead) => lead.role === "educator").length,
  };
}
