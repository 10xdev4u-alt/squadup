# Branch Protection — main

One-time manual setup in GitHub repo settings (Settings > Branches > Add branch protection rule). The pipeline is two-gated: Gate 1 = issue APPROVED, Gate 2 = CI green + human merge. CI is a hard gate; approval is the human, not a checkbox.

## Rule

Protect branch: `main`

**Required checks**

- [x] Require status checks to pass before merging
- [x] Status checks that are required: `Gate`

**Merging**

- [x] Require a pull request before merging (2 approving reviews NOT required — the maintainer's review is the human gate)
- [x] Do not allow merging without a pull request (no direct pushes to main)
- [x] Allow merge commits (the pipeline rule — never squash, never rebase)

**Force pushes**

- [x] Do not allow force pushes
- [x] Do not allow deletions

## Why

- One issue = one branch = one PR; every PR runs the full `Gate` (typecheck, test, lint, build). A red step blocks merge automatically.
- Merge-commits-only preserves history (PR #2, #29, #30, #31, #32, #33, #34, #35, #36, #38 are all merge commits).
- No force push and no deletions keep history append-only — a hard rule of the pipeline.
