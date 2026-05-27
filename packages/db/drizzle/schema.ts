import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
} from "drizzle-orm/sqlite-core";

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").unique().notNull(),
  name: text("name"),
  tier: text("tier", { enum: ["free", "trial", "base", "vip", "unlimited", "plus", "pro"] })
    .default("free")
    .notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCurrentPeriodEnd: integer("stripe_current_period_end"), // unix timestamp
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

// NextAuth sessions
export const sessions = sqliteTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires").notNull(), // unix timestamp
});

export const verificationTokens = sqliteTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires").notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.identifier, t.token] }) })
);

// ─── Questions ───────────────────────────────────────────────────────────────

export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(), // e.g. "ccrn_cardio_001"
  exam: text("exam", { enum: ["nclex", "ccrn"] }).notNull(),
  type: text("type", {
    enum: ["mcq", "sata", "ordering", "matrix", "case_study", "bow_tie", "scenario_mcq", "decision_map_mcq"],
  })
    .default("mcq")
    .notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  difficulty: integer("difficulty"), // 1–5
  stem: text("stem").notNull(),
  // JSON string: for mcq = ["A) ...", "B) ...", "C) ...", "D) ..."]
  // for sata/ordering = same array format
  options: text("options").notNull(),
  // mcq: "B" | sata: '["A","C"]'
  answer: text("answer").notNull(),
  rationale: text("rationale").notNull(),
  // JSON: { "A": "why A is wrong", "C": "why C is wrong" }
  distractorRationales: text("distractor_rationales"),
  // JSON string array: ["MAP", "cardiogenic_shock"]
  tags: text("tags"),
  blueprintPct: real("blueprint_pct"),
  // For ordering questions: JSON array of correct sequence
  correctOrder: text("correct_order"),
  conceptNotes: text("concept_notes"),
  provenance: text("provenance"),
  reviewStatus: text("review_status", { enum: ["draft", "review", "approved", "flagged", "final-curated-live"] }),
  revision: integer("revision"),
  publishState: text("publish_state", { enum: ["draft", "published", "unpublished"] }).default("published"),
  scenarioTitle: text("scenario_title"),
  scenario: text("scenario"),
  additionalInfo: text("additional_info"),
  exhibits: text("exhibits"),
  chartReview: text("chart_review"),
  matrixColumns: text("matrix_columns"),
  matrixRows: text("matrix_rows"),
  visualRationale: text("visual_rationale"),
  referencesJson: text("references_json"),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

// Billing and entitlement records used by the hosted checkout flow.
export const billingEvents = sqliteTable("billing_events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripeEventId: text("stripe_event_id").unique().notNull(),
  type: text("type").notNull(),
  payload: text("payload").notNull(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const billingSubscriptions = sqliteTable("billing_subscriptions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  email: text("email"),
  tier: text("tier", { enum: ["plus", "pro"] }).notNull(),
  planCode: text("plan_code").notNull(),
  status: text("status", {
    enum: ["active", "trialing", "past_due", "unpaid", "canceled", "expired", "incomplete", "incomplete_expired"],
  }).notNull(),
  examTrack: text("exam_track", { enum: ["all", "nclex", "ccrn"] }).default("all").notNull(),
  entitlements: text("entitlements").default("").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  currentPeriodEnd: integer("current_period_end"),
  expiresAt: integer("expires_at"),
  canceledAt: integer("canceled_at"),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const userEntitlements = sqliteTable("user_entitlements", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  email: text("email"),
  tier: text("tier", { enum: ["plus", "pro"] }).notNull(),
  planCode: text("plan_code").notNull(),
  status: text("status", {
    enum: ["active", "trialing", "past_due", "unpaid", "canceled", "expired", "incomplete", "incomplete_expired"],
  }).notNull(),
  examTrack: text("exam_track", { enum: ["all", "nclex", "ccrn"] }).default("all").notNull(),
  entitlements: text("entitlements").default("").notNull(),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  expiresAt: integer("expires_at"),
  currentPeriodEnd: integer("current_period_end"),
  sourceEventId: text("source_event_id"),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

// ─── Quiz Sessions ────────────────────────────────────────────────────────────

export const quizSessions = sqliteTable("quiz_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  exam: text("exam", { enum: ["nclex", "ccrn"] }).notNull(),
  category: text("category"), // null = all categories
  totalQuestions: integer("total_questions").notNull(),
  correctCount: integer("correct_count").default(0).notNull(),
  startedAt: integer("started_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  completedAt: integer("completed_at"),
  // JSON: array of question IDs in order
  questionIds: text("question_ids").notNull(),
});

// ─── Quiz Answers ─────────────────────────────────────────────────────────────

export const quizAnswers = sqliteTable("quiz_answers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id")
    .notNull()
    .references(() => quizSessions.id, { onDelete: "cascade" }),
  questionId: text("question_id")
    .notNull()
    .references(() => questions.id),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  selectedAnswer: text("selected_answer").notNull(),
  isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
  timeSpentMs: integer("time_spent_ms"),
  answeredAt: integer("answered_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

// ─── Spaced Repetition ────────────────────────────────────────────────────────

export const reviewSchedule = sqliteTable(
  "review_schedule",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questionId: text("question_id")
      .notNull()
      .references(() => questions.id),
    easeFactor: real("ease_factor").default(2.5).notNull(),
    intervalDays: integer("interval_days").default(1).notNull(),
    repetitions: integer("repetitions").default(0).notNull(),
    nextReviewAt: integer("next_review_at"), // unix timestamp
    lastReviewedAt: integer("last_reviewed_at"),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.questionId] }) })
);

