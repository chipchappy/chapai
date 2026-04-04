import { z } from "zod";

export const questionOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
});

export const visualRationaleMetricSchema = z.object({
  label: z.string(),
  value: z.string(),
  direction: z.enum(["up", "down", "steady"]).optional(),
  directionLabel: z.string().optional(),
});

export const visualRationaleNodeSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const visualRationaleSchema = z.object({
  type: z.enum(["trend", "flow", "pathway", "signal", "overview"]),
  accent: z.string().optional(),
  title: z.string(),
  caption: z.string().optional(),
  metrics: z.array(visualRationaleMetricSchema).optional(),
  nodes: z.array(visualRationaleNodeSchema).optional(),
  conclusion: z.string().optional(),
});

export const canonicalQuestionSchema = z.object({
  id: z.string(),
  exam: z.enum(["ccrn", "nclex"]),
  type: z.enum(["mcq", "sata", "ordering", "matrix", "case_study", "bow_tie"]).default("mcq"),
  category: z.string(),
  subcategory: z.string().optional(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  stem: z.string(),
  options: z.array(questionOptionSchema).min(2),
  answer: z.string(),
  rationale: z.string(),
  distractorRationales: z.record(z.string(), z.string()).optional(),
  tags: z.array(z.string()).default([]),
  blueprintPct: z.number().optional(),
  takeaway: z.string().optional(),
  sourceStage: z.enum(["draft", "approved", "live"]).default("draft"),
  sourcePath: z.string().optional(),
  visualRationale: visualRationaleSchema.optional(),
});

export const canonicalQuestionBatchSchema = z.object({
  batchId: z.string(),
  generatedAt: z.string(),
  generatedBy: z.object({
    agentId: z.string(),
    runtime: z.string(),
    promptSource: z.string().optional(),
  }),
  examMix: z.record(z.string(), z.number()),
  validation: z.object({
    valid: z.boolean(),
    errors: z.array(z.string()).default([]),
  }),
  questions: z.array(canonicalQuestionSchema),
});

export type CanonicalQuestion = z.infer<typeof canonicalQuestionSchema>;
export type CanonicalQuestionBatch = z.infer<typeof canonicalQuestionBatchSchema>;
