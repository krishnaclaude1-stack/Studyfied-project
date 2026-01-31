# Traycer Database Schema Documentation

Complete analysis of `app-assets.db` SQLite database structure.

## Tables Overview

| Table | Rows | Purpose |
|-------|------|---------|
| **EpicHistory** | 1 | Epic mode sessions (specs, tickets, conversations) |
| **TaskHistory** | 19 | Phase/Plan sessions (phases, tasks, plans) |
| **TicketIndex** | 13 | Index of all tickets across epics |
| **SpecIndex** | 3 | Index of all specs across epics |
| **RepoMapping** | 9 | Git repo ↔ workspace path mappings |
| **WorkspaceSettings** | 31 | Per-workspace agent/template settings |
| **ReviewThreads** | 0 | Code review threads |
| **LostReviewThreads** | 0 | Orphaned review threads |
| **AnalysisHistory** | 0 | Code analysis results |
| **WorkflowHistory** | 0 | Workflow execution history |
| **PersistedTicketLoading** | 0 | Ticket loading state |

---

## EpicHistory (Epic Mode Data)

```
EpicHistory
├── id: string                           # Epic UUID
├── title: string                        # Epic title
├── conversations[]: list<Conversation>  # Chat history
│   ├── id: string                       # Conversation UUID
│   ├── userQuery: UserQuery             # User's input
│   │   ├── type: string
│   │   ├── content[]: ProseMirror nodes
│   │   └── traycerMarkdown: string      # Raw markdown
│   ├── llmInput: EncryptedLLMInput      # ENCRYPTED context to LLM
│   │   ├── data: string (AES-GCM encrypted)
│   │   └── version: int
│   ├── output: EpicOutput
│   │   ├── interviewOutput: {questions[]}  # Clarifying questions
│   │   ├── artifactsOutput: nullable
│   │   └── common: {nextSteps[], preMarkdown, postMarkdown}
│   ├── state: int                       # 0=pending, 1=processing, 2=complete
│   ├── workflow: {type, workflowIdentifier}
│   ├── interviewAnswers[]: {questionId, selectedOptionTexts[], customAnswer}
│   └── logs[]: {codeExplorationToolCallInfo, mcpToolCallInfo}
├── tickets[]: list<Ticket>
│   ├── id: string                       # Ticket UUID
│   ├── title: string
│   ├── description: string
│   ├── status: int                      # 0=TODO, 1=IN_PROGRESS, 2=DONE
│   └── createdManually: bool
├── specs[]: list<Spec>
│   ├── id: string                       # Spec UUID
│   ├── title: string
│   ├── content: string                  # Markdown content
│   └── createdManually: bool
├── deletedSpecs[]: list<Spec>
└── deletedTickets[]: list<{id, title, status, deletedAt}>
```

---

## TaskHistory (Phase/Plan Data)

