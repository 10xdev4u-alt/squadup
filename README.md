# SquadUp ⚡

Hackathon team-formation + execution platform for [Your College]. Find the right
teammates (swipe for solo↔solo, directory requests for solo→team) **and** actually ship
once the team exists (kanban, resources, mentor tickets).

## Files that matter

| File | Role |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- || `.github/ISSUE_TEMPLATE/task.yml` | One issue = one task. Branch name + research note live here. |
| `.github/pull_request_template.md` | PR body contract. |
| `.github/workflows/ci.yml` | Build + lint on every PR (activates once the app scaffold lands). |
| `.githooks/commit-msg` | Strips AI trailers + enforces Conventional Commits with ≤6-word subjects. **The gate that can't be clicked past.** | | `.husky/` | Pre-commit hook: lint-staged (Prettier) + `npm run typecheck` + `npm run test` (vitest, TDD-enforced). Delegates commit-msg to `.githooks/commit-msg`. |
| `landing.html` | Professional landing page on the exact §6 tokens (published on postplan). |
| `squadup.html` | Earlier creative concept page (dark neon exploration). |

## How the loop works (short version)

1. Open a task issue (template above). The agent researches, writes a **Research Note**,
   and stops at **Gate 1** — no branch until you reply `APPROVED`.
2. Agent branches, codes TDD-first (failing test → minimal code) in small Conventional Commits (no AI trailers, ≤6-word subjects), pushes, opens a
   PR, and stops at **Gate 2**.
3. **You** review the diff line by line, approve, and merge with a merge commit
   (`--no-ff`). The agent never merges. Ever.

Full detail: `AGENTS.md` (kept local-only, see below).

> **Local-only, never pushed:** `PROPOSAL.md` (the constitution) and `AGENTS.md`
> (agent operating rules) are gitignored working docs — agents read them from disk,
> they are not part of this repository.

## One-time setup

```bash
# 1. Author identity (commits are authored by YOU only)
#    Already configured in this repo: 10xdev4u <10xdev4u@gmail.com>
# git config user.name "Your Name"
# git config user.email "your@email.com"

# 2. Install dev tooling (npm install runs the `prepare` script → activates Husky)
npm install
#    Husky owns core.hooksPath; .husky/commit-msg delegates to .githooks/commit-msg
```

Create the status labels (Settings → Labels), or the issue form will fail on unknown labels:
`status:researching` · `status:approved` · `status:in-progress` · `status:review` · `status:blocked` · `status:done`

After pushing to GitHub, protect `main` in repo settings:

- ✅ Require a pull request before merging
- ✅ Require approvals: 1
- ✅ Require conversation resolution before merging
- ✅ Require status checks: build, lint
- ✅ Do not allow bypassing the above settings
- ❌ Allow squash merging (uncheck)
- ❌ Allow rebase merging (uncheck)
- ✅ Allow merge commits (only this)
- ✅ Automatically delete head branches

## Status

- [x] Bootstrap (this repo) + concept/landing pages
- [ ] Phase 2 · Foundation: PocketBase collections + Next.js scaffold + OTP auth
- [ ] Phase 3 · Matchmaking
- [ ] Phase 4 · Workspace Core
- [ ] Phase 5–8 · Resources, Mentorship, Admin, Beta — see `PROPOSAL.md §11`
