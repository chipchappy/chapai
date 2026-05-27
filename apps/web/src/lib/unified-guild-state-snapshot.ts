import type { UnifiedAgentGuildState } from "@/lib/types";

export const UNIFIED_GUILD_STATE_SNAPSHOT = {
    "generatedAt":  "2026-05-21T13:45:49.1536445-07:00",
    "version":  1,
    "title":  "Unified ChappyAI + ChapAI Agent Guild State",
    "sourceRoots":  {
                        "chapai":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai",
                        "chappyVault":  "C:\\Users\\Chapman\\Desktop\\ChapAi",
                        "legacyCcrnAgent":  "C:\\Users\\Chapman\\Desktop\\ai\\ccrn-agent"
                    },
    "sourceHealth":  {
                         "chapaiBrains":  15,
                         "obsidianGuildNotes":  5,
                         "legacyMemoryLinked":  true,
                         "publicLedgerRecords":  567,
                         "approvalQueuePending":  3,
                         "boardroomLinked":  true,
                         "guildLoopUpdatedAt":  "2026-05-14T21:01:49.8625209-07:00"
                     },
    "stats":  {
                  "totalAgents":  15,
                  "live":  8,
                  "sleeping":  5,
                  "blocked":  5,
                  "stale":  1,
                  "totalSkills":  41,
                  "totalDurableMemories":  53,
                  "totalExperiments":  87,
                  "totalTrialErrors":  90
              },
    "memorySystem":  {
                         "mode":  "obsidian-backed-candidate-first",
                         "rawNotes":  [
                                          "ChappyAI Obsidian guild notes",
                                          "Legacy CCRN MEMORY.md and AGENTS.md",
                                          "Public-data research ledger",
                                          "Boardroom checkpoint bundles"
                                      ],
                         "candidatePromotions":  [
                                                     "Never present stale or presentation-only state as live operational telemetry.",
                                                     "External public actions require approval; research memos may be drafted without posting.",
                                                     "Antigravity should keep pod work serialized and manager-visible so the swarm stays cheap and legible.",
                                                     "Gemini should stay in audit mode and feed only short bounded pod work into Antigravity.",
                                                     "Content should keep compounding through cheap validated batches while improving rationale and diagram coverage.",
                                                     "Backend should keep billing, tutor, and persistence paths verified with the fewest moving parts possible.",
                                                     "Agent queues need visible retry, delay, backpressure, and dead-letter states for every background task.",
                                                     "Agent PR merge queues need merge_group CI triggers and concurrency limits before they can be treated as safe automation.",
                                                     "Paid study features should be controlled by feature entitlements and lifecycle webhooks, not scattered plan-name conditionals.",
                                                     "NCLEX qbank quality reports should score CJMM-step coverage, case-study set integrity, stand-alone clinical judgment items, and client-needs distribution.",
                                                     "Integrated-process metadata should remain separate from client-need categories in NCLEX question refinement.",
                                                     "Dense clinical review UIs should use split-view hierarchy so users can inspect chart sections without page scrolling or visual overload."
                                                 ],
                         "approvedDurableUpdates":  [

                                                    ],
                         "hygieneRules":  [
                                              "Do not dump raw transcripts into durable memory.",
                                              "Separate product truth from persona flavor.",
                                              "Keep one reusable insight per concept.",
                                              "Require source, confidence, and allowed-use notes for public-source claims."
                                          ]
                     },
    "sharedContext":  {
                          "legacyDurableFacts":  [
                                                     "Project focus: CCRN-related side-income tool/application.",
                                                     "Target user likely includes ICU nurses preparing for CCRN.",
                                                     "User values pragmatic execution over fluff.",
                                                     "Preference is toward monetizable, simple, useful tools.",
                                                     "Avoid unnecessary complexity.",
                                                     "Shared Telegram/NemoClaw coordination is live for status and handoff continuity.",
                                                     "The build direction now includes a premium CCRN web app experience, not just a static digital download.",
                                                     "The question system must be original, educational, and safe to ship without copyright risk.",
                                                     "The initial question bank direction now covers hemodynamics, shock, respiratory failure, cardiovascular support, neuro, renal, endocrine, and ethics/professional caring.",
                                                     "The second question batch broadens coverage into acid-base, sepsis, arrhythmia, ventilation, electrolytes, neuro, renal, and professional caring."
                                                 ],
                          "legacyAgentNotes":  [
                                                   "outlines",
                                                   "feature ideas",
                                                   "study workflows",
                                                   "practice question structures",
                                                   "landing page drafts",
                                                   "email drafts"
                                               ],
                          "legacyFindings":  [
                                                 "one manager agent owns workflow execution",
                                                 "specialist agents behave like bounded tools/workers",
                                                 "Telegram talks to the manager, not directly to multiple independent workers",
                                                 "this matches a single-user operator workflow",
                                                 "it reduces ambiguity about who can change priorities",
                                                 "it keeps the control plane safer and cheaper"
                                             ],
                          "publicResearchFindings":  [
                                                         "Cloudflare AI Search Workers bindings let Workers search or chat with AI Search instances and namespace bindings can merge results across multiple instance IDs with source references.",
                                                         "Cloudflare AI Search similarity cache can reuse prior retrieval results for semantically similar queries to reduce latency and cost when query intent repeats.",
                                                         "OpenAI\u0027s tools guide groups built-in tools and integration patterns, including web search, MCP/connectors, skills, shell, computer use, file search, tool search, and local shell capabilities.",
                                                         "GitHub Actions metrics distinguish usage metrics from performance metrics, including minutes, runtime OS, runner type, average run times, queue times, and failure rates.",
                                                         "Stripe support explains that billing-credit funding and application fees differ based on credit funding method, invoice credit application, and remaining card-paid amounts.",
                                                         "The NCLEX exam-day page emphasizes official candidate rules, check-in process, Pearson Professional Center procedures, and exam-day conduct expectations.",
                                                         "The Moodle AI Teaching and Learning Assistant describes RAG-grounded tutoring, Socratic interaction, hallucination reduction goals, and an educator human-in-the-loop workspace.",
                                                         "Baymard reports that B2B SaaS prospects need sufficient visual information about the actual product interface to understand what routine use will feel like."
                                                     ],
                          "approvalExperiments":  [
                                                      "Run a YouTube-caption scout for current agent workflow videos",
                                                      "Run a Reddit public-thread scout for 24/7 local agents and human-gated coding workflows",
                                                      "Draft a Cloudflare Agents + Workflows control-plane spike for ChappyAI guild durability"
                                                  ]
                      },
    "agents":  [
                   {
                       "id":  "orchestrator",
                       "displayName":  "Atlas",
                       "nickname":  "Atlas",
                       "role":  "Architecture",
                       "runtime":  "codex",
                       "state":  "sleeping",
                       "truthLevel":  "runtime-file",
                       "currentTask":  "Coordinate the active-duty roster, daily question email path, and mobile rollout sequencing",
                       "latest":  "Atlas is coordinating the active-duty roster, the daily question email path, and the next mobile sequencing decision.",
                       "blocker":  "none",
                       "plan":  "Run a YouTube-caption scout for current agent workflow videos",
                       "currentWorkingGoal":  "Cross-lane handoff simplification",
                       "predictions":  [
                                           "Atlas\u0027s next useful output should advance: Cross-lane handoff simplification",
                                           "Cross-lane handoff simplification",
                                           "Coordinate the active-duty roster, daily question email path, and mobile rollout sequencing",
                                           "Never present stale or presentation-only state as live operational telemetry.",
                                           "External public actions require approval; research memos may be drafted without posting."
                                       ],
                       "experimentResults":  [
                                                 "Atlas brain initialized from employee registry with truthful fallback state.",
                                                 "Atlas is coordinating the active-duty roster, the daily question email path, and the next mobile sequencing decision."
                                             ],
                       "significantCommunications":  [
                                                         "Atlas brain initialized from employee registry with truthful fallback state.",
                                                         "Human note: No immediate human fix needed."
                                                     ],
                       "significantEvents":  [
                                                 "Atlas brain initialized from employee registry with truthful fallback state.",
                                                 "Atlas is coordinating the active-duty roster, the daily question email path, and the next mobile sequencing decision.",
                                                 "Runtime state: sleeping"
                                             ],
                       "humanRequiredBlocks":  [
                                                   "No immediate human fix needed."
                                               ],
                       "theories":  [
                                        "Cross-lane handoff simplification",
                                        "Coordinate the active-duty roster, daily question email path, and mobile rollout sequencing",
                                        "Never present stale or presentation-only state as live operational telemetry.",
                                        "External public actions require approval; research memos may be drafted without posting.",
                                        "Keep codex lanes focused on the shortest product-moving tasks and persist the handoff state every cycle."
                                    ],
                       "experiments":  [
                                           "Run a YouTube-caption scout for current agent workflow videos",
                                           "Run a Reddit public-thread scout for 24/7 local agents and human-gated coding workflows",
                                           "Draft a Cloudflare Agents + Workflows control-plane spike for ChappyAI guild durability",
                                           "Coordinate the active-duty roster, daily question email path, and mobile rollout sequencing",
                                           "Cross-lane handoff simplification",
                                           "Atlas is coordinating the active-duty roster, the daily question email path, and the next mobile sequencing decision."
                                       ],
                       "trialsAndErrors":  [
                                               "none",
                                               "one manager agent owns workflow execution",
                                               "specialist agents behave like bounded tools/workers",
                                               "Telegram talks to the manager, not directly to multiple independent workers",
                                               "this matches a single-user operator workflow",
                                               "it reduces ambiguity about who can change priorities"
                                           ],
                       "stats":  {
                                     "level":  4,
                                     "xp":  155,
                                     "skills":  9,
                                     "durableMemories":  3,
                                     "memoryEvents":  1,
                                     "activeContexts":  5,
                                     "pendingExperiments":  0,
                                     "completedTasks":  0,
                                     "blockedTasks":  0,
                                     "sourceCount":  5
                                 },
                       "brain":  {
                                     "health":  "clean",
                                     "lastCuratedAt":  "2026-05-21T20:45:34.6047022Z",
                                     "nextSkillTarget":  "Cross-lane handoff simplification",
                                     "activeContext":  [
                                                           "Coordinate the active-duty roster, daily question email path, and mobile rollout sequencing",
                                                           "Cross-lane handoff simplification",
                                                           "Atlas is coordinating the active-duty roster, the daily question email path, and the next mobile sequencing decision.",
                                                           "active-duty roster",
                                                           "daily email system"
                                                       ],
                                     "durableMemory":  [
                                                           "Never present stale or presentation-only state as live operational telemetry.",
                                                           "External public actions require approval; research memos may be drafted without posting.",
                                                           "Keep codex lanes focused on the shortest product-moving tasks and persist the handoff state every cycle."
                                                       ],
                                     "skills":  [
                                                    "truthful status reporting",
                                                    "bounded task execution",
                                                    "checkpoint handoff",
                                                    "harness architecture",
                                                    "handoff design",
                                                    "restart-safe continuity",
                                                    "diagram coverage",
                                                    "rationale refinement",
                                                    "batch validation"
                                                ],
                                     "recentEvents":  [
                                                          "Atlas brain initialized from employee registry with truthful fallback state."
                                                      ]
                                 },
                       "sources":  [
                                       {
                                           "label":  "ChapAI brain",
                                           "kind":  "brain-json",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\brains\\agents\\orchestrator.json",
                                           "updatedAt":  "2026-05-21T13:45:34.6376994-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane state",
                                           "kind":  "runtime-state",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\orchestrator-state.json",
                                           "updatedAt":  "2026-05-21T13:45:29.3501458-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane queue",
                                           "kind":  "queue",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\orchestrator-queue.json",
                                           "updatedAt":  "2026-05-21T13:45:29.3225633-07:00"
                                       },
                                       {
                                           "label":  "Legacy CCRN memory",
                                           "kind":  "legacy-memory",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\ccrn-agent\\MEMORY.md",
                                           "updatedAt":  "2026-03-22T14:51:25.4944562-07:00"
                                       },
                                       {
                                           "label":  "ChappyAI Obsidian guild",
                                           "kind":  "obsidian-vault",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ChapAi\\Guild",
                                           "updatedAt":  "2026-05-04T18:47:34.4788130-07:00"
                                       }
                                   ]
                   },
                   {
                       "id":  "frontend",
                       "displayName":  "Turing",
                       "nickname":  "Turing",
                       "role":  "Product Build",
                       "runtime":  "codex",
                       "state":  "live",
                       "truthLevel":  "runtime-file",
                       "currentTask":  "Refine the premium hero, background linework, and logo presentation",
                       "latest":  "Turing is on active duty: Turing is actively pushing the premium surface, hero linework, and logo presentation toward a stronger premium standard.",
                       "blocker":  "none",
                       "plan":  "Run a YouTube-caption scout for current agent workflow videos",
                       "currentWorkingGoal":  "Single-idea premium surface polish",
                       "predictions":  [
                                           "Turing\u0027s next useful output should advance: Single-idea premium surface polish",
                                           "Single-idea premium surface polish",
                                           "Refine the premium hero, background linework, and logo presentation",
                                           "ship cleaner premium surfaces",
                                           "Never present stale or presentation-only state as live operational telemetry."
                                       ],
                       "experimentResults":  [
                                                 "Turing brain initialized from employee registry with truthful fallback state.",
                                                 "Turing is on active duty: Turing is actively pushing the premium surface, hero linework, and logo presentation toward a stronger premium standard."
                                             ],
                       "significantCommunications":  [
                                                         "Turing brain initialized from employee registry with truthful fallback state.",
                                                         "Human note: No immediate human fix needed."
                                                     ],
                       "significantEvents":  [
                                                 "Turing brain initialized from employee registry with truthful fallback state.",
                                                 "Turing is on active duty: Turing is actively pushing the premium surface, hero linework, and logo presentation toward a stronger premium standard.",
                                                 "Runtime state: live"
                                             ],
                       "humanRequiredBlocks":  [
                                                   "No immediate human fix needed."
                                               ],
                       "theories":  [
                                        "Single-idea premium surface polish",
                                        "Refine the premium hero, background linework, and logo presentation",
                                        "ship cleaner premium surfaces",
                                        "Never present stale or presentation-only state as live operational telemetry.",
                                        "External public actions require approval; research memos may be drafted without posting."
                                    ],
                       "experiments":  [
                                           "Run a YouTube-caption scout for current agent workflow videos",
                                           "Run a Reddit public-thread scout for 24/7 local agents and human-gated coding workflows",
                                           "Draft a Cloudflare Agents + Workflows control-plane spike for ChappyAI guild durability",
                                           "Refine the premium hero, background linework, and logo presentation",
                                           "Single-idea premium surface polish",
                                           "Turing is on active duty: Turing is actively pushing the premium surface, hero linework, and logo presentation toward a stronger premium standard."
                                       ],
                       "trialsAndErrors":  [
                                               "none",
                                               "one manager agent owns workflow execution",
                                               "specialist agents behave like bounded tools/workers",
                                               "Telegram talks to the manager, not directly to multiple independent workers",
                                               "this matches a single-user operator workflow",
                                               "it reduces ambiguity about who can change priorities"
                                           ],
                       "stats":  {
                                     "level":  4,
                                     "xp":  143,
                                     "skills":  8,
                                     "durableMemories":  3,
                                     "memoryEvents":  1,
                                     "activeContexts":  5,
                                     "pendingExperiments":  0,
                                     "completedTasks":  0,
                                     "blockedTasks":  0,
                                     "sourceCount":  5
                                 },
                       "brain":  {
                                     "health":  "clean",
                                     "lastCuratedAt":  "2026-05-21T20:45:34.6457036Z",
                                     "nextSkillTarget":  "Single-idea premium surface polish",
                                     "activeContext":  [
                                                           "Refine the premium hero, background linework, and logo presentation",
                                                           "Single-idea premium surface polish",
                                                           "Turing is on active duty: Turing is actively pushing the premium surface, hero linework, and logo presentation toward a stronger premium standard.",
                                                           "premium UI polish",
                                                           "hero anatomy linework"
                                                       ],
                                     "durableMemory":  [
                                                           "Never present stale or presentation-only state as live operational telemetry.",
                                                           "External public actions require approval; research memos may be drafted without posting.",
                                                           "Frontend should favor one cleaner premium direction over adding more decorative UI layers."
                                                       ],
                                     "skills":  [
                                                    "truthful status reporting",
                                                    "bounded task execution",
                                                    "checkpoint handoff",
                                                    "premium ui refinement",
                                                    "hero simplification",
                                                    "conversion surface polish",
                                                    "opportunity scouting",
                                                    "validation memo writing"
                                                ],
                                     "recentEvents":  [
                                                          "Turing brain initialized from employee registry with truthful fallback state."
                                                      ]
                                 },
                       "sources":  [
                                       {
                                           "label":  "ChapAI brain",
                                           "kind":  "brain-json",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\brains\\agents\\frontend.json",
                                           "updatedAt":  "2026-05-21T13:45:34.6778481-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane state",
                                           "kind":  "runtime-state",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\frontend-state.json",
                                           "updatedAt":  "2026-05-21T13:45:30.6921081-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane queue",
                                           "kind":  "queue",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\frontend-queue.json",
                                           "updatedAt":  "2026-05-21T13:45:30.6761079-07:00"
                                       },
                                       {
                                           "label":  "Legacy CCRN memory",
                                           "kind":  "legacy-memory",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\ccrn-agent\\MEMORY.md",
                                           "updatedAt":  "2026-03-22T14:51:25.4944562-07:00"
                                       },
                                       {
                                           "label":  "ChappyAI Obsidian guild",
                                           "kind":  "obsidian-vault",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ChapAi\\Guild",
                                           "updatedAt":  "2026-05-04T18:47:34.4788130-07:00"
                                       }
                                   ]
                   },
                   {
                       "id":  "backend",
                       "displayName":  "Kepler",
                       "nickname":  "Kepler",
                       "role":  "Backend",
                       "runtime":  "codex",
                       "state":  "live",
                       "truthLevel":  "runtime-file",
                       "currentTask":  "Design the leanest daily question email capture and delivery path",
                       "latest":  "Kepler is on active duty: Kepler is keeping tutor, checkout, and the daily question email path shippable with minimal runtime complexity.",
                       "blocker":  "none",
                       "plan":  "Run a YouTube-caption scout for current agent workflow videos",
                       "currentWorkingGoal":  "Live-route resilience with fewer moving parts",
                       "predictions":  [
                                           "Kepler\u0027s next useful output should advance: Live-route resilience with fewer moving parts",
                                           "Live-route resilience with fewer moving parts",
                                           "Design the leanest daily question email capture and delivery path",
                                           "keep routes and checkout calm",
                                           "Never present stale or presentation-only state as live operational telemetry."
                                       ],
                       "experimentResults":  [
                                                 "Kepler brain initialized from employee registry with truthful fallback state.",
                                                 "Kepler is on active duty: Kepler is keeping tutor, checkout, and the daily question email path shippable with minimal runtime complexity."
                                             ],
                       "significantCommunications":  [
                                                         "Kepler brain initialized from employee registry with truthful fallback state.",
                                                         "Human note: No immediate human fix needed."
                                                     ],
                       "significantEvents":  [
                                                 "Kepler brain initialized from employee registry with truthful fallback state.",
                                                 "Kepler is on active duty: Kepler is keeping tutor, checkout, and the daily question email path shippable with minimal runtime complexity.",
                                                 "Runtime state: live"
                                             ],
                       "humanRequiredBlocks":  [
                                                   "No immediate human fix needed."
                                               ],
                       "theories":  [
                                        "Live-route resilience with fewer moving parts",
                                        "Design the leanest daily question email capture and delivery path",
                                        "keep routes and checkout calm",
                                        "Never present stale or presentation-only state as live operational telemetry.",
                                        "External public actions require approval; research memos may be drafted without posting."
                                    ],
                       "experiments":  [
                                           "Run a YouTube-caption scout for current agent workflow videos",
                                           "Run a Reddit public-thread scout for 24/7 local agents and human-gated coding workflows",
                                           "Draft a Cloudflare Agents + Workflows control-plane spike for ChappyAI guild durability",
                                           "Design the leanest daily question email capture and delivery path",
                                           "Live-route resilience with fewer moving parts",
                                           "Kepler is on active duty: Kepler is keeping tutor, checkout, and the daily question email path shippable with minimal runtime complexity."
                                       ],
                       "trialsAndErrors":  [
                                               "none",
                                               "one manager agent owns workflow execution",
                                               "specialist agents behave like bounded tools/workers",
                                               "Telegram talks to the manager, not directly to multiple independent workers",
                                               "this matches a single-user operator workflow",
                                               "it reduces ambiguity about who can change priorities"
                                           ],
                       "stats":  {
                                     "level":  4,
                                     "xp":  155,
                                     "skills":  9,
                                     "durableMemories":  3,
                                     "memoryEvents":  1,
                                     "activeContexts":  5,
                                     "pendingExperiments":  0,
                                     "completedTasks":  0,
                                     "blockedTasks":  0,
                                     "sourceCount":  5
                                 },
                       "brain":  {
                                     "health":  "clean",
                                     "lastCuratedAt":  "2026-05-21T20:45:34.6828468Z",
                                     "nextSkillTarget":  "Live-route resilience with fewer moving parts",
                                     "activeContext":  [
                                                           "Design the leanest daily question email capture and delivery path",
                                                           "Live-route resilience with fewer moving parts",
                                                           "Kepler is on active duty: Kepler is keeping tutor, checkout, and the daily question email path shippable with minimal runtime complexity.",
                                                           "daily question email",
                                                           "tutor fallback"
                                                       ],
                                     "durableMemory":  [
                                                           "Never present stale or presentation-only state as live operational telemetry.",
                                                           "External public actions require approval; research memos may be drafted without posting.",
                                                           "Backend should keep billing, tutor, and persistence paths verified with the fewest moving parts possible."
                                                       ],
                                     "skills":  [
                                                    "truthful status reporting",
                                                    "bounded task execution",
                                                    "checkpoint handoff",
                                                    "checkout verification",
                                                    "tutor fallback resilience",
                                                    "live route health",
                                                    "diagram coverage",
                                                    "rationale refinement",
                                                    "batch validation"
                                                ],
                                     "recentEvents":  [
                                                          "Kepler brain initialized from employee registry with truthful fallback state."
                                                      ]
                                 },
                       "sources":  [
                                       {
                                           "label":  "ChapAI brain",
                                           "kind":  "brain-json",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\brains\\agents\\backend.json",
                                           "updatedAt":  "2026-05-21T13:45:34.6838488-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane state",
                                           "kind":  "runtime-state",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\backend-state.json",
                                           "updatedAt":  "2026-05-21T13:45:31.2624538-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane queue",
                                           "kind":  "queue",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\backend-queue.json",
                                           "updatedAt":  "2026-05-21T13:45:31.2104602-07:00"
                                       },
                                       {
                                           "label":  "Legacy CCRN memory",
                                           "kind":  "legacy-memory",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\ccrn-agent\\MEMORY.md",
                                           "updatedAt":  "2026-03-22T14:51:25.4944562-07:00"
                                       },
                                       {
                                           "label":  "ChappyAI Obsidian guild",
                                           "kind":  "obsidian-vault",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ChapAi\\Guild",
                                           "updatedAt":  "2026-05-04T18:47:34.4788130-07:00"
                                       }
                                   ]
                   },
                   {
                       "id":  "content",
                       "displayName":  "Hume",
                       "nickname":  "Hume",
                       "role":  "Question System",
                       "runtime":  "codex",
                       "state":  "live",
                       "truthLevel":  "runtime-file",
                       "currentTask":  "Review mixed-batch-999 for rationale drift, category balance, diagram candidates, and live-promotion picks",
                       "latest":  "Hume is on active duty: Hume reviewed mixed-batch-999 with decision eligible_for_curated_promotion and surfaced 0 live-promotion candidates while keeping the bank elite (CCRN 0, NCLEX 0).",
                       "blocker":  "none",
                       "plan":  "Run a YouTube-caption scout for current agent workflow videos",
                       "currentWorkingGoal":  "Diagram-aware rationale quality",
                       "predictions":  [
                                           "Hume\u0027s next useful output should advance: Diagram-aware rationale quality",
                                           "Diagram-aware rationale quality",
                                           "Review mixed-batch-999 for rationale drift, category balance, diagram candidates, and live-promotion picks",
                                           "compound validated question growth",
                                           "Never present stale or presentation-only state as live operational telemetry."
                                       ],
                       "experimentResults":  [
                                                 "Hume reviewed mixed-batch-1739 with qa-full-gate-v4 and surfaced 24 strict NCLEX live candidates with cited rationale and tutor-ready coaching.",
                                                 "Hume reviewed mixed-batch-1740 with qa-full-gate-v4 and surfaced 24 strict NCLEX live candidates with cited rationale and tutor-ready coaching.",
                                                 "Hume reviewed mixed-batch-1741 with qa-full-gate-v4 and surfaced 24 strict NCLEX live candidates with cited rationale and tutor-ready coaching.",
                                                 "Hume reviewed mixed-batch-999 with qa-full-gate-v4 and surfaced 12 strict NCLEX live candidates with cited rationale and tutor-ready coaching.",
                                                 "Hume promoted 12 reviewed questions from mixed-batch-999 into the live question bank.",
                                                 "Hume is on active duty: Hume reviewed mixed-batch-999 with decision eligible_for_curated_promotion and surfaced 0 live-promotion candidates while keeping the bank elite (CCRN 0, NCLEX 0)."
                                             ],
                       "significantCommunications":  [
                                                         "Hume reviewed mixed-batch-1738 with qa-full-gate-v4 and surfaced 24 strict NCLEX live candidates with cited rationale and tutor-ready coaching.",
                                                         "Hume reviewed mixed-batch-1739 with qa-full-gate-v4 and surfaced 24 strict NCLEX live candidates with cited rationale and tutor-ready coaching.",
                                                         "Hume reviewed mixed-batch-1740 with qa-full-gate-v4 and surfaced 24 strict NCLEX live candidates with cited rationale and tutor-ready coaching.",
                                                         "Hume reviewed mixed-batch-1741 with qa-full-gate-v4 and surfaced 24 strict NCLEX live candidates with cited rationale and tutor-ready coaching.",
                                                         "Hume reviewed mixed-batch-999 with qa-full-gate-v4 and surfaced 12 strict NCLEX live candidates with cited rationale and tutor-ready coaching.",
                                                         "Hume promoted 12 reviewed questions from mixed-batch-999 into the live question bank.",
                                                         "Human note: No immediate human fix needed."
                                                     ],
                       "significantEvents":  [
                                                 "Hume reviewed mixed-batch-1739 with qa-full-gate-v4 and surfaced 24 strict NCLEX live candidates with cited rationale and tutor-ready coaching.",
                                                 "Hume reviewed mixed-batch-1740 with qa-full-gate-v4 and surfaced 24 strict NCLEX live candidates with cited rationale and tutor-ready coaching.",
                                                 "Hume reviewed mixed-batch-1741 with qa-full-gate-v4 and surfaced 24 strict NCLEX live candidates with cited rationale and tutor-ready coaching.",
                                                 "Hume reviewed mixed-batch-999 with qa-full-gate-v4 and surfaced 12 strict NCLEX live candidates with cited rationale and tutor-ready coaching.",
                                                 "Hume promoted 12 reviewed questions from mixed-batch-999 into the live question bank.",
                                                 "Hume is on active duty: Hume reviewed mixed-batch-999 with decision eligible_for_curated_promotion and surfaced 0 live-promotion candidates while keeping the bank elite (CCRN 0, NCLEX 0).",
                                                 "Runtime state: live"
                                             ],
                       "humanRequiredBlocks":  [
                                                   "No immediate human fix needed."
                                               ],
                       "theories":  [
                                        "Diagram-aware rationale quality",
                                        "Review mixed-batch-999 for rationale drift, category balance, diagram candidates, and live-promotion picks",
                                        "compound validated question growth",
                                        "Never present stale or presentation-only state as live operational telemetry.",
                                        "External public actions require approval; research memos may be drafted without posting."
                                    ],
                       "experiments":  [
                                           "Run a YouTube-caption scout for current agent workflow videos",
                                           "Run a Reddit public-thread scout for 24/7 local agents and human-gated coding workflows",
                                           "Draft a Cloudflare Agents + Workflows control-plane spike for ChappyAI guild durability",
                                           "Review mixed-batch-999 for rationale drift, category balance, diagram candidates, and live-promotion picks",
                                           "Diagram-aware rationale quality",
                                           "Hume is on active duty: Hume reviewed mixed-batch-999 with decision eligible_for_curated_promotion and surfaced 0 live-promotion candidates while keeping the bank elite (CCRN 0, NCLEX 0)."
                                       ],
                       "trialsAndErrors":  [
                                               "none",
                                               "one manager agent owns workflow execution",
                                               "specialist agents behave like bounded tools/workers",
                                               "Telegram talks to the manager, not directly to multiple independent workers",
                                               "this matches a single-user operator workflow",
                                               "it reduces ambiguity about who can change priorities"
                                           ],
                       "stats":  {
                                     "level":  5,
                                     "xp":  221,
                                     "skills":  7,
                                     "durableMemories":  3,
                                     "memoryEvents":  18,
                                     "activeContexts":  5,
                                     "pendingExperiments":  0,
                                     "completedTasks":  0,
                                     "blockedTasks":  0,
                                     "sourceCount":  5
                                 },
                       "brain":  {
                                     "health":  "clean",
                                     "lastCuratedAt":  "2026-05-21T20:45:34.8148548Z",
                                     "nextSkillTarget":  "Diagram-aware rationale quality",
                                     "activeContext":  [
                                                           "Review mixed-batch-999 for rationale drift, category balance, diagram candidates, and live-promotion picks",
                                                           "Diagram-aware rationale quality",
                                                           "Hume is on active duty: Hume reviewed mixed-batch-999 with decision eligible_for_curated_promotion and surfaced 0 live-promotion candidates while keeping the bank elite (CCRN 0, NCLEX 0).",
                                                           "latest promoted review",
                                                           "rationale quality"
                                                       ],
                                     "durableMemory":  [
                                                           "Never present stale or presentation-only state as live operational telemetry.",
                                                           "External public actions require approval; research memos may be drafted without posting.",
                                                           "Content should keep compounding through cheap validated batches while improving rationale and diagram coverage."
                                                       ],
                                     "skills":  [
                                                    "truthful status reporting",
                                                    "bounded task execution",
                                                    "checkpoint handoff",
                                                    "batch validation",
                                                    "rationale refinement",
                                                    "diagram coverage",
                                                    "premium ui refinement"
                                                ],
                                     "recentEvents":  [
                                                          "Hume reviewed mixed-batch-1739 with qa-full-gate-v4 and surfaced 24 strict NCLEX live candidates with cited rationale and tutor-ready coaching.",
                                                          "Hume reviewed mixed-batch-1740 with qa-full-gate-v4 and surfaced 24 strict NCLEX live candidates with cited rationale and tutor-ready coaching.",
                                                          "Hume reviewed mixed-batch-1741 with qa-full-gate-v4 and surfaced 24 strict NCLEX live candidates with cited rationale and tutor-ready coaching.",
                                                          "Hume reviewed mixed-batch-999 with qa-full-gate-v4 and surfaced 12 strict NCLEX live candidates with cited rationale and tutor-ready coaching.",
                                                          "Hume promoted 12 reviewed questions from mixed-batch-999 into the live question bank."
                                                      ]
                                 },
                       "sources":  [
                                       {
                                           "label":  "ChapAI brain",
                                           "kind":  "brain-json",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\brains\\agents\\content.json",
                                           "updatedAt":  "2026-05-21T13:45:34.8158537-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane state",
                                           "kind":  "runtime-state",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\content-state.json",
                                           "updatedAt":  "2026-05-21T13:45:32.0346660-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane queue",
                                           "kind":  "queue",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\content-queue.json",
                                           "updatedAt":  "2026-05-21T13:45:32.0336687-07:00"
                                       },
                                       {
                                           "label":  "Legacy CCRN memory",
                                           "kind":  "legacy-memory",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\ccrn-agent\\MEMORY.md",
                                           "updatedAt":  "2026-03-22T14:51:25.4944562-07:00"
                                       },
                                       {
                                           "label":  "ChappyAI Obsidian guild",
                                           "kind":  "obsidian-vault",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ChapAi\\Guild",
                                           "updatedAt":  "2026-05-04T18:47:34.4788130-07:00"
                                       }
                                   ]
                   },
                   {
                       "id":  "manager",
                       "displayName":  "Kuhn",
                       "nickname":  "Kuhn",
                       "role":  "Manager",
                       "runtime":  "codex",
                       "state":  "live",
                       "truthLevel":  "runtime-file",
                       "currentTask":  "nova: Maintain the Expo-first mobile product path",
                       "latest":  "Manager sweep active across nova: Maintain the Expo-first mobile product path | scout: Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity | antigravity: Turn Gemini NGN gap audits into seedable NCLEX family briefs | content: mixed-batch-999.json",
                       "blocker":  "gemini: Gemini has a blocked audit item.",
                       "plan":  "Run a YouTube-caption scout for current agent workflow videos",
                       "currentWorkingGoal":  "Shorter exact unblock lines",
                       "predictions":  [
                                           "Kuhn is most likely to move again after this blocker is cleared: gemini: Gemini has a blocked audit item.",
                                           "Kuhn\u0027s next useful output should advance: Shorter exact unblock lines",
                                           "Shorter exact unblock lines",
                                           "nova: Maintain the Expo-first mobile product path",
                                           "clear blocker: gemini: Gemini has a blocked audit item."
                                       ],
                       "experimentResults":  [
                                                 "Manager sweep active across nova: Maintain the Expo-first mobile product path | scout: Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity | gemini: Audit 2-live and 3-live NCLEX families that still lack SATA, case-study, or bow-tie variants | antigravity: Turn Gemini NGN gap audits into seedable NCLEX family briefs | content: mixed-batch-999.json",
                                                 "Manager sweep active across mercury: Refresh the social opportunity radar and next-thread targets | beacon: Refresh the email growth radar and daily-question send readiness | nova: Maintain the Expo-first mobile product path | scout: Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity | antigravity: Turn Gemini NGN gap audits into seedable NCLEX family briefs | content: mixed-batch-999.json",
                                                 "Manager sweep active across nova: Maintain the Expo-first mobile product path | scout: Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity | antigravity: Turn Gemini NGN gap audits into seedable NCLEX family briefs | content: mixed-batch-999.json",
                                                 "Manager sweep active across mercury: Refresh the social opportunity radar and next-thread targets | nova: Maintain the Expo-first mobile product path | scout: Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity | antigravity: Turn Gemini NGN gap audits into seedable NCLEX family briefs | content: mixed-batch-999.json",
                                                 "Manager sweep active across beacon: Refresh the email growth radar and daily-question send readiness | nova: Maintain the Expo-first mobile product path | scout: Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity | antigravity: Turn Gemini NGN gap audits into seedable NCLEX family briefs | content: mixed-batch-999.json"
                                             ],
                       "significantCommunications":  [
                                                         "Guild sync closed with: scout: Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity | gemini-audit: Audit 2-live and 3-live NCLEX families that still lack SATA, case-study, or bow-tie variants | antigravity: Turn Gemini NGN gap audits into seedable NCLEX family briefs",
                                                         "Manager sweep active across nova: Maintain the Expo-first mobile product path | scout: Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity | gemini: Audit 2-live and 3-live NCLEX families that still lack SATA, case-study, or bow-tie variants | antigravity: Turn Gemini NGN gap audits into seedable NCLEX family briefs | content: mixed-batch-999.json",
                                                         "Manager sweep active across mercury: Refresh the social opportunity radar and next-thread targets | beacon: Refresh the email growth radar and daily-question send readiness | nova: Maintain the Expo-first mobile product path | scout: Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity | antigravity: Turn Gemini NGN gap audits into seedable NCLEX family briefs | content: mixed-batch-999.json",
                                                         "Manager sweep active across nova: Maintain the Expo-first mobile product path | scout: Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity | antigravity: Turn Gemini NGN gap audits into seedable NCLEX family briefs | content: mixed-batch-999.json",
                                                         "Manager sweep active across mercury: Refresh the social opportunity radar and next-thread targets | nova: Maintain the Expo-first mobile product path | scout: Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity | antigravity: Turn Gemini NGN gap audits into seedable NCLEX family briefs | content: mixed-batch-999.json",
                                                         "Manager sweep active across beacon: Refresh the email growth radar and daily-question send readiness | nova: Maintain the Expo-first mobile product path | scout: Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity | antigravity: Turn Gemini NGN gap audits into seedable NCLEX family briefs | content: mixed-batch-999.json",
                                                         "Human note: gemini: Gemini has a blocked audit item."
                                                     ],
                       "significantEvents":  [
                                                 "Manager sweep active across nova: Maintain the Expo-first mobile product path | scout: Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity | gemini: Audit 2-live and 3-live NCLEX families that still lack SATA, case-study, or bow-tie variants | antigravity: Turn Gemini NGN gap audits into seedable NCLEX family briefs | content: mixed-batch-999.json",
                                                 "Manager sweep active across mercury: Refresh the social opportunity radar and next-thread targets | beacon: Refresh the email growth radar and daily-question send readiness | nova: Maintain the Expo-first mobile product path | scout: Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity | antigravity: Turn Gemini NGN gap audits into seedable NCLEX family briefs | content: mixed-batch-999.json",
                                                 "Manager sweep active across nova: Maintain the Expo-first mobile product path | scout: Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity | antigravity: Turn Gemini NGN gap audits into seedable NCLEX family briefs | content: mixed-batch-999.json",
                                                 "Manager sweep active across mercury: Refresh the social opportunity radar and next-thread targets | nova: Maintain the Expo-first mobile product path | scout: Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity | antigravity: Turn Gemini NGN gap audits into seedable NCLEX family briefs | content: mixed-batch-999.json",
                                                 "Manager sweep active across beacon: Refresh the email growth radar and daily-question send readiness | nova: Maintain the Expo-first mobile product path | scout: Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity | antigravity: Turn Gemini NGN gap audits into seedable NCLEX family briefs | content: mixed-batch-999.json",
                                                 "Runtime state: live"
                                             ],
                       "humanRequiredBlocks":  [
                                                   "Human required: gemini: Gemini has a blocked audit item.",
                                                   "gemini: Gemini has a blocked audit item."
                                               ],
                       "theories":  [
                                        "Shorter exact unblock lines",
                                        "nova: Maintain the Expo-first mobile product path",
                                        "clear blocker: gemini: Gemini has a blocked audit item.",
                                        "Never present stale or presentation-only state as live operational telemetry.",
                                        "External public actions require approval; research memos may be drafted without posting."
                                    ],
                       "experiments":  [
                                           "Run a YouTube-caption scout for current agent workflow videos",
                                           "Run a Reddit public-thread scout for 24/7 local agents and human-gated coding workflows",
                                           "Draft a Cloudflare Agents + Workflows control-plane spike for ChappyAI guild durability",
                                           "nova: Maintain the Expo-first mobile product path",
                                           "Shorter exact unblock lines",
                                           "gemini: Gemini has a blocked audit item."
                                       ],
                       "trialsAndErrors":  [
                                               "gemini: Gemini has a blocked audit item.",
                                               "one manager agent owns workflow execution",
                                               "specialist agents behave like bounded tools/workers",
                                               "Telegram talks to the manager, not directly to multiple independent workers",
                                               "this matches a single-user operator workflow",
                                               "it reduces ambiguity about who can change priorities"
                                           ],
                       "stats":  {
                                     "level":  7,
                                     "xp":  299,
                                     "skills":  15,
                                     "durableMemories":  6,
                                     "memoryEvents":  9,
                                     "activeContexts":  5,
                                     "pendingExperiments":  0,
                                     "completedTasks":  0,
                                     "blockedTasks":  0,
                                     "sourceCount":  5
                                 },
                       "brain":  {
                                     "health":  "clean",
                                     "lastCuratedAt":  "2026-05-21T20:45:34.8208558Z",
                                     "nextSkillTarget":  "Shorter exact unblock lines",
                                     "activeContext":  [
                                                           "nova: Maintain the Expo-first mobile product path",
                                                           "Shorter exact unblock lines",
                                                           "gemini: Gemini has a blocked audit item.",
                                                           "Manager sweep active across nova: Maintain the Expo-first mobile product path | scout: Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity | antigravity: Turn Gemini NGN gap audits into seedable NCLEX family briefs | content: mixed-batch-999.json",
                                                           "scout: Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity"
                                                       ],
                                     "durableMemory":  [
                                                           "Never present stale or presentation-only state as live operational telemetry.",
                                                           "External public actions require approval; research memos may be drafted without posting.",
                                                           "Manager should keep one clear focus per lane visible at all times.",
                                                           "Manual outreach and external auth are the main human bottlenecks in the current swarm.",
                                                           "Gemini should brief Antigravity with bounded pods instead of leaving audits as loose notes.",
                                                           "Core codex lanes should always have a small persistent queue and an explicit maintenance watch."
                                                       ],
                                     "skills":  [
                                                    "truthful status reporting",
                                                    "bounded task execution",
                                                    "checkpoint handoff",
                                                    "lane triage",
                                                    "blocker compression",
                                                    "status compression",
                                                    "diagram coverage",
                                                    "rationale refinement",
                                                    "batch validation",
                                                    "creator outreach copy"
                                                ],
                                     "recentEvents":  [
                                                          "Manager sweep active across nova: Maintain the Expo-first mobile product path | scout: Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity | gemini: Audit 2-live and 3-live NCLEX families that still lack SATA, case-study, or bow-tie variants | antigravity: Turn Gemini NGN gap audits into seedable NCLEX family briefs | content: mixed-batch-999.json",
                                                          "Manager sweep active across mercury: Refresh the social opportunity radar and next-thread targets | beacon: Refresh the email growth radar and daily-question send readiness | nova: Maintain the Expo-first mobile product path | scout: Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity | antigravity: Turn Gemini NGN gap audits into seedable NCLEX family briefs | content: mixed-batch-999.json",
                                                          "Manager sweep active across nova: Maintain the Expo-first mobile product path | scout: Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity | antigravity: Turn Gemini NGN gap audits into seedable NCLEX family briefs | content: mixed-batch-999.json",
                                                          "Manager sweep active across mercury: Refresh the social opportunity radar and next-thread targets | nova: Maintain the Expo-first mobile product path | scout: Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity | antigravity: Turn Gemini NGN gap audits into seedable NCLEX family briefs | content: mixed-batch-999.json",
                                                          "Manager sweep active across beacon: Refresh the email growth radar and daily-question send readiness | nova: Maintain the Expo-first mobile product path | scout: Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity | antigravity: Turn Gemini NGN gap audits into seedable NCLEX family briefs | content: mixed-batch-999.json"
                                                      ]
                                 },
                       "sources":  [
                                       {
                                           "label":  "ChapAI brain",
                                           "kind":  "brain-json",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\brains\\agents\\manager.json",
                                           "updatedAt":  "2026-05-21T13:45:34.8363836-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane state",
                                           "kind":  "runtime-state",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\manager-state.json",
                                           "updatedAt":  "2026-05-21T13:45:33.1787767-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane queue",
                                           "kind":  "queue",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\manager-queue.json",
                                           "updatedAt":  "2026-05-06T13:52:08.2877996-07:00"
                                       },
                                       {
                                           "label":  "Legacy CCRN memory",
                                           "kind":  "legacy-memory",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\ccrn-agent\\MEMORY.md",
                                           "updatedAt":  "2026-03-22T14:51:25.4944562-07:00"
                                       },
                                       {
                                           "label":  "ChappyAI Obsidian guild",
                                           "kind":  "obsidian-vault",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ChapAi\\Guild",
                                           "updatedAt":  "2026-05-04T18:47:34.4788130-07:00"
                                       }
                                   ]
                   },
                   {
                       "id":  "nemoclaw",
                       "displayName":  "Nemoclaw",
                       "nickname":  "Nemoclaw",
                       "role":  "Local Batch Worker",
                       "runtime":  "nemotron",
                       "state":  "sleeping",
                       "truthLevel":  "runtime-file",
                       "currentTask":  "Higher-yield cheap batch variations",
                       "latest":  "Observed mixed-batch-999 as the newest promoted batch in the low-token content lane.",
                       "blocker":  "No runtime heartbeat yet; initialized as an empty state template.",
                       "plan":  "Run a YouTube-caption scout for current agent workflow videos",
                       "currentWorkingGoal":  "Higher-yield cheap batch variations",
                       "predictions":  [
                                           "Nemoclaw is most likely to move again after this blocker is cleared: No runtime heartbeat yet; initialized as an empty state template.",
                                           "Nemoclaw\u0027s next useful output should advance: Higher-yield cheap batch variations",
                                           "Higher-yield cheap batch variations",
                                           "clear blocker: No runtime heartbeat yet; initialized as an empty state template.",
                                           "Never present stale or presentation-only state as live operational telemetry."
                                       ],
                       "experimentResults":  [
                                                 "Nemoclaw brain initialized from employee registry with truthful fallback state.",
                                                 "Promoted mixed-batch-1703 into the draft banks and advanced the low-token content lane.",
                                                 "Observed mixed-batch-999 as the newest promoted batch in the low-token content lane."
                                             ],
                       "significantCommunications":  [
                                                         "Nemoclaw brain initialized from employee registry with truthful fallback state.",
                                                         "Promoted mixed-batch-1703 into the draft banks and advanced the low-token content lane.",
                                                         "Observed mixed-batch-999 as the newest promoted batch in the low-token content lane."
                                                     ],
                       "significantEvents":  [
                                                 "Nemoclaw brain initialized from employee registry with truthful fallback state.",
                                                 "Promoted mixed-batch-1703 into the draft banks and advanced the low-token content lane.",
                                                 "Observed mixed-batch-999 as the newest promoted batch in the low-token content lane.",
                                                 "Runtime state: sleeping"
                                             ],
                       "humanRequiredBlocks":  [
                                                   "Human required: No runtime heartbeat yet; initialized as an empty state template."
                                               ],
                       "theories":  [
                                        "Higher-yield cheap batch variations",
                                        "clear blocker: No runtime heartbeat yet; initialized as an empty state template.",
                                        "Never present stale or presentation-only state as live operational telemetry.",
                                        "External public actions require approval; research memos may be drafted without posting.",
                                        "Net-new draft totals should be tracked separately from incoming rows."
                                    ],
                       "experiments":  [
                                           "Run a YouTube-caption scout for current agent workflow videos",
                                           "Run a Reddit public-thread scout for 24/7 local agents and human-gated coding workflows",
                                           "Draft a Cloudflare Agents + Workflows control-plane spike for ChappyAI guild durability",
                                           "Higher-yield cheap batch variations",
                                           "No runtime heartbeat yet; initialized as an empty state template.",
                                           "incremental promotion"
                                       ],
                       "trialsAndErrors":  [
                                               "No runtime heartbeat yet; initialized as an empty state template.",
                                               "one manager agent owns workflow execution",
                                               "specialist agents behave like bounded tools/workers",
                                               "Telegram talks to the manager, not directly to multiple independent workers",
                                               "this matches a single-user operator workflow",
                                               "it reduces ambiguity about who can change priorities"
                                           ],
                       "stats":  {
                                     "level":  4,
                                     "xp":  170,
                                     "skills":  9,
                                     "durableMemories":  3,
                                     "memoryEvents":  3,
                                     "activeContexts":  5,
                                     "pendingExperiments":  0,
                                     "completedTasks":  0,
                                     "blockedTasks":  0,
                                     "sourceCount":  5
                                 },
                       "brain":  {
                                     "health":  "clean",
                                     "lastCuratedAt":  "2026-05-21T20:45:34.9748702Z",
                                     "nextSkillTarget":  "Higher-yield cheap batch variations",
                                     "activeContext":  [
                                                           "Higher-yield cheap batch variations",
                                                           "No runtime heartbeat yet; initialized as an empty state template.",
                                                           "incremental promotion",
                                                           "net-new draft growth",
                                                           "validated mixed batches"
                                                       ],
                                     "durableMemory":  [
                                                           "Never present stale or presentation-only state as live operational telemetry.",
                                                           "External public actions require approval; research memos may be drafted without posting.",
                                                           "Net-new draft totals should be tracked separately from incoming rows."
                                                       ],
                                     "skills":  [
                                                    "truthful status reporting",
                                                    "bounded task execution",
                                                    "checkpoint handoff",
                                                    "incremental batch promotion",
                                                    "mixed batch generation",
                                                    "low-token content expansion",
                                                    "diagram coverage",
                                                    "rationale refinement",
                                                    "batch validation"
                                                ],
                                     "recentEvents":  [
                                                          "Nemoclaw brain initialized from employee registry with truthful fallback state.",
                                                          "Promoted mixed-batch-1703 into the draft banks and advanced the low-token content lane.",
                                                          "Observed mixed-batch-999 as the newest promoted batch in the low-token content lane."
                                                      ]
                                 },
                       "sources":  [
                                       {
                                           "label":  "ChapAI brain",
                                           "kind":  "brain-json",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\brains\\agents\\nemoclaw.json",
                                           "updatedAt":  "2026-05-21T13:45:34.9828716-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane state",
                                           "kind":  "runtime-state",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\nemoclaw-state.json",
                                           "updatedAt":  "2026-05-06T13:52:08.2913081-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane queue",
                                           "kind":  "queue",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\nemoclaw-queue.json",
                                           "updatedAt":  "2026-05-06T13:52:08.2923416-07:00"
                                       },
                                       {
                                           "label":  "Legacy CCRN memory",
                                           "kind":  "legacy-memory",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\ccrn-agent\\MEMORY.md",
                                           "updatedAt":  "2026-03-22T14:51:25.4944562-07:00"
                                       },
                                       {
                                           "label":  "ChappyAI Obsidian guild",
                                           "kind":  "obsidian-vault",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ChapAi\\Guild",
                                           "updatedAt":  "2026-05-04T18:47:34.4788130-07:00"
                                       }
                                   ]
                   },
                   {
                       "id":  "claude-code",
                       "displayName":  "Claude Code",
                       "nickname":  "Claude Code",
                       "role":  "Design Review",
                       "runtime":  "claude",
                       "state":  "sleeping",
                       "truthLevel":  "runtime-file",
                       "currentTask":  "Awaiting bounded work.",
                       "latest":  "ClinicalReviewStation exists but renders as a scrollable side panel with flat tab labels and low visual hierarchy. The right-side cockpit needs to shift to a fixed-height, zero-internal-scroll layout using CSS grid rows + overflow-hidden sections, with tab pills that show content inline via accordion/expander rather than full panel swaps. Color tokens already exist in globals.css and are correct; they just aren\u0027t applied with enough contrast or layering in the station component. The FrontpageNgDemo mirrors the same issue at demo scale.",
                       "blocker":  "none",
                       "plan":  "UI-QA pass: screenshot ClinicalReviewStation at 1280px and 390px after R1â€“R4 changes, confirm no outer scroll, verify locked rationale state pre-submit, verify green/red only post-submit, then ship FrontpageNgDemo with same model.",
                       "currentWorkingGoal":  "Awaiting bounded work.",
                       "predictions":  [
                                           "Claude Code\u0027s next useful output should advance: Awaiting bounded work.",
                                           "Project focus: CCRN-related side-income tool/application.",
                                           "Target user likely includes ICU nurses preparing for CCRN.",
                                           "User values pragmatic execution over fluff.",
                                           "Preference is toward monetizable, simple, useful tools."
                                       ],
                       "experimentResults":  [
                                                 "Completed: Read-only Claude-lane redesign brief for chart review and ops dashboard",
                                                 "Completed: UI-only no-scroll premium chart review cockpit refinement",
                                                 "Completed: UI-only redesign review for the unified agent command center",
                                                 "Completed: One-shot UI-only redesign for NCLEX chart review and study shell",
                                                 "ClinicalReviewStation exists but renders as a scrollable side panel with flat tab labels and low visual hierarchy. The right-side cockpit needs to shift to a fixed-height, zero-internal-scroll layout using CSS grid rows + overflow-hidden sections, with tab pills that show content inline via accordion/expander rather than full panel swaps. Color tokens already exist in globals.css and are correct; they just aren\u0027t applied with enough contrast or layering in the station component. The FrontpageNgDemo mirrors the same issue at demo scale."
                                             ],
                       "significantCommunications":  [
                                                         "Human note: 1. In globals.css add the grid-row layout and pill tab styles from R1+R2 under .clinical-review-station. 2. In ClinicalReviewStation.tsx replace patient-banner markup per R3 and wrap panel items in \u003cdetails\u003e per R4. 3. Smoke-test in browser at 1280px and 390px widths. Total estimated time: 60â€“75 min."
                                                     ],
                       "significantEvents":  [
                                                 "ClinicalReviewStation exists but renders as a scrollable side panel with flat tab labels and low visual hierarchy. The right-side cockpit needs to shift to a fixed-height, zero-internal-scroll layout using CSS grid rows + overflow-hidden sections, with tab pills that show content inline via accordion/expander rather than full panel swaps. Color tokens already exist in globals.css and are correct; they just aren\u0027t applied with enough contrast or layering in the station component. The FrontpageNgDemo mirrors the same issue at demo scale.",
                                                 "Runtime state: sleeping"
                                             ],
                       "humanRequiredBlocks":  [
                                                   "1. In globals.css add the grid-row layout and pill tab styles from R1+R2 under .clinical-review-station. 2. In ClinicalReviewStation.tsx replace patient-banner markup per R3 and wrap panel items in \u003cdetails\u003e per R4. 3. Smoke-test in browser at 1280px and 390px widths. Total estimated time: 60â€“75 min."
                                               ],
                       "theories":  [
                                        "Project focus: CCRN-related side-income tool/application.",
                                        "Target user likely includes ICU nurses preparing for CCRN.",
                                        "User values pragmatic execution over fluff.",
                                        "Preference is toward monetizable, simple, useful tools.",
                                        "Avoid unnecessary complexity."
                                    ],
                       "experiments":  [
                                           "Run a YouTube-caption scout for current agent workflow videos",
                                           "Run a Reddit public-thread scout for 24/7 local agents and human-gated coding workflows",
                                           "Draft a Cloudflare Agents + Workflows control-plane spike for ChappyAI guild durability"
                                       ],
                       "trialsAndErrors":  [
                                               "none",
                                               "one manager agent owns workflow execution",
                                               "specialist agents behave like bounded tools/workers",
                                               "Telegram talks to the manager, not directly to multiple independent workers",
                                               "this matches a single-user operator workflow",
                                               "it reduces ambiguity about who can change priorities"
                                           ],
                       "stats":  {
                                     "level":  2,
                                     "xp":  48,
                                     "skills":  0,
                                     "durableMemories":  0,
                                     "memoryEvents":  0,
                                     "activeContexts":  0,
                                     "pendingExperiments":  0,
                                     "completedTasks":  4,
                                     "blockedTasks":  0,
                                     "sourceCount":  5
                                 },
                       "brain":  {
                                     "health":  "clean",
                                     "lastCuratedAt":  null,
                                     "nextSkillTarget":  null,
                                     "activeContext":  [

                                                       ],
                                     "durableMemory":  [

                                                       ],
                                     "skills":  [

                                                ],
                                     "recentEvents":  [

                                                      ]
                                 },
                       "sources":  [
                                       {
                                           "label":  "ChapAI brain",
                                           "kind":  "brain-json",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\brains\\agents\\claude-code.json",
                                           "updatedAt":  "2026-05-21T13:45:35.0298679-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane state",
                                           "kind":  "runtime-state",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\claude-employee-state.json",
                                           "updatedAt":  "2026-05-21T13:43:02.0919443-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane queue",
                                           "kind":  "queue",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\claude-employee-queue.json",
                                           "updatedAt":  "2026-05-07T12:52:17.8311757-07:00"
                                       },
                                       {
                                           "label":  "Legacy CCRN memory",
                                           "kind":  "legacy-memory",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\ccrn-agent\\MEMORY.md",
                                           "updatedAt":  "2026-03-22T14:51:25.4944562-07:00"
                                       },
                                       {
                                           "label":  "ChappyAI Obsidian guild",
                                           "kind":  "obsidian-vault",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ChapAi\\Guild",
                                           "updatedAt":  "2026-05-04T18:47:34.4788130-07:00"
                                       }
                                   ]
                   },
                   {
                       "id":  "social-studio",
                       "displayName":  "Mercury",
                       "nickname":  "Mercury",
                       "role":  "Growth Studio",
                       "runtime":  "codex",
                       "state":  "sleeping",
                       "truthLevel":  "runtime-file",
                       "currentTask":  "First creator pilot conversion",
                       "latest":  "Refresh the social opportunity radar and next-thread targets is now packaged in reusable launch assets.",
                       "blocker":  "none",
                       "plan":  "Run a YouTube-caption scout for current agent workflow videos",
                       "currentWorkingGoal":  "First creator pilot conversion",
                       "predictions":  [
                                           "Mercury\u0027s next useful output should advance: First creator pilot conversion",
                                           "First creator pilot conversion",
                                           "push traffic into the package path",
                                           "Never present stale or presentation-only state as live operational telemetry.",
                                           "External public actions require approval; research memos may be drafted without posting."
                                       ],
                       "experimentResults":  [
                                                 "Completed: Refresh the social opportunity radar and next-thread targets",
                                                 "Refresh the social opportunity radar and next-thread targets is now packaged in reusable launch assets."
                                             ],
                       "significantCommunications":  [
                                                         "Refresh the social opportunity radar and next-thread targets is now packaged in reusable launch assets."
                                                     ],
                       "significantEvents":  [
                                                 "Refresh the social opportunity radar and next-thread targets is now packaged in reusable launch assets.",
                                                 "Runtime state: sleeping"
                                             ],
                       "humanRequiredBlocks":  [

                                               ],
                       "theories":  [
                                        "First creator pilot conversion",
                                        "push traffic into the package path",
                                        "Never present stale or presentation-only state as live operational telemetry.",
                                        "External public actions require approval; research memos may be drafted without posting.",
                                        "One reusable DM pack, one reusable email pack, and one reusable posting pack should always stay ready."
                                    ],
                       "experiments":  [
                                           "Run a YouTube-caption scout for current agent workflow videos",
                                           "Run a Reddit public-thread scout for 24/7 local agents and human-gated coding workflows",
                                           "Draft a Cloudflare Agents + Workflows control-plane spike for ChappyAI guild durability",
                                           "First creator pilot conversion",
                                           "creator outreach",
                                           "outbound email growth"
                                       ],
                       "trialsAndErrors":  [
                                               "none",
                                               "one manager agent owns workflow execution",
                                               "specialist agents behave like bounded tools/workers",
                                               "Telegram talks to the manager, not directly to multiple independent workers",
                                               "this matches a single-user operator workflow",
                                               "it reduces ambiguity about who can change priorities"
                                           ],
                       "stats":  {
                                     "level":  12,
                                     "xp":  506,
                                     "skills":  6,
                                     "durableMemories":  8,
                                     "memoryEvents":  18,
                                     "activeContexts":  5,
                                     "pendingExperiments":  0,
                                     "completedTasks":  36,
                                     "blockedTasks":  0,
                                     "sourceCount":  5
                                 },
                       "brain":  {
                                     "health":  "clean",
                                     "lastCuratedAt":  "2026-05-21T20:45:35.1565920Z",
                                     "nextSkillTarget":  "First creator pilot conversion",
                                     "activeContext":  [
                                                           "First creator pilot conversion",
                                                           "creator outreach",
                                                           "outbound email growth",
                                                           "package-first conversion",
                                                           "first MRR"
                                                       ],
                                     "durableMemory":  [
                                                           "Never present stale or presentation-only state as live operational telemetry.",
                                                           "External public actions require approval; research memos may be drafted without posting.",
                                                           "One reusable DM pack, one reusable email pack, and one reusable posting pack should always stay ready.",
                                                           "Manual distribution is the main human unlock after creative assets are prepared.",
                                                           "The first creator pilot should start with nano and micro nursing creators, not polished macro creators.",
                                                           "A simple founder pass plus one deliverable plus a small flat budget or commission is the cleanest first creator offer."
                                                       ],
                                     "skills":  [
                                                    "truthful status reporting",
                                                    "bounded task execution",
                                                    "checkpoint handoff",
                                                    "creator outreach copy",
                                                    "conversion messaging",
                                                    "search-intent growth"
                                                ],
                                     "recentEvents":  [
                                                          "Refresh the social opportunity radar and next-thread targets is now packaged in reusable launch assets."
                                                      ]
                                 },
                       "sources":  [
                                       {
                                           "label":  "ChapAI brain",
                                           "kind":  "brain-json",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\brains\\agents\\social-studio.json",
                                           "updatedAt":  "2026-05-21T13:45:35.1575893-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane state",
                                           "kind":  "runtime-state",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\social-studio-state.json",
                                           "updatedAt":  "2026-05-21T13:35:41.1805790-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane queue",
                                           "kind":  "queue",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\social-studio-queue.json",
                                           "updatedAt":  "2026-05-21T13:35:41.1230423-07:00"
                                       },
                                       {
                                           "label":  "Legacy CCRN memory",
                                           "kind":  "legacy-memory",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\ccrn-agent\\MEMORY.md",
                                           "updatedAt":  "2026-03-22T14:51:25.4944562-07:00"
                                       },
                                       {
                                           "label":  "ChappyAI Obsidian guild",
                                           "kind":  "obsidian-vault",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ChapAi\\Guild",
                                           "updatedAt":  "2026-05-04T18:47:34.4788130-07:00"
                                       }
                                   ]
                   },
                   {
                       "id":  "scout",
                       "displayName":  "Aster",
                       "nickname":  "Aster",
                       "role":  "Venture Scout",
                       "runtime":  "codex",
                       "state":  "live",
                       "truthLevel":  "runtime-file",
                       "currentTask":  "Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity",
                       "latest":  "Scout lane is actively evaluating the fastest mobile app path and the next nurse-adjacent SaaS direction.",
                       "blocker":  "none",
                       "plan":  "Run a YouTube-caption scout for current agent workflow videos",
                       "currentWorkingGoal":  "One validated adjacent healthcare SaaS memo",
                       "predictions":  [
                                           "Aster\u0027s next useful output should advance: One validated adjacent healthcare SaaS memo",
                                           "One validated adjacent healthcare SaaS memo",
                                           "Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity",
                                           "hold one next-product thesis",
                                           "Never present stale or presentation-only state as live operational telemetry."
                                       ],
                       "experimentResults":  [
                                                 "Aster brain initialized from employee registry with truthful fallback state.",
                                                 "Scout lane is actively evaluating the fastest mobile app path and the next nurse-adjacent SaaS direction."
                                             ],
                       "significantCommunications":  [
                                                         "Aster brain initialized from employee registry with truthful fallback state.",
                                                         "Human note: No immediate human fix needed unless you want to approve the next-product direction early."
                                                     ],
                       "significantEvents":  [
                                                 "Aster brain initialized from employee registry with truthful fallback state.",
                                                 "Scout lane is actively evaluating the fastest mobile app path and the next nurse-adjacent SaaS direction.",
                                                 "Runtime state: live"
                                             ],
                       "humanRequiredBlocks":  [
                                                   "No immediate human fix needed unless you want to approve the next-product direction early."
                                               ],
                       "theories":  [
                                        "One validated adjacent healthcare SaaS memo",
                                        "Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity",
                                        "hold one next-product thesis",
                                        "Never present stale or presentation-only state as live operational telemetry.",
                                        "External public actions require approval; research memos may be drafted without posting."
                                    ],
                       "experiments":  [
                                           "Run a YouTube-caption scout for current agent workflow videos",
                                           "Run a Reddit public-thread scout for 24/7 local agents and human-gated coding workflows",
                                           "Draft a Cloudflare Agents + Workflows control-plane spike for ChappyAI guild durability",
                                           "Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity",
                                           "One validated adjacent healthcare SaaS memo",
                                           "Scout lane is actively evaluating the fastest mobile app path and the next nurse-adjacent SaaS direction."
                                       ],
                       "trialsAndErrors":  [
                                               "none",
                                               "one manager agent owns workflow execution",
                                               "specialist agents behave like bounded tools/workers",
                                               "Telegram talks to the manager, not directly to multiple independent workers",
                                               "this matches a single-user operator workflow",
                                               "it reduces ambiguity about who can change priorities"
                                           ],
                       "stats":  {
                                     "level":  3,
                                     "xp":  110,
                                     "skills":  6,
                                     "durableMemories":  2,
                                     "memoryEvents":  1,
                                     "activeContexts":  5,
                                     "pendingExperiments":  0,
                                     "completedTasks":  0,
                                     "blockedTasks":  0,
                                     "sourceCount":  5
                                 },
                       "brain":  {
                                     "health":  "clean",
                                     "lastCuratedAt":  "2026-05-21T20:45:35.2465946Z",
                                     "nextSkillTarget":  "One validated adjacent healthcare SaaS memo",
                                     "activeContext":  [
                                                           "Recommend the fastest mobile app path and the best nurse-adjacent follow-on SaaS opportunity",
                                                           "One validated adjacent healthcare SaaS memo",
                                                           "Scout lane is actively evaluating the fastest mobile app path and the next nurse-adjacent SaaS direction.",
                                                           "ICU handoff assistant",
                                                           "validation memo"
                                                       ],
                                     "durableMemory":  [
                                                           "Never present stale or presentation-only state as live operational telemetry.",
                                                           "External public actions require approval; research memos may be drafted without posting."
                                                       ],
                                     "skills":  [
                                                    "truthful status reporting",
                                                    "bounded task execution",
                                                    "checkpoint handoff",
                                                    "opportunity scouting",
                                                    "validation memo writing",
                                                    "profit-first prioritization"
                                                ],
                                     "recentEvents":  [
                                                          "Aster brain initialized from employee registry with truthful fallback state."
                                                      ]
                                 },
                       "sources":  [
                                       {
                                           "label":  "ChapAI brain",
                                           "kind":  "brain-json",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\brains\\agents\\scout.json",
                                           "updatedAt":  "2026-05-21T13:45:35.2465946-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane state",
                                           "kind":  "runtime-state",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\scout-state.json",
                                           "updatedAt":  "2026-05-21T13:45:07.2274467-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane queue",
                                           "kind":  "queue",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\scout-queue.json",
                                           "updatedAt":  "2026-05-21T13:45:07.2261762-07:00"
                                       },
                                       {
                                           "label":  "Legacy CCRN memory",
                                           "kind":  "legacy-memory",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\ccrn-agent\\MEMORY.md",
                                           "updatedAt":  "2026-03-22T14:51:25.4944562-07:00"
                                       },
                                       {
                                           "label":  "ChappyAI Obsidian guild",
                                           "kind":  "obsidian-vault",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ChapAi\\Guild",
                                           "updatedAt":  "2026-05-04T18:47:34.4788130-07:00"
                                       }
                                   ]
                   },
                   {
                       "id":  "explorer",
                       "displayName":  "Euler",
                       "nickname":  "Euler",
                       "role":  "Market Explorer",
                       "runtime":  "codex",
                       "state":  "stale",
                       "truthLevel":  "runtime-file",
                       "currentTask":  "Repair or retire the orphaned market explorer runtime entrypoint",
                       "latest":  "Euler brain initialized from employee registry with truthful fallback state.",
                       "blocker":  "Explorer has file-backed brain state but no verified runnable entrypoint; keep it reserve-blocked until repaired or retired.",
                       "plan":  "Run a YouTube-caption scout for current agent workflow videos",
                       "currentWorkingGoal":  "One validated adjacent healthcare SaaS memo",
                       "predictions":  [
                                           "Euler is most likely to move again after this blocker is cleared: Explorer has file-backed brain state but no verified runnable entrypoint; keep it reserve-blocked until repaired or retired.",
                                           "Euler\u0027s next useful output should advance: One validated adjacent healthcare SaaS memo",
                                           "One validated adjacent healthcare SaaS memo",
                                           "Repair or retire the orphaned market explorer runtime entrypoint",
                                           "clear blocker: Explorer has file-backed brain state but no verified runnable entrypoint; keep it reserve-blocked until repaired or retired."
                                       ],
                       "experimentResults":  [
                                                 "Euler brain initialized from employee registry with truthful fallback state."
                                             ],
                       "significantCommunications":  [
                                                         "Euler brain initialized from employee registry with truthful fallback state."
                                                     ],
                       "significantEvents":  [
                                                 "Euler brain initialized from employee registry with truthful fallback state.",
                                                 "Runtime state: stale"
                                             ],
                       "humanRequiredBlocks":  [
                                                   "Human required: Explorer has file-backed brain state but no verified runnable entrypoint; keep it reserve-blocked until repaired or retired."
                                               ],
                       "theories":  [
                                        "One validated adjacent healthcare SaaS memo",
                                        "Repair or retire the orphaned market explorer runtime entrypoint",
                                        "clear blocker: Explorer has file-backed brain state but no verified runnable entrypoint; keep it reserve-blocked until repaired or retired.",
                                        "hold one next-product thesis",
                                        "Never present stale or presentation-only state as live operational telemetry."
                                    ],
                       "experiments":  [
                                           "Run a YouTube-caption scout for current agent workflow videos",
                                           "Run a Reddit public-thread scout for 24/7 local agents and human-gated coding workflows",
                                           "Draft a Cloudflare Agents + Workflows control-plane spike for ChappyAI guild durability",
                                           "Repair or retire the orphaned market explorer runtime entrypoint",
                                           "One validated adjacent healthcare SaaS memo",
                                           "Explorer has file-backed brain state but no verified runnable entrypoint; keep it reserve-blocked until repaired or retired."
                                       ],
                       "trialsAndErrors":  [
                                               "Explorer has file-backed brain state but no verified runnable entrypoint; keep it reserve-blocked until repaired or retired.",
                                               "one manager agent owns workflow execution",
                                               "specialist agents behave like bounded tools/workers",
                                               "Telegram talks to the manager, not directly to multiple independent workers",
                                               "this matches a single-user operator workflow",
                                               "it reduces ambiguity about who can change priorities"
                                           ],
                       "stats":  {
                                     "level":  3,
                                     "xp":  110,
                                     "skills":  6,
                                     "durableMemories":  2,
                                     "memoryEvents":  1,
                                     "activeContexts":  5,
                                     "pendingExperiments":  0,
                                     "completedTasks":  0,
                                     "blockedTasks":  0,
                                     "sourceCount":  5
                                 },
                       "brain":  {
                                     "health":  "clean",
                                     "lastCuratedAt":  "2026-05-21T20:45:35.2865967Z",
                                     "nextSkillTarget":  "One validated adjacent healthcare SaaS memo",
                                     "activeContext":  [
                                                           "Repair or retire the orphaned market explorer runtime entrypoint",
                                                           "One validated adjacent healthcare SaaS memo",
                                                           "Explorer has file-backed brain state but no verified runnable entrypoint; keep it reserve-blocked until repaired or retired.",
                                                           "seeded brain initialized",
                                                           "awaiting fresh runtime heartbeat"
                                                       ],
                                     "durableMemory":  [
                                                           "Never present stale or presentation-only state as live operational telemetry.",
                                                           "External public actions require approval; research memos may be drafted without posting."
                                                       ],
                                     "skills":  [
                                                    "truthful status reporting",
                                                    "bounded task execution",
                                                    "checkpoint handoff",
                                                    "opportunity scouting",
                                                    "validation memo writing",
                                                    "profit-first prioritization"
                                                ],
                                     "recentEvents":  [
                                                          "Euler brain initialized from employee registry with truthful fallback state."
                                                      ]
                                 },
                       "sources":  [
                                       {
                                           "label":  "ChapAI brain",
                                           "kind":  "brain-json",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\brains\\agents\\explorer.json",
                                           "updatedAt":  "2026-05-21T13:45:35.2865967-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane state",
                                           "kind":  "runtime-state",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\explorer-state.json",
                                           "updatedAt":  "2026-05-13T10:10:59.8162594-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane queue",
                                           "kind":  "queue",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\explorer-queue.json",
                                           "updatedAt":  "2026-05-06T13:52:08.3007723-07:00"
                                       },
                                       {
                                           "label":  "Legacy CCRN memory",
                                           "kind":  "legacy-memory",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\ccrn-agent\\MEMORY.md",
                                           "updatedAt":  "2026-03-22T14:51:25.4944562-07:00"
                                       },
                                       {
                                           "label":  "ChappyAI Obsidian guild",
                                           "kind":  "obsidian-vault",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ChapAi\\Guild",
                                           "updatedAt":  "2026-05-04T18:47:34.4788130-07:00"
                                       }
                                   ]
                   },
                   {
                       "id":  "gemini-audit",
                       "displayName":  "Gemini",
                       "nickname":  "Gemini",
                       "role":  "External Audit Advisor",
                       "runtime":  "gemini",
                       "state":  "sleeping",
                       "truthLevel":  "runtime-file",
                       "currentTask":  "Keep the audit memo synchronized with the guild",
                       "latest":  "Gemini audit lane is warm and waiting for the next bounded memo update.",
                       "blocker":  "Gemini has a blocked audit item.",
                       "plan":  "Run a YouTube-caption scout for current agent workflow videos",
                       "currentWorkingGoal":  "Audit-to-action delegation",
                       "predictions":  [
                                           "Gemini is most likely to move again after this blocker is cleared: Gemini has a blocked audit item.",
                                           "Gemini\u0027s next useful output should advance: Audit-to-action delegation",
                                           "Audit-to-action delegation",
                                           "Keep the audit memo synchronized with the guild",
                                           "clear blocker: Gemini has a blocked audit item."
                                       ],
                       "experimentResults":  [
                                                 "Gemini brain initialized from employee registry with truthful fallback state.",
                                                 "Gemini kept the audit lane warm with no unresolved pending tasks.",
                                                 "Gemini audit lane is warm and waiting for the next bounded memo update."
                                             ],
                       "significantCommunications":  [
                                                         "Gemini brain initialized from employee registry with truthful fallback state.",
                                                         "Gemini kept the audit lane warm with no unresolved pending tasks.",
                                                         "Human note: Clear the blocked audit input if Gemini reports a concrete external dependency."
                                                     ],
                       "significantEvents":  [
                                                 "Gemini brain initialized from employee registry with truthful fallback state.",
                                                 "Gemini kept the audit lane warm with no unresolved pending tasks.",
                                                 "Gemini audit lane is warm and waiting for the next bounded memo update.",
                                                 "Runtime state: sleeping"
                                             ],
                       "humanRequiredBlocks":  [
                                                   "Human required: Gemini has a blocked audit item.",
                                                   "Clear the blocked audit input if Gemini reports a concrete external dependency."
                                               ],
                       "theories":  [
                                        "Audit-to-action delegation",
                                        "Keep the audit memo synchronized with the guild",
                                        "clear blocker: Gemini has a blocked audit item.",
                                        "Never present stale or presentation-only state as live operational telemetry.",
                                        "External public actions require approval; research memos may be drafted without posting."
                                    ],
                       "experiments":  [
                                           "Run a YouTube-caption scout for current agent workflow videos",
                                           "Run a Reddit public-thread scout for 24/7 local agents and human-gated coding workflows",
                                           "Draft a Cloudflare Agents + Workflows control-plane spike for ChappyAI guild durability",
                                           "Keep the audit memo synchronized with the guild",
                                           "Audit-to-action delegation",
                                           "Gemini has a blocked audit item."
                                       ],
                       "trialsAndErrors":  [
                                               "Gemini has a blocked audit item.",
                                               "one manager agent owns workflow execution",
                                               "specialist agents behave like bounded tools/workers",
                                               "Telegram talks to the manager, not directly to multiple independent workers",
                                               "this matches a single-user operator workflow",
                                               "it reduces ambiguity about who can change priorities"
                                           ],
                       "stats":  {
                                     "level":  5,
                                     "xp":  186,
                                     "skills":  10,
                                     "durableMemories":  4,
                                     "memoryEvents":  2,
                                     "activeContexts":  5,
                                     "pendingExperiments":  0,
                                     "completedTasks":  0,
                                     "blockedTasks":  0,
                                     "sourceCount":  5
                                 },
                       "brain":  {
                                     "health":  "clean",
                                     "lastCuratedAt":  "2026-05-21T20:45:36.2223290Z",
                                     "nextSkillTarget":  "Audit-to-action delegation",
                                     "activeContext":  [
                                                           "Keep the audit memo synchronized with the guild",
                                                           "Audit-to-action delegation",
                                                           "Gemini has a blocked audit item.",
                                                           "Gemini audit lane is warm and waiting for the next bounded memo update.",
                                                           "external audit sync"
                                                       ],
                                     "durableMemory":  [
                                                           "Never present stale or presentation-only state as live operational telemetry.",
                                                           "External public actions require approval; research memos may be drafted without posting.",
                                                           "Gemini should stay in audit mode and feed only short bounded pod work into Antigravity.",
                                                           "Gemini should offload low-cost clustering, classification, and reply-angle drafting to Gemma 4 before escalating to premium models."
                                                       ],
                                     "skills":  [
                                                    "truthful status reporting",
                                                    "bounded task execution",
                                                    "checkpoint handoff",
                                                    "external audit synthesis",
                                                    "pricing clarity review",
                                                    "bounded recommendation handoff",
                                                    "creator economics",
                                                    "premium ui refinement",
                                                    "opportunity scouting",
                                                    "validation memo writing"
                                                ],
                                     "recentEvents":  [
                                                          "Gemini brain initialized from employee registry with truthful fallback state.",
                                                          "Gemini kept the audit lane warm with no unresolved pending tasks."
                                                      ]
                                 },
                       "sources":  [
                                       {
                                           "label":  "ChapAI brain",
                                           "kind":  "brain-json",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\brains\\agents\\gemini-audit.json",
                                           "updatedAt":  "2026-05-21T13:45:36.2223290-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane state",
                                           "kind":  "runtime-state",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\gemini-audit-state.json",
                                           "updatedAt":  "2026-05-21T13:45:15.9945463-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane queue",
                                           "kind":  "queue",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\gemini-audit-queue.json",
                                           "updatedAt":  "2026-05-21T13:45:15.8238902-07:00"
                                       },
                                       {
                                           "label":  "Legacy CCRN memory",
                                           "kind":  "legacy-memory",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\ccrn-agent\\MEMORY.md",
                                           "updatedAt":  "2026-03-22T14:51:25.4944562-07:00"
                                       },
                                       {
                                           "label":  "ChappyAI Obsidian guild",
                                           "kind":  "obsidian-vault",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ChapAi\\Guild",
                                           "updatedAt":  "2026-05-04T18:47:34.4788130-07:00"
                                       }
                                   ]
                   },
                   {
                       "id":  "antigravity",
                       "displayName":  "Antigravity",
                       "nickname":  "Antigravity",
                       "role":  "Gemini Sub-Swarm",
                       "runtime":  "gemini",
                       "state":  "live",
                       "truthLevel":  "runtime-file",
                       "currentTask":  "Turn Gemini NGN gap audits into seedable NCLEX family briefs",
                       "latest":  "Antigravity is actively cycling the conversion, search, and audit pods in bounded sequence with Gemma 4 as the first cheap utility lane.",
                       "blocker":  "none",
                       "plan":  "Turn Gemini NGN gap audits into seedable NCLEX family briefs",
                       "currentWorkingGoal":  "Audit-to-action delegation",
                       "predictions":  [
                                           "Antigravity\u0027s next useful output should advance: Audit-to-action delegation",
                                           "Audit-to-action delegation",
                                           "Turn Gemini NGN gap audits into seedable NCLEX family briefs",
                                           "Never present stale or presentation-only state as live operational telemetry.",
                                           "External public actions require approval; research memos may be drafted without posting."
                                       ],
                       "experimentResults":  [
                                                 "Antigravity brain initialized from employee registry with truthful fallback state.",
                                                 "Antigravity is actively cycling the conversion, search, and audit pods in bounded sequence with Gemma 4 as the first cheap utility lane."
                                             ],
                       "significantCommunications":  [
                                                         "Antigravity brain initialized from employee registry with truthful fallback state.",
                                                         "Human note: No immediate human fix needed."
                                                     ],
                       "significantEvents":  [
                                                 "Antigravity brain initialized from employee registry with truthful fallback state.",
                                                 "Antigravity is actively cycling the conversion, search, and audit pods in bounded sequence with Gemma 4 as the first cheap utility lane.",
                                                 "Runtime state: live"
                                             ],
                       "humanRequiredBlocks":  [
                                                   "No immediate human fix needed."
                                               ],
                       "theories":  [
                                        "Audit-to-action delegation",
                                        "Turn Gemini NGN gap audits into seedable NCLEX family briefs",
                                        "Never present stale or presentation-only state as live operational telemetry.",
                                        "External public actions require approval; research memos may be drafted without posting.",
                                        "Antigravity should keep pod work serialized and manager-visible so the swarm stays cheap and legible."
                                    ],
                       "experiments":  [
                                           "Turn Gemini NGN gap audits into seedable NCLEX family briefs",
                                           "Keep Nemoclaw family briefs synchronized with canonical NCLEX weak spots",
                                           "Run duplicate-family, citation, and diagram-needed precheck for NCLEX drafts",
                                           "Keep marketing proof blocks aligned with canonical counts and real tutor value",
                                           "Run a YouTube-caption scout for current agent workflow videos",
                                           "Run a Reddit public-thread scout for 24/7 local agents and human-gated coding workflows"
                                       ],
                       "trialsAndErrors":  [
                                               "none",
                                               "one manager agent owns workflow execution",
                                               "specialist agents behave like bounded tools/workers",
                                               "Telegram talks to the manager, not directly to multiple independent workers",
                                               "this matches a single-user operator workflow",
                                               "it reduces ambiguity about who can change priorities"
                                           ],
                       "stats":  {
                                     "level":  5,
                                     "xp":  200,
                                     "skills":  12,
                                     "durableMemories":  4,
                                     "memoryEvents":  1,
                                     "activeContexts":  5,
                                     "pendingExperiments":  4,
                                     "completedTasks":  0,
                                     "blockedTasks":  0,
                                     "sourceCount":  5
                                 },
                       "brain":  {
                                     "health":  "clean",
                                     "lastCuratedAt":  "2026-05-21T20:45:36.4266989Z",
                                     "nextSkillTarget":  "Audit-to-action delegation",
                                     "activeContext":  [
                                                           "Turn Gemini NGN gap audits into seedable NCLEX family briefs",
                                                           "Audit-to-action delegation",
                                                           "Antigravity is actively cycling the conversion, search, and audit pods in bounded sequence with Gemma 4 as the first cheap utility lane.",
                                                           "conversion pod",
                                                           "search pod"
                                                       ],
                                     "durableMemory":  [
                                                           "Never present stale or presentation-only state as live operational telemetry.",
                                                           "External public actions require approval; research memos may be drafted without posting.",
                                                           "Antigravity should keep pod work serialized and manager-visible so the swarm stays cheap and legible.",
                                                           "Gemma 4 should be Antigravity\u0027s first low-cost pod for trend clustering, reply drafting, diagram cleanup, and question precheck before premium escalation."
                                                       ],
                                     "skills":  [
                                                    "truthful status reporting",
                                                    "bounded task execution",
                                                    "checkpoint handoff",
                                                    "external audit synthesis",
                                                    "pricing clarity review",
                                                    "bounded recommendation handoff",
                                                    "creator outreach copy",
                                                    "conversion messaging",
                                                    "search-intent growth",
                                                    "harness architecture"
                                                ],
                                     "recentEvents":  [
                                                          "Antigravity brain initialized from employee registry with truthful fallback state."
                                                      ]
                                 },
                       "sources":  [
                                       {
                                           "label":  "ChapAI brain",
                                           "kind":  "brain-json",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\brains\\agents\\antigravity.json",
                                           "updatedAt":  "2026-05-21T13:45:36.4286954-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane state",
                                           "kind":  "runtime-state",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\antigravity-state.json",
                                           "updatedAt":  "2026-05-21T13:45:20.4804553-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane queue",
                                           "kind":  "queue",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\antigravity-queue.json",
                                           "updatedAt":  "2026-05-21T13:45:20.4794559-07:00"
                                       },
                                       {
                                           "label":  "Legacy CCRN memory",
                                           "kind":  "legacy-memory",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\ccrn-agent\\MEMORY.md",
                                           "updatedAt":  "2026-03-22T14:51:25.4944562-07:00"
                                       },
                                       {
                                           "label":  "ChappyAI Obsidian guild",
                                           "kind":  "obsidian-vault",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ChapAi\\Guild",
                                           "updatedAt":  "2026-05-04T18:47:34.4788130-07:00"
                                       }
                                   ]
                   },
                   {
                       "id":  "outreach-email",
                       "displayName":  "Beacon",
                       "nickname":  "Beacon",
                       "role":  "Email Growth",
                       "runtime":  "codex",
                       "state":  "blocked",
                       "truthLevel":  "runtime-file",
                       "currentTask":  "outreach-email entrypoint did not complete inside the supervisor budget.",
                       "latest":  "Supervisor bounded the lane to prevent workforce-wide staleness.",
                       "blocker":  "spawnSync powershell.exe ETIMEDOUT",
                       "plan":  "Prepare the next outbound email wave.",
                       "currentWorkingGoal":  "First live daily question send and clickthrough review",
                       "predictions":  [
                                           "Beacon is most likely to move again after this blocker is cleared: spawnSync powershell.exe ETIMEDOUT",
                                           "Beacon\u0027s next useful output should advance: First live daily question send and clickthrough review",
                                           "First live daily question send and clickthrough review",
                                           "turn daily questions into a repeat touchpoint",
                                           "Never present stale or presentation-only state as live operational telemetry."
                                       ],
                       "experimentResults":  [
                                                 "Completed: Refresh the email growth radar and daily-question send readiness",
                                                 "Refresh the email growth radar and daily-question send readiness is now packaged into reusable outbound-email assets.",
                                                 "Beacon has a seed list of 1 captured leads and is waiting on provider credentials for the first daily question send."
                                             ],
                       "significantCommunications":  [
                                                         "Refresh the email growth radar and daily-question send readiness is now packaged into reusable outbound-email assets.",
                                                         "Human note: none"
                                                     ],
                       "significantEvents":  [
                                                 "Refresh the email growth radar and daily-question send readiness is now packaged into reusable outbound-email assets.",
                                                 "Supervisor bounded the lane to prevent workforce-wide staleness.",
                                                 "Runtime state: blocked"
                                             ],
                       "humanRequiredBlocks":  [
                                                   "Human required: spawnSync powershell.exe ETIMEDOUT",
                                                   "none"
                                               ],
                       "theories":  [
                                        "First live daily question send and clickthrough review",
                                        "turn daily questions into a repeat touchpoint",
                                        "Never present stale or presentation-only state as live operational telemetry.",
                                        "External public actions require approval; research memos may be drafted without posting.",
                                        "A daily question email is the lightest repeat-touchpoint channel for free leads."
                                    ],
                       "experiments":  [
                                           "Run a YouTube-caption scout for current agent workflow videos",
                                           "Run a Reddit public-thread scout for 24/7 local agents and human-gated coding workflows",
                                           "Draft a Cloudflare Agents + Workflows control-plane spike for ChappyAI guild durability",
                                           "First live daily question send and clickthrough review",
                                           "Beacon has a seed list of 1 captured leads and is waiting on provider credentials for the first daily question send.",
                                           "daily question email pilot"
                                       ],
                       "trialsAndErrors":  [
                                               "none",
                                               "one manager agent owns workflow execution",
                                               "specialist agents behave like bounded tools/workers",
                                               "Telegram talks to the manager, not directly to multiple independent workers",
                                               "this matches a single-user operator workflow",
                                               "it reduces ambiguity about who can change priorities"
                                           ],
                       "stats":  {
                                     "level":  11,
                                     "xp":  454,
                                     "skills":  9,
                                     "durableMemories":  6,
                                     "memoryEvents":  18,
                                     "activeContexts":  5,
                                     "pendingExperiments":  0,
                                     "completedTasks":  26,
                                     "blockedTasks":  0,
                                     "sourceCount":  5
                                 },
                       "brain":  {
                                     "health":  "clean",
                                     "lastCuratedAt":  "2026-05-21T20:45:37.0690530Z",
                                     "nextSkillTarget":  "First live daily question send and clickthrough review",
                                     "activeContext":  [
                                                           "First live daily question send and clickthrough review",
                                                           "Beacon has a seed list of 1 captured leads and is waiting on provider credentials for the first daily question send.",
                                                           "daily question email pilot",
                                                           "educator outreach",
                                                           "health-system outreach"
                                                       ],
                                     "durableMemory":  [
                                                           "Never present stale or presentation-only state as live operational telemetry.",
                                                           "External public actions require approval; research memos may be drafted without posting.",
                                                           "A daily question email is the lightest repeat-touchpoint channel for free leads.",
                                                           "Educator outreach should lead with student outcomes and ease of implementation.",
                                                           "Health-system outreach should begin with pilot-friendly wording instead of enterprise-heavy language.",
                                                           "Email automation should stay simple until the first open and clickthrough benchmarks are real."
                                                       ],
                                     "skills":  [
                                                    "truthful status reporting",
                                                    "bounded task execution",
                                                    "checkpoint handoff",
                                                    "daily question delivery",
                                                    "educator outreach sequencing",
                                                    "deliverability readiness",
                                                    "diagram coverage",
                                                    "rationale refinement",
                                                    "batch validation"
                                                ],
                                     "recentEvents":  [
                                                          "Refresh the email growth radar and daily-question send readiness is now packaged into reusable outbound-email assets."
                                                      ]
                                 },
                       "sources":  [
                                       {
                                           "label":  "ChapAI brain",
                                           "kind":  "brain-json",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\brains\\agents\\outreach-email.json",
                                           "updatedAt":  "2026-05-21T13:45:37.0830675-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane state",
                                           "kind":  "runtime-state",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\outreach-email-state.json",
                                           "updatedAt":  "2026-05-21T11:40:56.6324457-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane queue",
                                           "kind":  "queue",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\outreach-email-queue.json",
                                           "updatedAt":  "2026-05-21T11:40:56.6251192-07:00"
                                       },
                                       {
                                           "label":  "Legacy CCRN memory",
                                           "kind":  "legacy-memory",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\ccrn-agent\\MEMORY.md",
                                           "updatedAt":  "2026-03-22T14:51:25.4944562-07:00"
                                       },
                                       {
                                           "label":  "ChappyAI Obsidian guild",
                                           "kind":  "obsidian-vault",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ChapAi\\Guild",
                                           "updatedAt":  "2026-05-04T18:47:34.4788130-07:00"
                                       }
                                   ]
                   },
                   {
                       "id":  "growth-orchestrator",
                       "displayName":  "Helios",
                       "nickname":  "Helios",
                       "role":  "Growth Control",
                       "runtime":  "codex",
                       "state":  "live",
                       "truthLevel":  "runtime-file",
                       "currentTask":  "Synchronize social, email, and creator growth into one approval queue",
                       "latest":  "Growth control is keeping Mercury, Beacon, and the creator/email funnel aligned around approval-ready work.",
                       "blocker":  "none",
                       "plan":  "Keep the approval queue fresh, keep subscriber capture simple, and tighten the first repeatable growth loop.",
                       "currentWorkingGoal":  "Cross-lane handoff simplification",
                       "predictions":  [
                                           "Helios\u0027s next useful output should advance: Cross-lane handoff simplification",
                                           "Cross-lane handoff simplification",
                                           "Synchronize social, email, and creator growth into one approval queue",
                                           "push traffic into the package path",
                                           "Never present stale or presentation-only state as live operational telemetry."
                                       ],
                       "experimentResults":  [
                                                 "Growth orchestration synchronized Mercury, Beacon, and the approval queue into one control plane.",
                                                 "Growth control is keeping Mercury, Beacon, and the creator/email funnel aligned around approval-ready work."
                                             ],
                       "significantCommunications":  [
                                                         "Growth orchestration synchronized Mercury, Beacon, and the approval queue into one control plane.",
                                                         "Human note: none"
                                                     ],
                       "significantEvents":  [
                                                 "Growth orchestration synchronized Mercury, Beacon, and the approval queue into one control plane.",
                                                 "Growth control is keeping Mercury, Beacon, and the creator/email funnel aligned around approval-ready work.",
                                                 "Runtime state: live"
                                             ],
                       "humanRequiredBlocks":  [
                                                   "none"
                                               ],
                       "theories":  [
                                        "Cross-lane handoff simplification",
                                        "Synchronize social, email, and creator growth into one approval queue",
                                        "push traffic into the package path",
                                        "Never present stale or presentation-only state as live operational telemetry.",
                                        "External public actions require approval; research memos may be drafted without posting."
                                    ],
                       "experiments":  [
                                           "Run a YouTube-caption scout for current agent workflow videos",
                                           "Run a Reddit public-thread scout for 24/7 local agents and human-gated coding workflows",
                                           "Draft a Cloudflare Agents + Workflows control-plane spike for ChappyAI guild durability",
                                           "Synchronize social, email, and creator growth into one approval queue",
                                           "Cross-lane handoff simplification",
                                           "Growth control is keeping Mercury, Beacon, and the creator/email funnel aligned around approval-ready work."
                                       ],
                       "trialsAndErrors":  [
                                               "none",
                                               "one manager agent owns workflow execution",
                                               "specialist agents behave like bounded tools/workers",
                                               "Telegram talks to the manager, not directly to multiple independent workers",
                                               "this matches a single-user operator workflow",
                                               "it reduces ambiguity about who can change priorities"
                                           ],
                       "stats":  {
                                     "level":  8,
                                     "xp":  317,
                                     "skills":  12,
                                     "durableMemories":  7,
                                     "memoryEvents":  18,
                                     "activeContexts":  5,
                                     "pendingExperiments":  0,
                                     "completedTasks":  0,
                                     "blockedTasks":  0,
                                     "sourceCount":  5
                                 },
                       "brain":  {
                                     "health":  "clean",
                                     "lastCuratedAt":  "2026-05-21T20:45:37.6151253Z",
                                     "nextSkillTarget":  "Cross-lane handoff simplification",
                                     "activeContext":  [
                                                           "Synchronize social, email, and creator growth into one approval queue",
                                                           "Cross-lane handoff simplification",
                                                           "Growth control is keeping Mercury, Beacon, and the creator/email funnel aligned around approval-ready work.",
                                                           "subscriber growth control",
                                                           "social + email orchestration"
                                                       ],
                                     "durableMemory":  [
                                                           "Never present stale or presentation-only state as live operational telemetry.",
                                                           "External public actions require approval; research memos may be drafted without posting.",
                                                           "Approval-gated sends scale safer when social, email, and creator motion are synchronized in one queue.",
                                                           "The cheapest subscriber compounding path is a daily-question email plus a clean cram-pass CTA.",
                                                           "Mercury should keep learning even when posting is blocked by continuing to refine replies, trend watchlists, and creator ladders.",
                                                           "Beacon should keep educator and health-system outreach ready even before delivery credentials are configured."
                                                       ],
                                     "skills":  [
                                                    "truthful status reporting",
                                                    "bounded task execution",
                                                    "checkpoint handoff",
                                                    "harness architecture",
                                                    "handoff design",
                                                    "restart-safe continuity",
                                                    "growth control plane",
                                                    "approval packet sequencing",
                                                    "channel orchestration",
                                                    "subscriber loop design"
                                                ],
                                     "recentEvents":  [
                                                          "Growth orchestration synchronized Mercury, Beacon, and the approval queue into one control plane."
                                                      ]
                                 },
                       "sources":  [
                                       {
                                           "label":  "ChapAI brain",
                                           "kind":  "brain-json",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\brains\\agents\\growth-orchestrator.json",
                                           "updatedAt":  "2026-05-21T13:45:37.6898128-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane state",
                                           "kind":  "runtime-state",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\growth-orchestrator-state.json",
                                           "updatedAt":  "2026-05-21T13:45:05.0390663-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane queue",
                                           "kind":  "queue",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\growth-orchestrator-queue.json",
                                           "updatedAt":  "2026-05-21T13:45:04.9750639-07:00"
                                       },
                                       {
                                           "label":  "Legacy CCRN memory",
                                           "kind":  "legacy-memory",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\ccrn-agent\\MEMORY.md",
                                           "updatedAt":  "2026-03-22T14:51:25.4944562-07:00"
                                       },
                                       {
                                           "label":  "ChappyAI Obsidian guild",
                                           "kind":  "obsidian-vault",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ChapAi\\Guild",
                                           "updatedAt":  "2026-05-04T18:47:34.4788130-07:00"
                                       }
                                   ]
                   },
                   {
                       "id":  "mobile-product",
                       "displayName":  "Nova",
                       "nickname":  "Nova",
                       "role":  "Mobile Product",
                       "runtime":  "codex",
                       "state":  "live",
                       "truthLevel":  "runtime-file",
                       "currentTask":  "Maintain the Expo-first mobile product path",
                       "latest":  "Nova is keeping iOS and Android on one Expo-first path with shared question, tutor, and retention loops.",
                       "blocker":  "none",
                       "plan":  "Run a YouTube-caption scout for current agent workflow videos",
                       "currentWorkingGoal":  "Expo-first mobile path with the fewest moving parts",
                       "predictions":  [
                                           "Nova\u0027s next useful output should advance: Expo-first mobile path with the fewest moving parts",
                                           "Expo-first mobile path with the fewest moving parts",
                                           "Maintain the Expo-first mobile product path",
                                           "ship cleaner premium surfaces",
                                           "Never present stale or presentation-only state as live operational telemetry."
                                       ],
                       "experimentResults":  [
                                                 "Nova kept the Expo-first mobile roadmap current with a shared practice, tutor, and retention path.",
                                                 "Nova is keeping iOS and Android on one Expo-first path with shared question, tutor, and retention loops."
                                             ],
                       "significantCommunications":  [
                                                         "Nova kept the Expo-first mobile roadmap current with a shared practice, tutor, and retention path.",
                                                         "Human note: No immediate human fix needed."
                                                     ],
                       "significantEvents":  [
                                                 "Nova kept the Expo-first mobile roadmap current with a shared practice, tutor, and retention path.",
                                                 "Nova is keeping iOS and Android on one Expo-first path with shared question, tutor, and retention loops.",
                                                 "Runtime state: live"
                                             ],
                       "humanRequiredBlocks":  [
                                                   "No immediate human fix needed."
                                               ],
                       "theories":  [
                                        "Expo-first mobile path with the fewest moving parts",
                                        "Maintain the Expo-first mobile product path",
                                        "ship cleaner premium surfaces",
                                        "Never present stale or presentation-only state as live operational telemetry.",
                                        "External public actions require approval; research memos may be drafted without posting."
                                    ],
                       "experiments":  [
                                           "Run a YouTube-caption scout for current agent workflow videos",
                                           "Run a Reddit public-thread scout for 24/7 local agents and human-gated coding workflows",
                                           "Draft a Cloudflare Agents + Workflows control-plane spike for ChappyAI guild durability",
                                           "Maintain the Expo-first mobile product path",
                                           "Expo-first mobile path with the fewest moving parts",
                                           "Nova is keeping iOS and Android on one Expo-first path with shared question, tutor, and retention loops."
                                       ],
                       "trialsAndErrors":  [
                                               "none",
                                               "one manager agent owns workflow execution",
                                               "specialist agents behave like bounded tools/workers",
                                               "Telegram talks to the manager, not directly to multiple independent workers",
                                               "this matches a single-user operator workflow",
                                               "it reduces ambiguity about who can change priorities"
                                           ],
                       "stats":  {
                                     "level":  7,
                                     "xp":  302,
                                     "skills":  12,
                                     "durableMemories":  2,
                                     "memoryEvents":  24,
                                     "activeContexts":  5,
                                     "pendingExperiments":  0,
                                     "completedTasks":  0,
                                     "blockedTasks":  0,
                                     "sourceCount":  5
                                 },
                       "brain":  {
                                     "health":  "noisy",
                                     "lastCuratedAt":  "2026-05-21T20:45:39.1737967Z",
                                     "nextSkillTarget":  "Expo-first mobile path with the fewest moving parts",
                                     "activeContext":  [
                                                           "Maintain the Expo-first mobile product path",
                                                           "Expo-first mobile path with the fewest moving parts",
                                                           "Nova is keeping iOS and Android on one Expo-first path with shared question, tutor, and retention loops.",
                                                           "expo-first mobile rollout",
                                                           "shared question and tutor model"
                                                       ],
                                     "durableMemory":  [
                                                           "Never present stale or presentation-only state as live operational telemetry.",
                                                           "External public actions require approval; research memos may be drafted without posting."
                                                       ],
                                     "skills":  [
                                                    "truthful status reporting",
                                                    "bounded task execution",
                                                    "checkpoint handoff",
                                                    "expo architecture",
                                                    "mobile onboarding flow",
                                                    "offline study path",
                                                    "opportunity scouting",
                                                    "validation memo writing",
                                                    "tutor fallback resilience",
                                                    "diagram coverage"
                                                ],
                                     "recentEvents":  [
                                                          "Nova kept the Expo-first mobile roadmap current with a shared practice, tutor, and retention path."
                                                      ]
                                 },
                       "sources":  [
                                       {
                                           "label":  "ChapAI brain",
                                           "kind":  "brain-json",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\brains\\agents\\mobile-product.json",
                                           "updatedAt":  "2026-05-21T13:45:39.1793071-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane state",
                                           "kind":  "runtime-state",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\mobile-product-state.json",
                                           "updatedAt":  "2026-05-21T13:45:02.4302060-07:00"
                                       },
                                       {
                                           "label":  "ChapAI lane queue",
                                           "kind":  "queue",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\chapai\\config\\mobile-product-queue.json",
                                           "updatedAt":  "2026-05-21T13:45:02.4282059-07:00"
                                       },
                                       {
                                           "label":  "Legacy CCRN memory",
                                           "kind":  "legacy-memory",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ai\\ccrn-agent\\MEMORY.md",
                                           "updatedAt":  "2026-03-22T14:51:25.4944562-07:00"
                                       },
                                       {
                                           "label":  "ChappyAI Obsidian guild",
                                           "kind":  "obsidian-vault",
                                           "path":  "C:\\Users\\Chapman\\Desktop\\ChapAi\\Guild",
                                           "updatedAt":  "2026-05-04T18:47:34.4788130-07:00"
                                       }
                                   ]
                   }
               ]
} as unknown as UnifiedAgentGuildState;