// ─── Case Studies (NCLEX NGN) ─────────────────────────────────────────────────

export const caseStudies = sqliteTable("case_studies", {
  id: text("id").primaryKey(),
  exam: text("exam", { enum: ["nclex", "ccrn"] }).default("nclex").notNull(),
  title: text("title").notNull(),
  // JSON: { chiefComplaint, history, allergies, ... }
  scenario: text("scenario").notNull(),
  // JSON: [{ time: "08:00", note: "..." }, ...]
  nursesNotes: text("nurses_notes").notNull(),
  // JSON: [{ time: "08:00", bp: "120/80", hr: 88, ... }, ...]
  vitalSigns: text("vital_signs").notNull(),
  // JSON: { sodium: 138, potassium: 3.8, ... }
  labValues: text("lab_values"),
  // JSON: [{ time: "08:00", order: "..." }, ...]
  orders: text("orders"),
  // JSON: array of 6 question objects (stem, options, answer, rationale, ncjmm_step)
  questionsJson: text("questions_json").notNull(),
  category: text("category").notNull(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

// ─── Daily Usage Limits ───────────────────────────────────────────────────────

export const dailyUsage = sqliteTable(
  "daily_usage",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Date in YYYY-MM-DD format
    date: text("date").notNull(),
    questionsAnswered: integer("questions_answered").default(0).notNull(),
    tutorCallsUsed: integer("tutor_calls_used").default(0).notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.date] }) })
);

export const legalAcceptances = sqliteTable("legal_acceptances", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  email: text("email").notNull(),
  policyType: text("policy_type", { enum: ["terms", "privacy"] }).notNull(),
  policyVersion: text("policy_version").notNull(),
  source: text("source", { enum: ["auth_login", "checkout"] }).notNull(),
  ipHash: text("ip_hash"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const authAccounts = sqliteTable("auth_accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const practiceExamUnlocks = sqliteTable(
  "practice_exam_unlocks",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    examId: text("exam_id").notNull(),
    examTrack: text("exam_track", { enum: ["nclex", "ccrn"] }).notNull(),
    sourcePlanCode: text("source_plan_code").notNull(),
    firstOpenedAt: integer("first_opened_at")
      .default(sql`(unixepoch())`)
      .notNull(),
    lastOpenedAt: integer("last_opened_at")
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.examId] }) })
);

// ─── Type exports ─────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type QuizSession = typeof quizSessions.$inferSelect;
export type NewQuizSession = typeof quizSessions.$inferInsert;
export type QuizAnswer = typeof quizAnswers.$inferSelect;
export type CaseStudy = typeof caseStudies.$inferSelect;
