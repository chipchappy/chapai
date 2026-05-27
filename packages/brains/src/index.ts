export type MemoryPromotionStatus = "transient" | "durable" | "canonical" | "staging" | "rejected";
export type BrainLifecycleStatus = "canonical" | "staging" | "rejected" | "quarantine";
export type BrainMemoryKind = "decision" | "skill" | "blocker" | "workflow" | "domain_fact" | "fact" | "episode" | "relationship";

export interface AgentAvatar {
  key: string;
  sigil: string;
  palette: [string, string, string];
}

export interface BrainProvenance {
  runtime: string;
  sourceAgent: string;
  sourceRunId?: string;
  toolUsed?: string;
  timestamp: string;
  ingestedAt?: string;
  confidence: number;
  promotionStatus: MemoryPromotionStatus;
}

export interface BrainMemoryEvent {
  id: string;
  summary: string;
  kind: BrainMemoryKind;
  provenance: BrainProvenance;
  lifecycle?: BrainLifecycleStatus;
  rejectedReason?: string;
  fingerprint?: string;
  vectorIndex?: {
    provider: "qdrant" | "none";
    collection?: string;
    pointId?: string;
    indexedAt?: string;
    status: "pending" | "indexed" | "failed" | "not-indexed";
  };
}

export interface BrainVaultManifest {
  agentId: string;
  displayName: string;
  role: string;
  runtime: string;
  vaultVersion: number;
  generatedAt: string;
  sourceRunId: string;
  qdrantCollection: string;
  canonicalSeedEntries: string[];
  pathways: {
    shortTermContext: string;
    workingScratchpad: string;
    longTermMemory: string;
    crystallizedSkills: string;
  };
}

export interface AgentBrain {
  agentId: string;
  displayName?: string;
  runtime?: string;
  avatar?: AgentAvatar;
  role: string;
  mission: string;
  goals?: string[];
  workflowContract?: string[];
  skills: string[];
  durableMemory: string[];
  activeContext: string[];
  memoryEvents: BrainMemoryEvent[];
  lastCuratedAt: string;
  vaultPath?: string;
  qdrantCollection?: string;
  memoryLifecycle?: {
    canonical: number;
    staging: number;
    rejected: number;
    quarantine: number;
  };
}

export interface BrainSummary {
  agentId: string;
  displayName: string;
  runtime: string;
  avatar?: AgentAvatar;
  role: string;
  durableCount: number;
  skillCount: number;
  lastCuratedAt: string;
}

export interface BrainVaultDocument {
  id: string;
  agentId: string;
  kind: BrainMemoryKind;
  status: BrainLifecycleStatus | "identity" | "scratch" | "episode" | "relationship" | "open_questions" | "daily";
  title: string;
  body: string;
  relativePath: string;
  provenance: BrainProvenance;
  fingerprint?: string;
}

export interface BrainVaultSnapshot {
  agentId: string;
  manifest: BrainVaultManifest;
  documents: BrainVaultDocument[];
  canonicalFacts: BrainVaultDocument[];
  canonicalSkills: BrainVaultDocument[];
  shortTermContext: string[];
  workingScratchpad: string;
  lifecycle: AgentBrain["memoryLifecycle"];
}

export function summarizeBrain(brain: AgentBrain): BrainSummary {
  return {
    agentId: brain.agentId,
    displayName: brain.displayName ?? brain.agentId,
    runtime: brain.runtime ?? "unknown",
    avatar: brain.avatar,
    role: brain.role,
    durableCount: brain.durableMemory.length,
    skillCount: brain.skills.length,
    lastCuratedAt: brain.lastCuratedAt,
  };
}

