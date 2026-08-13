# SquadUp

> Team formation and execution platform for your college — find the right teammates, then ship together.

[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Development](#development)
  - [Branching Strategy](#branching-strategy)
  - [Commit Convention](#commit-convention)
  - [Pull Request Workflow](#pull-request-workflow)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

SquadUp is a hackathon team-formation and execution platform designed for college students. It bridges the gap between finding the right teammates and actually shipping a product by combining:

- **Matchmaking** — swipe for solo-to-solo connections, directory requests for solo-to-team joins
- **Workspace** — kanban boards, resource sharing, and mentor ticket management

Live concept page: https://2lzhyuiw0cms.postplan.dev

---

## Features

| Feature            | Description                                        |
| ------------------ | -------------------------------------------------- |
| Solo Matchmaking   | Swipe-based matching for solo developers           |
| Team Requests      | Directory-based requests to join existing teams    |
| Kanban Boards      | Task management with drag-and-drop workflow        |
| Resource Hub       | Shared resources and documentation                 |
| Mentor Tickets     | Request guidance from experienced mentors          |
| OTP Authentication | College email verification with one-time passwords |

---

## Architecture

```
+-------------------------------------------------------------+
|                        Frontend                              |
|         (Next.js 14, Page Router, TypeScript)                |
+-----------------------------+-------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                         API + Auth                           |
|                     (PocketBase, self-hosted)                |
+-----------------------------+-------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                       Database                               |
|               (SQLite, built into PocketBase)                |
+-------------------------------------------------------------+
```

---

## Getting Started

### Prerequisites

- Node.js >= 18.17.0
- npm >= 9.0.0
- Git >= 2.40.0
- PocketBase (latest release)

### Installation

```bash
# Clone the repository
git clone https://github.com/10xdev4u-alt/squadup.git
cd squadup

# Install dependencies (also activates the Husky hooks)
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# PocketBase instance URL
NEXT_PUBLIC_PB_URL=http://127.0.0.1:8090
```

The full environment contract (OTP mailer settings, production PocketBase wiring) lands with the deploy-prep milestone.

---

## Project Structure

```
squadup/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   └── task.yml           # Task issue template (branch name + research note)
│   ├── pull_request_template.md
│   └── workflows/
│       └── ci.yml             # CI pipeline (build + lint on every PR)
├── .githooks/
│   └── commit-msg             # Commit law validator (conventional, <=6 words)
├── .husky/
│   ├── pre-commit             # lint-staged + typecheck + tests
│   └── commit-msg             # Delegates to .githooks/commit-msg
├── components/
│   └── Layout.tsx             # Shared page shell
├── pages/                     # Next.js pages (Page Router)
│   ├── _app.tsx
│   ├── _document.tsx
│   ├── index.tsx              # Landing
│   └── discover.tsx           # Match deck placeholder
├── pb_hooks/                  # PocketBase JS hooks (integrity rules, domain gate)
├── pb_migrations/             # Schema-as-code collections (versioned)
├── public/
├── styles/
│   └── globals.css            # Tailwind base
├── types/                     # Domain model contracts (compile-time type tests)
├── landing.html               # Concept page
├── squadup.html               # Concept page
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── next.config.mjs
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

---

## Development

### Branching Strategy

```
main ──────────────────────────────────────────►
         │
         ├─────> feat/<short-description>
         ├─────> fix/<short-description>
         └─────> chore/<short-description>
```

Branch naming convention: `<type>/<short-description>`. One branch per issue, no bundling; the linked issue carries the spec reference and research note.

Examples:

```bash
git checkout -b feat/matching-swipe-deck
git checkout -b fix/auth-redirect-loop
git checkout -b chore/foundation-ci
```

### Commit Convention

All commits MUST follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

**Types:**

| Type       | Description                |
| ---------- | -------------------------- |
| `feat`     | New feature                |
| `fix`      | Bug fix                    |
| `docs`     | Documentation only         |
| `style`    | Formatting, no code change |
| `refactor` | Code restructuring         |
| `perf`     | Performance improvement    |
| `test`     | Adding or updating tests   |
| `chore`    | Maintenance tasks          |
| `revert`   | Reverting changes          |

**Rules:**

- Subject line: maximum 6 words, lowercase, no period
- Use imperative mood ("add" not "added")
- No AI co-author trailers
- Reference the issue in the footer: `Refs #123`

**Valid Examples:**

```
feat(auth): add OTP verification flow
fix(dashboard): resolve chart rendering bug
docs(readme): update installation steps
```

**Invalid Examples:**

```
Fixed the login bug               # No type, past tense
Added new feature for auth        # Past tense, more than 6 words
WIP: working on something         # WIP not allowed
```

### Pull Request Workflow

Every issue runs through two human gates: approval to start, and review before merge.

```
+---------------+     +---------------+     +---------------+
|  issue open   |     |   research    |     |   branch      |
|  + research   |---->|   note, Gate  |---->|   created     |
|  note         |     |   1 approve   |     |   (worktree)  |
+---------------+     +---------------+     +---------------+
                                                    |
                                                    v
+---------------+     +---------------+     +---------------+
|  human merges |<----|  Gate 2       |<----|  TDD slices + |
|  (merge only) |     |  review       |     |  push + PR    |
+---------------+     +---------------+     +---------------+
```

**PR Requirements:**

1. Title follows the commit convention
2. Branch linked to its issue
3. Research note approved at Gate 1
4. All checks pass (tests, typecheck, build)
5. Gate 2 review walks the seven pillars
6. Human merges with a merge commit

**Merge Strategy:** merge commits only (`--no-ff`). Squash merges and force-pushes are banned.

---

## Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run type checking
npm run typecheck

# Run linting
npm run lint
```

Tests are written test-first (TDD). Behavior slices are listed in the issue research note before any implementation starts.

---

## Deployment

### CI/CD Pipeline

The CI pipeline runs on every pull request:

1. Installs dependencies
2. Builds the application
3. Runs linting

Typecheck and tests gate locally through the pre-commit hook; the full four-step CI gate is wired in as part of the foundation CI milestone.

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start

# Deploy to Vercel
vercel --prod
```

---

## Contributing

1. Pick an issue from the board (`status:backlog` label)
2. The research note is written; wait for Gate 1 approval
3. Create your branch from `main` following the branching strategy
4. Commit your changes following the commit convention (test-first)
5. Open a Pull Request linked to the issue
6. Wait for Gate 2 review and approval
7. Squash merges are disabled — the human merges with a merge commit

---

## License

MIT — a LICENSE file will be added before public release.

---

**Maintained by:** 10xdev4u <10xdev4u@gmail.com>
