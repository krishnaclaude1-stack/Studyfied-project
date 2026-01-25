# Ticket Breakdown

Turn specs into coarse, actionable tickets.

**Prerequisites**: Read `.kiro/specs/epic-brief.md`, `.kiro/specs/core-flows.md`, and `.kiro/specs/tech-plan.md`  
**Next steps**: `@implementation-validation`

---

## Processing User Request

> **Brownfield Codebase**: For existing codebases, spawn the `code-researcher` subagent first to understand the current architecture, patterns, and conventions before creating tickets.

1. **Check for existing tickets** in `.kiro/tickets/`:
   - If tickets exist → **Update mode**: Add new tickets, update changed ones, keep completed ones
   - If no tickets → **Create mode**: Fresh breakdown from specs

2. Infer the area to prioritize for tickets from the arguments (backend, frontend, entire epic).

3. Review specs (Epic Brief, Core Flows, Tech Plan) and identify natural work units.

4. **If updating existing tickets:**
   - Compare specs against existing tickets
   - Identify gaps: work in specs not covered by tickets
   - Identify changes: tickets that need updates due to spec changes
   - Preserve completed tickets (Status: DONE) - don't modify them
   - Mark obsolete tickets if scope was removed from specs

5. Apply best judgment to create/update ticket breakdown:

   **Consider:**
   - How to group work (by component, by flow, by layer)
   - What dependencies exist between pieces of work
   - What order makes sense for implementation

   **Prefer coarse groupings:**
   - Group by component or layer, not by individual function
   - Group by flow, not by step
   - Each ticket should be story-sized - meaningful work, not a single function

   **Anti-pattern:** Do NOT over-breakdown. The minimal least set of tickets is better than multiple small ones.

4. Draft tickets using best judgment:

   For each ticket:
   - **Title**: Action-oriented
   - **Scope**: What's included, what's explicitly out
   - **Spec references**: Link to relevant Epic Brief, Core Flows, Tech Plan sections
   - **Dependencies**: What must be completed first (if any)

5. Present the proposed ticket breakdown to the user.

   Use a mermaid diagram to visualize ticket dependencies for quick reference.

6. After presenting, offer refinement options (whatever are applicable and make sense):

   - Change ticket granularity (combine related work or split for parallel work/clarity)
   - Reorganize dependencies or implementation order
   - Different grouping approach (by component, by flow, etc.)

7. Iterate based on feedback until the breakdown is right.

**Save each ticket to `.kiro/tickets/TICKET-{n}-{slug}/ticket.md`**

> **Folder naming**: Use lowercase slug from title (e.g., `TICKET-1-project-setup/`)

## Ticket Template

```markdown
# TICKET-{n}: {Title}

## Metadata
| Field | Value |
|-------|-------|
| **ID** | `TICKET-{n}` |
| **Epic ID** | `EPIC-1` |
| **Created At** | {YYYY-MM-DD HH:MM} |
| **Status** | TODO (0) \| IN_PROGRESS (1) \| DONE (2) |
| **Size** | ISSUE (0) \| STORY (1) \| EPIC (2) |

## Description
{Brief description of what this ticket accomplishes}

## Scope
What's included in this ticket.

## Out of Scope
What's explicitly not included.

## Spec References
- Epic Brief: {relevant section}
- Core Flows: {relevant flow}
- Tech Plan: {relevant component}

## Dependencies
- TICKET-X (if any)

## Acceptance Criteria
- [ ] Criteria 1
- [ ] Criteria 2

## Next Steps
- **ISSUE (small)**: Skip phases → `@plan-mode TICKET-{n}` directly
- **STORY/EPIC (medium+)**: `@phase-breakdown TICKET-{n}` first
```
