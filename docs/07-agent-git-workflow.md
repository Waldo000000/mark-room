# Agent Git Workflow

## Source Of Truth

GitHub is the permanent project memory. ChatGPT and Codex conversations are temporary working spaces.

GitHub owns all live planning and delivery state:

- milestones preserve release scope and order
- `roadmap` issues describe broad product outcomes
- area labels such as `browse`, `quiz`, `editor`, and `derive` group enduring
  product streams
- `ready` issues are small, sufficiently defined slices suitable for one PR
- sub-issues decompose roadmap outcomes
- issue dependencies express blocking order
- pull requests and checks show work in progress
- Git history shows what shipped

Do not maintain a Markdown roadmap, backlog status list, current commit, merged
PR list, or next-work ledger. Durable product constraints and architecture still
belong in owner docs and ADRs.

## Selecting The Next Issue

When resuming in a fresh session:

1. Inspect open pull requests and avoid duplicating active work.
2. Query open `ready` issues and their milestones, dependencies, and linked
   work.
3. Choose the lowest-numbered unblocked `ready` issue unless the user changes
   priority.
4. Read only the owner docs and ADRs relevant to that issue.
5. Restate one title-sized PR outcome, its sailor-facing review path, and its
   verification needs before implementation.

If no `ready` issue is suitable, inspect `roadmap` issues in the earliest open
milestone and propose a small sub-issue. Add `ready` only when its scope,
dependencies, and sailor-facing done criteria are clear.

Use milestones for release scope rather than labels. Use area labels for
product streams rather than priority. A GitHub Project is intentionally deferred
until custom priority fields, dates, iterations, or a cross-repository view
would justify its maintenance cost.

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
- `Closes #<issue>` for its linked issue
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
- let the merged PR close its issue
- create focused follow-up issues instead of recording work in Markdown
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
