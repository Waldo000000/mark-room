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

- one issue at a time, not one issue total
- one focused branch and pull request per issue
- GitHub Issues as the durable delivery state and decision record
- early refinement and splitting of work that is too large or unclear
- low-conflict, independently verifiable slices
- best-judgment decisions when evidence is sufficient and reversal remains
  practical

A run normally advances through multiple focused issues and pull requests.
Completing one per-issue loop does not complete the run. After each merge,
recheck usage, select the next safe issue from updated `main`, and repeat until
a documented stop condition applies.

It may merge its own pull requests after the required checks pass. It does not
bypass branch protection, merge another agent's work, or turn a roadmap issue
into code without first making its delivery scope clear.

### Trigger And Single Question

The user starts this mode by saying "I'm feeling lucky." Do not require a
longer launch prompt or repeat the workflow back to the user.

Before doing any work, ask exactly one question:

```text
At what percentage of your weekly Codex allowance should this run stop?
```

Treat the answer as the run's usage-stop percentage. For example, `50%` means
stop when the account's reported weekly usage is at or above 50%; it does not
mean spend an additional 50 percentage points. Treat a plain number such as
`50` as a percentage.

Do not ask further setup questions: use this workflow, the repository docs,
GitHub Issues, and best judgment to proceed hands-free.

Usage reporting is not a real-time token meter, so a check may observe the
threshold shortly after it is crossed. Recheck at the defined checkpoints and
do not begin another costly step after reaching it.

### Session Settings

Before sending the trigger, start the parent task with `gpt-5.6-sol` at `high`
reasoning. The parent owns issue selection, planning, product and domain
decisions, integration, verification, pull requests, and merges. Do not assume
the run can change its own parent model or reasoning effort after launch.

Set the model and reasoning effort explicitly for every subagent; otherwise a
subagent may inherit the parent's Sol High settings. Use this confidence ladder:

- `gpt-5.6-sol` at `medium` for bounded implementation, debugging, or review
  that still needs strong judgment
- `gpt-5.6-terra` at `medium` for well-specified codebase scans, tests,
  documentation, or isolated implementation with objective done criteria
- `gpt-5.6-luna` at `low` only for mechanical, repetitive work whose output the
  parent can verify cheaply

Use a lower tier only when the parent can state the bounded task, write scope,
expected output, and verification criteria with confidence. When uncertain,
use Sol Medium or keep the work with the Sol High parent.

Give every subagent one question or deliverable. When subagents edit, give them
disjoint file boundaries. Use a read-only sandbox unless editing is necessary.
Keep at most two subagents active concurrently.

Delegation can keep raw exploration, logs, and intermediate work out of the
parent thread and return a concise summary, reducing growth of the expensive
parent context. It does not guarantee lower total token use: every subagent has
its own context and tool calls. Delegate when context isolation, independent
parallel progress, or a confidently lower model outweighs that overhead, not
because spawning an agent is assumed to be cheaper.

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
Do not classify ordinary ambiguity as unsafe before applying Decision Authority.

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
4. Apply Decision Authority to any priority, product, architecture, or
   source-authority choice revealed by the split. Prefer a documented,
   reversible decision that keeps work moving.

The issue and its sub-issues, rather than a repository status document, are the
durable record of the plan.

### Decision Authority

Make the best available decision without waiting for a human when the evidence
is sufficient, the outcome stays within the selected issue, and reversal is
practical. Record material choices with the decision record below so they are
easy to inspect or reverse in the morning.

Stop rather than guessing when a decision requires unavailable authoritative
source material, credentials or external access, changes the release boundary,
or would be expensive to reverse. A human is not a default approval gate for a
safe, well-documented implementation choice.

### Per-Issue Loop

1. Recheck weekly usage. If it is at or above the user-selected usage-stop
   percentage, or usage is unavailable, do not start the issue.
2. Claim the selected issue in a comment with the branch name, intended
   outcome, and conflict scan.
3. Read its owner docs and ADRs. Restate the smallest PR outcome, sailor-facing
   review path, concise implementation plan, delegation boundaries, and
   verification plan in the issue before delegating or editing.
4. Create an isolated branch or worktree. Delegate only bounded supporting work
   that materially reduces uncertainty.
5. Before spawning subagents or beginning another costly phase, recheck usage.
   If the stop percentage has been reached, preserve and push a clear,
   recoverable checkpoint, record the handoff on the issue, and stop.
6. Implement the smallest complete slice. Run targeted checks while developing.
7. Push the exact commit and open a pull request that closes the issue. Include
   tests, screenshots for UI work, documentation, and provenance notes as the
   normal workflow requires.
8. When the exact pushed commit has all required checks green, no unresolved
   blocking review or conflict, and a complete issue decision record, merge the
   agent's own pull request using the repository's configured merge method.
9. Post the closing decision log on the issue. Fetch the updated `main`, remove
   or leave the completed worktree cleanly, return to issue selection, and
   repeat this loop with the next safe issue from the new `main`.

Never begin a second coding issue while the first has uncommitted work, an
unexplained failure, or an unresolved decision.

Never treat one completed issue, green pull request, or successful merge as the
end of the overall run. Those events complete one loop iteration only.

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

Completing an issue or merging a pull request is not a stop condition. Do not
send the run's final response at that boundary; continue the per-issue loop
unless one of the conditions below applies.

Stop after recording a concise GitHub handoff when any of these applies:

- reported weekly usage is at or above the percentage selected by the user at
  the start of the run
- usage cannot be inspected
- no unblocked, low-conflict issue is available after attempting roadmap
  refinement
- credentials, source material, or an external service is needed
- the next decision would be unsafe or expensive to reverse
- an active pull request or branch creates a material conflict
- a pull request is failing and there is no safe, contained fix
- branch protection or a required review prevents the agent's authorized merge

Do not silently skip blocked issues. Record the blocker, its impact, and the
next safe action on the issue or parent roadmap issue before stopping. If a
stop occurs mid-issue, leave all useful work committed and pushed on its branch
with a draft pull request when that makes the checkpoint easier to review.

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

Human approval is required outside explicitly requested "I'm Feeling Lucky"
mode. That mode may merge its own pull request after the required checks pass,
the issue decision record is complete, and branch protection permits it.

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
