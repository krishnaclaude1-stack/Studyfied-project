# Implementation Validation

Validate implementation against specs (Epic Brief, Tech Plan, Tickets). Review for alignment and correctness.

**Prerequisites**: Read specs in `.kiro/specs/` and tickets in `.kiro/tickets/`

---

## Role

Careful reviewer who checks if what was built matches what was planned, and if it works correctly.

> **Brownfield Codebase**: For existing codebases, spawn the `code-researcher` subagent to trace how the implementation integrates with surrounding code and identify any pattern violations.

**Focus on:**
- Evidence over assumption - cite specific code and spec references
- Advisory not authoritative - present findings, let user decide actions
- Severity matters - distinguish blockers from minor observations
- Practical focus - catch real issues, not pedantic nitpicks

## Core Philosophy

Implementation validation answers two questions:

1. **Alignment**: Does the code match what was planned in the specs?
2. **Correctness**: Does the code actually work? Are there bugs or gaps?

The specs (Epic Brief, Tech Plan, Tickets) represent deliberate planning decisions. Deviations aren't automatically wrong, but they should be conscious choices, not accidents.

This is not a generic code review. It's a focused check against planned work.

## Issue Classification

**Blockers** - Must address before completion:
- Broken functionality that prevents core features from working
- Major spec deviations that conflict with requirements
- Security concerns (auth bypass, data exposure, injection vulnerabilities)
- Data corruption or loss risks

**Bugs** - Should fix:
- Logic errors that produce incorrect results
- Incorrect behavior that doesn't match acceptance criteria
- Broken flows or error paths

**Edge Cases** - Clarify and decide:
- Unhandled scenarios that could cause failures
- Missing validations at boundaries
- Error conditions without graceful handling

**Observations** - Note for awareness:
- Minor concerns or potential improvements
- Code quality suggestions
- Things that work but could be better

**Validated** - Confirm what's working:
- Implementation aligns with specs
- Acceptance criteria met
- Code behaves as expected

## Processing User Request

### 1. Identify Scope

Determine what to validate from the provided arguments:
- Specific ticket(s) to validate
- Or the entire implementation across all tickets

### 2. Gather Context

Read the relevant specs that govern this implementation:
- **Epic Brief**: Overall goals, requirements, success criteria
- **Tech Plan**: Architectural decisions, patterns, technical approach
- **Tickets**: Specific requirements, acceptance criteria, implementation details

Read the implementation code:
- Use git diff to identify what changed, or
- Review the specific files/areas mentioned in tickets

### 3. Alignment Analysis

Compare implementation against specs:
- Are the requirements from tickets implemented?
- Does the architecture follow the Tech Plan?
- Are acceptance criteria met?
- Any deviations from what was planned? (Note: deviations may be justified)

### 4. Correctness Analysis

Review the implementation for:
- **Bugs**: Logic errors, incorrect behavior, broken flows
- **Edge cases**: Unhandled scenarios, missing validations, boundary conditions
- **Error handling**: Are failures handled gracefully?
- **Logic soundness**: Does the code do what it's supposed to do?

### 5. Present Findings and Ask for Direction

In a single response:

**Present findings** organized by importance - blockers first, then bugs, edge cases, and observations.


**Update status based on validation results**:

If **no blockers or critical issues** found:
1. Update plan file:
   - Set `Is Executed: true`
   - Set Step Progress → Verification to ✅ Done (3)
2. Update phases.md:
   - Set current phase `Status: DONE (2)`
3. Check if all phases complete:
   - If all phases have `Status: DONE` → Update ticket.md `Status: DONE (2)`

If **blockers found**:
- Keep current status as `IN_PROGRESS (1)`
- Document issues in Verification Threads
- Wait for fixes before updating status

**Ask for direction** on how to handle the issues found:
- Which issues should become separate bug tickets
- Which issues should be noted on existing tickets
- Which deviations are intentional and should be documented
- **Which issues should be discarded** (won't fix, defer, out of scope)
- Which items can be deferred vs. must be addressed now

### 6. Execute Based on Direction

Based on user guidance:
- Create bug tickets for issues that need separate tracking
- Add notes to existing tickets for observations or minor issues
- Document accepted deviations or trade-offs
- **Add discarded issues to plan's "Discarded Verification Issues" section**
- Update any additional ticket statuses as directed

### 7. Confirm Completion

Once actions are taken:
- Summarize what was validated and what actions were taken
- Confirm which tickets are complete vs. need follow-up
- Note any accepted trade-offs or deferred concerns

## What Good Validation Looks Like

- Findings are specific and actionable, not vague
- Code locations are referenced so issues can be found
- Importance is calibrated - not everything is a blocker
- Spec references show why something is a deviation
- User sees the full picture and guides how to handle issues

---

## Verification Thread Output Format

When recording verification findings, update the plan file's Verification Threads section:

```markdown
## Verification Threads

### Thread 1: {Issue Area}

#### Comment 1

| Field | Value |
|-------|-------|
| **Title** | {Issue summary} |
| **Description** | {Detailed explanation of the issue} |
| **Severity** | MINOR (0) \| MAJOR (1) \| CRITICAL (2) |
| **Referred Files** | `path/to/file.ts`, `path/to/another.ts` |
| **Prompt for AI** | {Instruction for AI agent to fix this issue} |
| **Is Applied** | ⬜ No \| ✅ Yes |

#### Comment 2
...

### Thread 2: {Another Issue Area}
...
```

**Severity Reference**:
| Severity | Value | Description |
|----------|-------|-------------|
| MINOR | 0 | Code quality, minor improvements |
| MAJOR | 1 | Bugs, incorrect behavior, edge cases |
| CRITICAL | 2 | Blockers, security issues, data loss risks |

**After user direction, update**:
1. `Is Applied` to ✅ Yes when fixes are made
2. Plan file's Step Progress → Verification to ✅ Done (3)
3. Ticket status if all phases verified

