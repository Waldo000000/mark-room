# Agent Git Workflow

## Source Of Truth

GitHub is the permanent project memory. ChatGPT and Codex conversations are temporary working spaces.

## Branching

Use protected `main`.

Every change should happen on a branch and enter `main` through a pull request.

Suggested branch names:

- `feature/<issue-number>-short-name`
- `fix/<issue-number>-short-name`
- `docs/<issue-number>-short-name`
- `corpus/<issue-number>-short-name`
- `spike/<issue-number>-short-name`

## Worktrees

Parallel agents should use one worktree per issue or PR.

Each worktree should have:

- one branch
- one focused task
- independent test runs
- no unrelated refactors

Avoid multiple agents editing the same shared files at the same time unless the work is coordinated.

High-collision files:

- `package.json`
- lockfile
- root docs
- scenario schema files
- global styles
- CI workflows

## PR Requirements

A PR needs:

- concise summary
- linked issue or task
- screenshots for UI
- tests run
- docs updated
- corpus provenance notes when relevant
- known limitations

Substantive PRs should get a second agent review when practical.

Human approval is required for every merge initially.

## Cleanup

After merge:

- delete the branch if no longer needed
- remove stale worktrees
- check for follow-up issues
- ensure durable decisions are captured in docs or ADRs

## Agent Review Stance

Reviews should prioritize:

- correctness bugs
- schema drift
- missing validation
- mobile usability regressions
- test gaps
- hidden reliance on conversation-only context
- overcomplicated abstractions
