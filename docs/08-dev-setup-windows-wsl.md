# Development Setup

MarkRoom uses Node 24 and npm. Native Windows, WSL2, macOS, and Linux are all
supported; contributors can keep the repository in the filesystem that best
fits their tools.

## Prerequisites

- Git
- Node 24, selected from `.nvmrc` with a version manager where convenient
- npm, distributed with Node
- a Chromium browser for Playwright

On Windows, native PowerShell is a supported default. WSL2 remains a good
option for contributors who prefer Linux tooling, but it is not required.

## First Run

```bash
git clone git@github.com:<owner>/mark-room.git
cd mark-room
npm ci
npx playwright install chromium
npm run check:project
npm test
npm run dev
```

Open `http://localhost:3000` in a browser.

## Full Local Verification

```bash
npm run check:project
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

`npm run check:project` keeps the selected Node version, package manager, CI
configuration, Vercel framework preset, and documentation aligned.

## Codex Operating Notes

Use Codex as the main engineering cockpit. It can manage tasks and worktrees
while durable state remains in Git. Do not store project decisions only in chat
memory.
