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

## I'm Feeling Lucky Mode

"I'm Feeling Lucky" mode is the explicit, hands-free version of this workflow.
Use it only when the user asks Codex to progress through the GitHub Issues queue
unattended, for example overnight.

It optimizes for steady, reviewable progress rather than maximum throughput:

- one issue at a time
- one focused branch and pull request per issue
- GitHub Issues as the durable delivery state and decision record
- early refinement and splitting of work that is too large or unclear
- low-conflict, independently verifiable slices
- a stop between issues when the next safe decision needs a human

It does not merge pull requests, override the project's normal approval rules,
or turn a roadmap issue into code without first making its delivery scope clear.

### Trigger

Start the session with a prompt like this:

```text
Run I'm Feeling Lucky mode for MarkRoom. Work hands-free through one GitHub
issue at a time. Follow AGENTS.md and docs/07-agent-git-workflow.md. Use GitHub
Issues and issue comments as the source of truth. Before starting each new
issue, check Codex usage; do not start another issue when weekly usage is at or
above 50%, or if usage cannot be checked. Do not merge main. Stop and leave a
clear GitHub handoff when blocked or when a decision needs me.
```

Replace `50%` with another cap when desired. The cap is a start-next-issue
guardrail, not a real-time hard stop: an issue already in progress may take
usage beyond the threshold before its next check.

### Session Settings

Use a strong parent agent for selecting work, making product or domain choices,
integrating changes, and opening pull requests. Use `medium` reasoning as the
default, and increase it only for ambiguous cross-cutting work.

Delegate bounded, read-heavy, repeatable, or independent tasks to less costly
subagents. Good examples are a targeted codebase scan, a test-gap review, a
documentation check, or a narrow provenance search. Give every subagent a
single question, the files or issue it concerns, an expected output, and a
read-only sandbox unless it truly needs to edit.

Keep concurrent subagents low. They reduce elapsed time but do not inherently
reduce token use, because each receives its own context and tools. Prefer one
or two concise subagents only when their answers remove real uncertainty.

### Issue Selection

Before taking work, inspect open pull requests, active worktrees or branches,
and open issues. Then:

1. Prefer the lowest-numbered unblocked `ready` issue.
2. Prefer issues with a narrow ownership boundary and a clear sailor-facing
   review path.
3. Avoid work likely to collide with an active pull request, especially shared
   schemas, global styles, dependencies, lockfiles, CI, and root documents.
4. If no `ready` issue is suitable, inspect the earliest relevant `roadmap`
   issue and refine it into one or more small sub-issues. Do not begin coding
   the broad issue in the same step unless the resulting slice is plainly
   independent and ready.

If no safe issue exists, record why on the relevant issue and stop. Waiting is
better than fabricating parallelism or creating a conflict for the next agent.

### Refining Larger Issues

Treat an issue as too large when it has multiple independently reviewable
outcomes, crosses several ownership boundaries, lacks sailor-facing done
criteria, or cannot fit one title-sized pull request.

Before coding a large or ambiguous issue:

1. Comment with the inferred outcome, assumptions, likely files, smallest
   sailor-facing proof, and verification needs.
2. Create focused sub-issues for independently deliverable pieces, with clear
   dependencies and `ready` only where the scope is sufficient.
3. Link the sub-issues to the parent and select one unblocked child.
4. Stop after refinement if the split reveals a meaningful priority, product,
   architecture, or source-authority choice that needs human direction.

The issue and its sub-issues, rather than a repository status document, are the
durable record of the plan.

### Per-Issue Loop

1. Recheck usage. If the cap is reached or usage is unavailable, do not start
   the issue.
2. Claim the selected issue in a comment with the branch name, intended
   outcome, and conflict scan.
3. Read its owner docs and ADRs. Restate the smallest PR outcome, sailor-facing
   review path, and verification plan in the issue.
4. Create an isolated branch or worktree. Delegate only bounded supporting work
   that materially reduces uncertainty.
5. Implement the smallest complete slice. Run targeted checks while developing.
6. Push the exact commit and open a pull request that closes the issue. Include
   tests, screenshots for UI work, documentation, and provenance notes as the
   normal workflow requires.
7. Post the closing decision log on the issue, then return to issue selection.

Never begin a second coding issue while the first has uncommitted work, an
unexplained failure, or an unresolved decision.

### Decision Record

Use an issue comment for every material decision. Keep it short and reversible
where possible:

```text
Codex decision log:
- Decision: <what changed or was chosen>
- Reasoning: <evidence and trade-off>
- Alternatives not taken: <briefly>
- Reversal cost: low | medium | high
- Follow-up: <issue, PR, or none>
```

The final comment for an issue should link the pull request and state what was
verified, what remains uncertain, and the next safe action. This is the
morning-review list: the user can inspect GitHub Issues to see the choices made
without reconstructing them from chat history.

### Stop Conditions

Stop after recording a concise GitHub handoff when any of these applies:

- the weekly usage cap has been reached before a new issue begins
- usage cannot be inspected
- no unblocked, low-conflict issue is available
- credentials, source material, or an external service is needed
- the next step needs a product, architecture, legal, provenance, or domain
  ruling that the agent cannot safely make
- an active pull request or branch creates a material conflict
- a pull request is failing and resolving it requires a human choice
- the remaining work would require merging or bypassing review

Do not silently skip blocked issues. Record the blocker, its impact, and the
next safe action on the issue or parent roadmap issue before stopping.

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