```
TaskHistory
├── id: string                            # Session UUID
├── title: string                         # Session title
├── displayState: string                  # SHOW_PHASES, etc.
├── activePhaseBreakdownId: string        # FK → phaseBreakdowns[].id
├── workspaces: {workspaceFolders[]}
├── phaseBreakdowns[]: list<PhaseBreakdown>
│   ├── id: string                        # PhaseBreakdown UUID
│   ├── activeTaskId: string              # FK → tasks[].id
│   ├── yoloModeState: nullable
│   ├── prePhaseConversations[]: list<PhaseConversation>
│   │   ├── id: string
│   │   ├── userQuery: UserQuery
│   │   ├── llmInput: EncryptedLLMInput   # ENCRYPTED context
│   │   ├── output: PhaseOutputContainer
│   │   │   ├── markdown: string
│   │   │   ├── phaseOutput: PhaseOutput
│   │   │   │   ├── phases[]: list<Phase> # THE GENERATED PHASES
│   │   │   │   │   ├── id: string        # e.g., "EPIC1-LANDING"
│   │   │   │   │   ├── title: string
│   │   │   │   │   ├── query: string     # Implementation instructions
│   │   │   │   │   ├── reasoning: string # Why this phase structure
│   │   │   │   │   ├── status: int       # 0=TODO, 1=IN_PROGRESS, 2=DONE
│   │   │   │   │   ├── phaseSize: int    # 0=ISSUE, 1=STORY, 2=EPIC
│   │   │   │   │   ├── referredFiles[]: list<FileRef>
│   │   │   │   │   │   ├── relPath: string
│   │   │   │   │   │   ├── workspacePath: string
│   │   │   │   │   │   └── isDirectory: bool
│   │   │   │   │   └── referredFolders[]: list<FileRef>
│   │   │   │   ├── howDidIGetHere: string
│   │   │   │   └── reasoning: string
│   │   │   ├── preMarkdown: string
│   │   │   └── postMarkdown: string
│   │   ├── state: int
│   │   ├── logs[]: list<LogEntry>
│   │   └── interviewAnswers: nullable
│   └── tasks[]: list<Task>               # ONE TASK PER PHASE
│       ├── id: string                    # Task UUID
│       ├── title: string                 # Same as phase title
│       ├── activePlanId: string          # FK → plans[].id
│       ├── steps: StepProgress
│       │   ├── userQuery: int            # 0=not started, 1=pending, 2=running, 3=done
│       │   ├── planGeneration: int
│       │   ├── codeChanges: int
│       │   └── verification: int
│       ├── plans[]: list<Plan>
│       │   ├── id: string                # Plan UUID
│       │   ├── llmInput: EncryptedLLMInput  # ENCRYPTED context
│       │   ├── generatedPlan: GeneratedPlan
│       │   │   ├── implementationPlan: ImplementationPlan
│       │   │   │   ├── output: string    # PLAN MARKDOWN (observations, approach, reasoning)
│       │   │   │   └── aiGeneratedSummary: string
│       │   │   └── reviewOutput: nullable
│       │   ├── queryJsonContent: UserQuery  # Original user query
│       │   ├── planConversations[]: list   # Follow-up chat about plan
│       │   ├── logs[]: list<LogEntry>      # Tool call logs
│       │   ├── isExecuted: bool
│       │   ├── executedWithAgent: string   # Which IDE agent ran it
│       │   ├── parentPlanID: nullable      # For plan revisions
│       │   ├── planArtifactType: int
│       │   └── isQueryExecutedDirectly: bool
│       ├── verification: Verification
│       │   ├── id: string
│       │   ├── verificationOutput: VerificationOutput
│       │   │   ├── markdown: string
│       │   │   └── threads[]: list<Thread>
│       │   │       ├── id: string
│       │   │       ├── status: int
│       │   │       └── comments[]: list<Comment>
│       │   │           ├── id: string
│       │   │           ├── title: string           # Issue summary
│       │   │           ├── description: string     # Detailed explanation
│       │   │           ├── promptForAIAgent: string # Instruction to fix
│       │   │           ├── referredFiles[]: list<{absolutePath, isDirectory}>
│       │   │           ├── severity: int           # 0=minor, 1=major, 2=critical
│       │   │           └── isApplied: bool
│       │   ├── isPayAsYouGo: bool
│       │   ├── logs[]: list<LogEntry>
│       │   └── reverificationState: nullable
│       ├── codeChanges: CodeChanges
│       │   ├── isPayAsYouGo: bool
│       │   └── taskThreads[]: list<TaskThread>  # Applied changes
│       ├── attachmentSummaries[]: list
│       ├── fileSummaries[]: list
│       ├── discardedVerificationComments[]: list
│       └── isReferred: bool
└── isTitleEditedByUser: bool
```

---

## Relationship Map (Foreign Keys in JSON)

```
EpicHistory.id ─────────────────┬──► TicketIndex.epicId
                                └──► SpecIndex.epicId

TaskHistory.activePhaseBreakdownId ──► phaseBreakdowns[].id
phaseBreakdowns[].activeTaskId ──────► tasks[].id
tasks[].activePlanId ────────────────► plans[].id
plans[].parentPlanID ────────────────► plans[].id (for revisions)
```

---

## Context Flow Between Stages

### What Gets Passed to Each Stage

| Stage | Context Included (from proto) |
|-------|------------------------------|
| **Epic Mode** | workspaceRepoMappings, previousConversations |
| **Phase Mode** | userPrompt, workspaceRepoMappings, currentPhaseBreakdownConversation, taskChainTitle |
| **Plan Mode** | userPrompt, allTasks, workspaceRepoMappings, taskTitle, taskChainTitle, **phaseBreakdownsTillCurrent** |
| **Verification** | plan output, code changes, referredFiles |

### Key Insight
Plan Mode receives `phaseBreakdownsTillCurrent` - **all previous phases up to current** - enabling full context inheritance.

---

## Status Enums

| Field | Values |
|-------|--------|
| Ticket/Phase status | 0=TODO, 1=IN_PROGRESS, 2=DONE |
| Step progress | 0=not started, 1=pending, 2=running, 3=done |
| Phase size | 0=ISSUE, 1=STORY, 2=EPIC |
| Severity | 0=minor, 1=major, 2=critical |
| Conversation state | 0=pending, 1=processing, 2=complete |
