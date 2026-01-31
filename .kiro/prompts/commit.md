# Commit

Review changes and create clean git commits.

**Prerequisites**: Changes validated by `@pre-commit-review`  
**Output**: Clean atomic commits (local only)

---

Review the changes and create atomic commits based on the intended behavior.

## Process

1. Review all diffs since last commit
   ```bash
   git status
   git diff HEAD
   ```

2. Identify logical units - split unrelated changes into separate commits

3. Use partial/hunk staging when files contain multiple logical changes
   ```bash
   git add -p <file>
   ```

4. Write single-line commit messages describing WHAT changed
   ```bash
   git commit -m "Add user authentication middleware"
   ```

## Constraints

- Exclude temporary/non-essential files
- Update .gitignore only if necessary
- Commit locally only (no push)
- Keep commit messages clear and concise - one line each
- Do NOT add Co-authored-by lines in commit messages

## Commit Message Format

```
<type>: <description>

Types: feat, fix, refactor, docs, test, chore
```

Examples:
- `feat: Add user authentication middleware`
- `fix: Handle null response in payment service`
- `refactor: Extract validation logic to helper`

Execute the commits now.