export function parseBrainVaultMarkdown(args: {
  agentId: string;
  relativePath: string;
  content: string;
}): BrainVaultDocument {
  const frontmatterMatch = args.content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const fields = frontmatterMatch ? parseVaultFrontmatter(frontmatterMatch[1]) : {};
  const body = args.content.slice(frontmatterMatch?.[0].length ?? 0).trim();
  const title = body.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? String(fields.id ?? args.relativePath);
  const status = String(fields.status ?? "staging") as BrainVaultDocument["status"];
  const kind = normalizeVaultKind(fields.kind, args.relativePath);
  return {
    id: String(fields.id ?? args.relativePath),
    agentId: String(fields.agent_id ?? args.agentId),
    kind,
    status,
    title,
    body: body.replace(/^#\s+.+\r?\n+/, "").trim(),
    relativePath: args.relativePath,
    fingerprint: fields.fingerprint ? String(fields.fingerprint) : undefined,
    provenance: {
      runtime: String(fields.runtime ?? "vault"),
      sourceAgent: String(fields.source_agent ?? args.agentId),
      sourceRunId: fields.source_run_id ? String(fields.source_run_id) : undefined,
      toolUsed: fields.tool_used ? String(fields.tool_used) : undefined,
      timestamp: String(fields.ingested_at ?? fields.promoted_at ?? new Date(0).toISOString()),
      ingestedAt: fields.ingested_at ? String(fields.ingested_at) : undefined,
      confidence: Number(fields.confidence ?? 0.7),
      promotionStatus: normalizePromotionStatus(fields.status),
    },
  };
}

export function summarizeBrainVault(args: {
  manifest: BrainVaultManifest;
  documents: BrainVaultDocument[];
}): BrainVaultSnapshot {
  const shortTerm = args.documents.find((document) => document.relativePath.endsWith("short_term_context.md"));
  const scratchpad = args.documents.find((document) => document.relativePath.endsWith("working_scratchpad.md"));
  const canonicalFacts = args.documents.filter((document) => document.status === "canonical" && document.kind === "fact");
  const canonicalSkills = args.documents.filter((document) => document.status === "canonical" && document.kind === "skill");
  return {
    agentId: args.manifest.agentId,
    manifest: args.manifest,
    documents: args.documents,
    canonicalFacts,
    canonicalSkills,
    shortTermContext: extractBullets(shortTerm?.body ?? ""),
    workingScratchpad: scratchpad?.body ?? "",
    lifecycle: {
      canonical: canonicalFacts.length + canonicalSkills.length,
      staging: args.documents.filter((document) => document.status === "staging").length,
      rejected: args.documents.filter((document) => document.status === "rejected").length,
      quarantine: args.documents.filter((document) => document.status === "quarantine").length,
    },
  };
}

function parseVaultFrontmatter(raw: string): Record<string, unknown> {
  return Object.fromEntries(raw.split(/\r?\n/).flatMap((line) => {
    const separator = line.indexOf(":");
    if (separator === -1) return [];
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    try {
      return [[key, JSON.parse(value)]];
    } catch {
      return [[key, value.replace(/^"|"$/g, "")]];
    }
  }));
}

function normalizePromotionStatus(status: unknown): MemoryPromotionStatus {
  if (status === "canonical" || status === "staging" || status === "rejected") return status;
  return status === "durable" ? "durable" : "transient";
}

function normalizeVaultKind(kind: unknown, relativePath: string): BrainMemoryKind {
  if (kind === "skill") return "skill";
  if (kind === "relationship") return "relationship";
  if (kind === "episode") return "episode";
  if (kind === "workflow") return "workflow";
  if (kind === "domain_fact") return "domain_fact";
  if (kind === "blocker") return "blocker";
  if (relativePath.includes("/skills/") || relativePath.includes("\\skills\\")) return "skill";
  if (relativePath.includes("/episodes/") || relativePath.includes("\\episodes\\")) return "episode";
  if (relativePath.includes("/relationships/") || relativePath.includes("\\relationships\\")) return "relationship";
  return "fact";
}

function extractBullets(markdown: string): string[] {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*]\s+/, "").trim())
    .filter(Boolean)
    .filter((line) => line.toLowerCase() !== "none recorded");
}
