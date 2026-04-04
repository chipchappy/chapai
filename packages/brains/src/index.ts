export type MemoryPromotionStatus = "transient" | "durable";

export interface AgentAvatar {
  key: string;
  sigil: string;
  palette: [string, string, string];
}

export interface BrainProvenance {
  runtime: string;
  sourceAgent: string;
  timestamp: string;
  confidence: number;
  promotionStatus: MemoryPromotionStatus;
}

export interface BrainMemoryEvent {
  id: string;
  summary: string;
  kind: "decision" | "skill" | "blocker" | "workflow" | "domain_fact";
  provenance: BrainProvenance;
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
