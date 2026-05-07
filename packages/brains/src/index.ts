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
