import fs from "node:fs";
import path from "node:path";

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

function loadStore(): DailyQuestionLeadStore {
  const filePath = storePath();
  if (!fs.existsSync(filePath)) {
    return { leads: [] };
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as DailyQuestionLeadStore;
  } catch {
    return { leads: [] };
  }
}

function saveStore(store: DailyQuestionLeadStore) {
  const filePath = storePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2) + "\n", "utf8");
}

export function addDailyQuestionLead(input: {
  email: string;
  exam: "ccrn" | "nclex" | "both";
  role: "student" | "icu-nurse" | "educator" | "other";
  source: string;
}) {
  const store = loadStore();
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

  saveStore(store);
  return {
    total: store.leads.length,
    email,
  };
}

export function getDailyQuestionLeadSummary() {
  const store = loadStore();
  return {
    total: store.leads.length,
    ccrn: store.leads.filter((lead) => lead.exam === "ccrn").length,
    nclex: store.leads.filter((lead) => lead.exam === "nclex").length,
    both: store.leads.filter((lead) => lead.exam === "both").length,
    educators: store.leads.filter((lead) => lead.role === "educator").length,
  };
}
