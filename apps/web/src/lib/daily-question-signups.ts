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

type D1Statement<T = unknown> = {
  bind: (...values: unknown[]) => D1Statement<T>;
  first: <TRow = T>() => Promise<TRow | null>;
  run: () => Promise<unknown>;
};

type D1Like = {
  prepare: <T = unknown>(query: string) => D1Statement<T>;
};

type KvLike = {
  get?: (key: string) => Promise<string | null>;
  put?: (key: string, value: string) => Promise<void>;
};

function getDb(): D1Like | null {
  try {
    const db = getServerEnv().DB as D1Like | undefined;
    if (db && typeof db.prepare === "function") {
      return db;
    }
  } catch {
    // env not available at build time; fall through to KV/fs
  }
  return null;
}

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

async function upsertNewsletterSubscriber(db: D1Like, input: DailyQuestionLead) {
  const existing = await db
    .prepare<{ id: string }>("SELECT id FROM newsletter_subscribers WHERE lower(email) = lower(?) LIMIT 1")
    .bind(input.email)
    .first<{ id: string }>();

  if (existing?.id) {
    await db
      .prepare(
        `UPDATE newsletter_subscribers
         SET subscribe_to_daily = 1,
             unsubscribed_at = NULL,
             updated_at = unixepoch()
         WHERE id = ?`,
      )
      .bind(existing.id)
      .run();
    return;
  }

  await db
    .prepare(
      `INSERT INTO newsletter_subscribers (email, subscribe_to_daily, nurture_step, created_at, updated_at)
       VALUES (?, 1, 0, unixepoch(), unixepoch())`,
    )
    .bind(input.email)
    .run();
}

async function upsertLeadMetadata(db: D1Like, input: DailyQuestionLead) {
  const existing = await db
    .prepare<{ id: string }>("SELECT id FROM leads WHERE lower(email) = lower(?) LIMIT 1")
    .bind(input.email)
    .first<{ id: string }>();
  const metadata = JSON.stringify({
    role: input.role,
    exam: input.exam,
    source: input.source,
    channel: "daily-question-signup",
    status: input.status,
  });

  if (existing?.id) {
    await db
      .prepare(
        `UPDATE leads
         SET exam_type = ?,
             source = ?,
             status = ?,
             metadata = ?,
             updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(input.exam, input.source, input.status, metadata, existing.id)
      .run();
    return;
  }

  await db
    .prepare(
      `INSERT INTO leads (id, email, exam_type, source, status, created_at, updated_at, metadata)
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?)`,
    )
    .bind(crypto.randomUUID(), input.email, input.exam, input.source, input.status, metadata)
    .run();
}

async function addLeadToD1(input: DailyQuestionLead) {
  const db = getDb();
  if (!db) {
    return null;
  }

  try {
    await upsertNewsletterSubscriber(db, input);
    await upsertLeadMetadata(db, input);
    const row = await db
      .prepare<{ total: number }>(
        `SELECT COUNT(*) AS total
         FROM newsletter_subscribers
         WHERE unsubscribed_at IS NULL
           AND subscribe_to_daily = 1`,
      )
      .first<{ total: number }>();
    return { total: row?.total ?? 0 };
  } catch {
    return null;
  }
}

async function getD1LeadSummary() {
  const db = getDb();
  if (!db) {
    return null;
  }

  try {
    const subscriberRow = await db
      .prepare<{ total: number }>(
        `SELECT COUNT(*) AS total
         FROM newsletter_subscribers
         WHERE unsubscribed_at IS NULL
           AND subscribe_to_daily = 1`,
      )
      .first<{ total: number }>();
    const leadRows = await db
      .prepare<{
        ccrn: number;
        nclex: number;
        both: number;
        educators: number;
      }>(
        `SELECT
           SUM(CASE WHEN exam_type = 'ccrn' THEN 1 ELSE 0 END) AS ccrn,
           SUM(CASE WHEN exam_type = 'nclex' THEN 1 ELSE 0 END) AS nclex,
           SUM(CASE WHEN exam_type = 'both' THEN 1 ELSE 0 END) AS both,
           SUM(CASE WHEN metadata LIKE '%"role":"educator"%' THEN 1 ELSE 0 END) AS educators
         FROM leads
         WHERE metadata LIKE '%"channel":"daily-question-signup"%'`,
      )
      .first<{
        ccrn: number | null;
        nclex: number | null;
        both: number | null;
        educators: number | null;
      }>();

    return {
      total: subscriberRow?.total ?? 0,
      ccrn: leadRows?.ccrn ?? 0,
      nclex: leadRows?.nclex ?? 0,
      both: leadRows?.both ?? 0,
      educators: leadRows?.educators ?? 0,
    };
  } catch {
    return null;
  }
}

export async function addDailyQuestionLead(input: {
  email: string;
  exam: "ccrn" | "nclex" | "both";
  role: "student" | "icu-nurse" | "educator" | "other";
  source: string;
}) {
  const email = input.email.trim().toLowerCase();
  const now = new Date().toISOString();
  const lead: DailyQuestionLead = {
    email,
    exam: input.exam,
    role: input.role,
    source: input.source,
    createdAt: now,
    updatedAt: now,
    status: "active",
  };
  const d1Result = await addLeadToD1(lead);

  if (d1Result) {
    return {
      total: d1Result.total,
      email,
    };
  }

  const store = await loadStore();
  const existing = store.leads.find((lead) => lead.email === email);

  if (existing) {
    existing.exam = input.exam;
    existing.role = input.role;
    existing.source = input.source;
    existing.updatedAt = now;
    existing.status = "active";
  } else {
    store.leads.push(lead);
  }

  await saveStore(store);
  return {
    total: store.leads.length,
    email,
  };
}

export async function getDailyQuestionLeadSummary() {
  const d1Summary = await getD1LeadSummary();
  if (d1Summary) {
    return d1Summary;
  }

  const store = await loadStore();
  return {
    total: store.leads.length,
    ccrn: store.leads.filter((lead) => lead.exam === "ccrn").length,
    nclex: store.leads.filter((lead) => lead.exam === "nclex").length,
    both: store.leads.filter((lead) => lead.exam === "both").length,
    educators: store.leads.filter((lead) => lead.role === "educator").length,
  };
}
