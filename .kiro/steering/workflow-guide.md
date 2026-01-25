# Traycer Agile Workflow Guide

A collaborative workflow for developing features from idea to implementation through structured clarification.

## Workflow Stages

| # | Stage | Prompt | Output Location |
|---|-------|--------|-----------------|
| 1 | Epic Brief | `@epic-brief` | `.kiro/specs/epic-brief.md` |
| 2 | Core Flows | `@core-flows` | `.kiro/specs/core-flows.md` |
| 3 | PRD Validation | `@prd-validation` | Updates existing specs |
| 4 | Tech Plan | `@tech-plan` | `.kiro/specs/tech-plan.md` |
| 5 | Architecture Validation | `@architecture-validation` | Updates tech-plan |
| 6 | Ticket Breakdown | `@ticket-breakdown` | `.kiro/tickets/TICKET-{n}-{slug}/ticket.md` |
| 7 | Phase Breakdown | `@phase-breakdown` | `.kiro/tickets/TICKET-{n}-{slug}/phases.md` |
| 8 | Plan Mode | `@plan-mode` | `.kiro/tickets/TICKET-{n}-{slug}/plans/PHASE-{m}.md` |
| 9 | Task Mode | `@task-mode` | Updates plan, writes code |
| 10 | Implementation Validation | `@implementation-validation` | Updates plan verification |
| 11 | Pre-commit Review | `@pre-commit-review` | Review findings, ready to commit |
| 12 | Commit | `@commit` | Clean atomic commits (local) |

## Context Flow

```
Epic Brief → Core Flows → Tech Plan
                              ↓
                    Ticket Breakdown
                              ↓
                    Phase Breakdown (per ticket)
                              ↓
                    Plan Mode (per phase)
                              ↓
                    Task Mode (writes code)
                              ↓
                    Implementation Validation
```

## Data Structures (Traycer-Aligned)

### Ticket Fields
| Field | Type | Values |
|-------|------|--------|
| ID | string | `TICKET-{n}` |
| Epic ID | string | `EPIC-1` |
| Status | int | 0=TODO, 1=IN_PROGRESS, 2=DONE |
| Created At | timestamp | YYYY-MM-DD HH:MM |

### Phase Fields
| Field | Type | Values |
|-------|------|--------|
| ID | string | `TICKET-{n}-PHASE-{m}` |
| Size | int | 0=ISSUE, 1=STORY, 2=EPIC |
| Status | int | 0=TODO, 1=IN_PROGRESS, 2=DONE |
| Query | string | Implementation instructions |
| Referred Files | list | Files to read |
| Referred Folders | list | Folders to explore |

### Plan Fields
| Field | Type | Purpose |
|-------|------|---------|
| Parent Plan ID | string | For plan revisions |
| Is Executed | bool | Execution tracking |
| Executed With Agent | string | Which agent ran it |
| AI Generated Summary | string | One-line summary |

### Step Progress (per plan)
| Step | Values |
|------|--------|
| User Query | 0-3 (not started → done) |
| Plan Generation | 0-3 |
| Code Changes | 0-3 |
| Verification | 0-3 |

### Verification Comment Fields
| Field | Type | Values |
|-------|------|--------|
| Title | string | Issue summary |
| Description | string | Full explanation |
| Severity | int | 0=MINOR, 1=MAJOR, 2=CRITICAL |
| Referred Files | list | Affected files |
| Prompt for AI | string | Fix instruction |
| Is Applied | bool | Fix applied? |

## Artifact Storage

```
.kiro/
├── specs/
│   ├── epic-brief.md
│   ├── core-flows.md
│   └── tech-plan.md
└── tickets/
    ├── TICKET-{n}-{slug}/
    │   ├── ticket.md
    │   ├── phases.md
    │   └── plans/
    │       ├── PHASE-1.md
    │       └── PHASE-2.md
    └── steering/
```

> **Key Difference**: Unlike Traycer which stores in SQLite blobs, Kiro saves everything as readable markdown files for version control and collaboration.
