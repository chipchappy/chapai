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
  tier: text("tier", { enum: ["free", "plus", "pro"] })
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

export const billingSubscriptions = sqliteTable("billing_subscriptions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  email: text("email"),
  tier: text("tier", { enum: ["plus", "pro"] }).notNull(),
  planCode: text("plan_code").notNull(),
  status: text("status").notNull(),
  examTrack: text("exam_track", { enum: ["all", "nclex", "ccrn"] }).default("all").notNull(),
  entitlements: text("entitlements").notNull(),
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

export const billingEvents = sqliteTable("billing_events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripeEventId: text("stripe_event_id").notNull().unique(),
  type: text("type").notNull(),
  processedAt: integer("processed_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  payload: text("payload").notNull(),
});

export const userEntitlements = sqliteTable("user_entitlements", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  email: text("email"),
  tier: text("tier", { enum: ["plus", "pro"] }).notNull(),
  planCode: text("plan_code").notNull(),
  status: text("status").notNull(),
  examTrack: text("exam_track", { enum: ["all", "nclex", "ccrn"] }).default("all").notNull(),
  entitlements: text("entitlements").notNull(),
  stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  expiresAt: integer("expires_at"),
  currentPeriodEnd: integer("current_period_end"),
  sourceEventId: text("source_event_id").references(() => billingEvents.id, { onDelete: "set null" }),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

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
  acceptedAt: integer("accepted_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const authAccounts = sqliteTable("auth_accounts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const accessKeys = sqliteTable("access_keys", {
  id: text("id").primaryKey(),
  code: text("code").notNull(),
  normalizedCode: text("normalized_code").notNull().unique(),
  type: text("type", { enum: ["founder-pass", "creator-pass", "tester-pass", "demo-pass", "reviewer-pass"] }).notNull(),
  scope: text("scope", { enum: ["all", "ccrn", "nclex"] }).default("all").notNull(),
  status: text("status", { enum: ["active", "revoked", "expired"] }).default("active").notNull(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  expiresAt: integer("expires_at"),
  maxRedeems: integer("max_redeems").default(1).notNull(),
  redeemCount: integer("redeem_count").default(0).notNull(),
  lastRedeemedAt: integer("last_redeemed_at"),
  notes: text("notes"),
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
    enum: ["mcq", "sata", "ordering", "matrix", "case_study", "bow_tie"],
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
  // Premium "deep dive" rationale (600-1200 chars). Free tier sees the
  // standard rationale above; paid tier additionally gets this block.
  deepRationale: text("deep_rationale"),
  // Unix seconds when the deep_rationale was authored. NULL means the
  // authoring script hasn't visited this row yet — used for resume.
  deepRationaleAuthoredAt: integer("deep_rationale_authored_at"),
  // JSON: { "A": "why A is wrong", "C": "why C is wrong" }
  distractorRationales: text("distractor_rationales"),
  // JSON string array: ["MAP", "cardiogenic_shock"]
  tags: text("tags"),
  blueprintPct: real("blueprint_pct"),
  conceptNotes: text("concept_notes"),
  provenance: text("provenance"),
  reviewStatus: text("review_status"),
  revision: integer("revision"),
  publishState: text("publish_state"),
  scenarioTitle: text("scenario_title"),
  scenario: text("scenario"),
  additionalInfo: text("additional_info"),
  exhibits: text("exhibits"),
  chartReview: text("chart_review"),
  matrixColumns: text("matrix_columns"),
  matrixRows: text("matrix_rows"),
  visualRationale: text("visual_rationale"),
  referencesJson: text("references_json"),
  // For ordering questions: JSON array of correct sequence
  correctOrder: text("correct_order"),
  createdAt: integer("created_at")
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
  // Mode label for this session. Free-form; "standard", "practice-exam", "review", etc.
  mode: text("mode"),
  // For practice-exam sessions: the catalog exam id (e.g., "nclex-sim-1") for cross-device history.
  practiceExamId: text("practice_exam_id"),
  // Cross-device cursor: which question the user is on (0-indexed).
  currentIndex: integer("current_index").default(0).notNull(),
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

export const achievementEvents = sqliteTable("achievement_events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  achievementKey: text("achievement_key").notNull(),
  occurredAt: integer("occurred_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  metadata: text("metadata"),
});

export const drugCards = sqliteTable("drug_cards", {
  id: text("id").primaryKey(),
  genericName: text("generic_name").notNull(),
  brandNames: text("brand_names"),
  drugClass: text("drug_class").notNull(),
  mechanism: text("mechanism"),
  indications: text("indications"),
  contraindications: text("contraindications"),
  blackBoxWarning: text("black_box_warning"),
  priorityLabs: text("priority_labs"),
  patientTeaching: text("patient_teaching"),
  nursingImplications: text("nursing_implications"),
  relatedTags: text("related_tags"),
  publishState: text("publish_state").default("published").notNull(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const drugCardBookmarks = sqliteTable(
  "drug_card_bookmarks",
  {
    userId: text("user_id").notNull(),
    drugCardId: text("drug_card_id").notNull(),
    easeFactor: real("ease_factor").default(2.5).notNull(),
    intervalDays: integer("interval_days").default(1).notNull(),
    repetitions: integer("repetitions").default(0).notNull(),
    nextReviewAt: integer("next_review_at"),
    lastReviewedAt: integer("last_reviewed_at"),
    createdAt: integer("created_at")
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.drugCardId] }) })
);

export const streakEmailOptouts = sqliteTable("streak_email_optouts", {
  email: text("email").primaryKey(),
  optedOutAt: integer("opted_out_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  source: text("source"),
});

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

// ─── Type exports ─────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type BillingSubscription = typeof billingSubscriptions.$inferSelect;
export type BillingEvent = typeof billingEvents.$inferSelect;
export type UserEntitlement = typeof userEntitlements.$inferSelect;
export type LegalAcceptance = typeof legalAcceptances.$inferSelect;
export type AuthAccount = typeof authAccounts.$inferSelect;
export type AccessKey = typeof accessKeys.$inferSelect;
export type PracticeExamUnlock = typeof practiceExamUnlocks.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type QuizSession = typeof quizSessions.$inferSelect;
export type NewQuizSession = typeof quizSessions.$inferInsert;
export type QuizAnswer = typeof quizAnswers.$inferSelect;
export type CaseStudy = typeof caseStudies.$inferSelect;
