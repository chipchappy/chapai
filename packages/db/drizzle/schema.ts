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
  tier: text("tier", { enum: ["free", "trial", "base", "vip", "unlimited"] })
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

// ─── Type exports ─────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type QuizSession = typeof quizSessions.$inferSelect;
export type NewQuizSession = typeof quizSessions.$inferInsert;
export type QuizAnswer = typeof quizAnswers.$inferSelect;
export type CaseStudy = typeof caseStudies.$inferSelect;
