# Agent Git Workflow

## Source Of Truth And Scope

GitHub owns live delivery state: issues and milestones describe planned work,
`ready` marks defined slices, sub-issues/dependencies express blocking, and PRs
and checks show work in progress. Git history owns what shipped. Owner docs and
ADRs hold durable decisions, not copied commit/PR lists or next-work ledgers.

Start with open PR summaries, then unblocked `ready` issues in number order
unless the user reprioritizes. Read only the selected issue and relevant docs.
Continue existing work rather than opening a duplicate.

A roadmap's "likely capabilities" are possibilities, not blanket authorization
to build every feature. Before refinement, identify a demonstrated user problem
and the smallest current mechanism that solves it. Apply YAGNI to new state,
persistence, history, management UI and abstractions. Routine implementation
choices stay autonomous; optional new product scope needs evidence. Do not add
`ready` merely because an agent has written acceptance criteria for its own idea.

Keep one coherent outcome per PR. Split independently useful outcomes, but do
not fragment a small feature's necessary validation/reference cleanup into
separate PRs merely to minimize line count. Internal workflow changes do not
need an invented sailor-facing screen.

## Normal Delivery

1. Check conflicts and select the issue. Record the branch, outcome and any
   material decision once in a short issue comment; do not repeat the body.
2. Use a dedicated `codex/<issue>-short-name` branch or isolated worktree.
   Parallel editors need disjoint ownership; preserve all unrelated changes.
3. Implement the smallest complete slice. Follow the targeted local verification
   ladder in [the testing strategy](06-testing-strategy.md).
4. Push to the configured repository and open a focused PR closing the issue.
   Its description owns the final outcome and verification evidence.
5. Read the exact pushed commit's required checks. Prefer a bounded watch/wait
   with change-only output and backoff to repeated model-driven status polls.
   After a failure, read the failing step once and rerun only what diagnoses it.
6. Merge only with the required approval, green exact-commit checks and no
   unresolved blocker. Fetch updated main and leave the checkout clean.

One scope/decision comment plus the PR is enough for a routine change. Add an
issue comment when a material choice changes, a blocker needs a handoff, or an
unattended run finishes the issue; link the PR's tests instead of duplicating
its narrative. Optional PR sections may be omitted rather than filled with
repeated "not applicable" text.

A compact decision record is: **choice; evidence/trade-off; reversal cost;
follow-up if any**. Do not repeat unchanged alternatives and reasoning at every
checkpoint. GitHub remains sufficient for morning review.

## Delegation And Context

Default to local work for a routine, contained change. Use a subagent only for
an independent deliverable while the parent can make useful progress elsewhere.
State its question, file ownership, expected output and verification boundary.
Use minimal context; do not fork an entire overnight history for a small task.
Do not have parent and agent independently repeat the same tests or exploration.

An independent review is valuable for schemas/provenance, sailing geometry,
persistence migrations, cross-gesture state, destructive operations or a
substantial multi-file change. It is not mandatory for a simple label, small
control, documentation edit or obvious local fix. Select the risk to review;
one bounded pass normally suffices. Re-review only the changed risk or unresolved
finding, not the entire implementation after each patch.

Keep at most two subagents active concurrently. For an authorized Lucky run,
retain the existing user-selected parent profile (`gpt-5.6-sol`, high, unless
the user selected otherwise). The run cannot assume it can change its parent
profile. When delegating, set model/effort explicitly:

- Sol Medium for bounded work requiring judgment.
- Terra Medium for objectively specified scans, tests, docs or isolated edits.
- Luna Low for mechanical work whose output is cheap to verify.

Use the lower tier only when the task and checks are clear; otherwise work
locally or use Sol Medium. Delegation may isolate context but does not guarantee
lower total usage. Do not change global app settings or install new orchestration
to avoid a small amount of routine work.

Read each owner once per session and use narrow excerpts thereafter. Start a
fresh session per PR when the user is managing sessions. In a continuing
unattended run, keep handoff/context focused on the active issue and reusable
constraints, not a cumulative retelling of every merged PR. Do not create new
user-visible tasks or assume a session reset without user authorization.

## I'm Feeling Lucky Mode

The explicit "I'm feeling lucky" request starts a hands-free multi-issue loop.
Ask once: **At what percentage of your weekly Codex allowance should this run
stop?** Use an already supplied answer. This is an absolute reported weekly-used
percentage, not an additional allowance. No further routine setup questions.

The trigger authorizes normal repository-scoped commits, pushes and PR evidence
to the `origin` configured at launch throughout the run. It also authorizes
merging only the run's own PRs after required exact-commit checks pass and the
issue decision record is complete. It does not authorize a different destination,
secrets, unrelated user files, bypassing protection or another agent's merge.

### Loop

1. Inspect usage before selecting an issue. Stop if it is unavailable or at the
   user's threshold. Select confirmed, unblocked work from updated main.
2. Apply the normal delivery process. If no ready issue fits, inspect the earliest
   relevant roadmap and do one bounded refinement pass. Prefer confirmed needs
   and correctness fixes; defer optional agent-proposed features with a reason.
3. Check usage before delegation or another costly phase. If the threshold has
   been reached, preserve a clear committed/pushed checkpoint, record the issue
   handoff and stop. Usage reporting can lag; do not treat it as a real-time meter.
4. After its own green PR merges, leave a brief issue completion comment linking
   the PR and any new uncertainty. Fetch main, recheck usage and repeat.

One issue at a time is sequencing, not a one-issue run limit. A merge alone is
not a stop condition, but unused allowance is not a target to consume: do not
invent scope to keep the loop going. Do not start a second coding issue with
uncommitted work or an unresolved failure in the first.

### Decision Authority And Stops

Make contained, reversible implementation decisions from available evidence and
record material trade-offs. Do not default to asking the user for permission
for routine choices. During unattended work, defer an optional requirement
whose value is unconfirmed instead of implementing an elaborate guess.

Stop with a concise GitHub handoff when:

- usage is unavailable or at/above the requested threshold;
- no confirmed, unblocked, low-conflict work remains after bounded refinement;
- a necessary decision needs unavailable authoritative sources, credentials,
  external access, a release-boundary change or an expensive-to-reverse choice;
- active work materially conflicts, a failure has no safe contained fix, or
  branch protection/required review prevents the authorized merge.

Name the blocker and next safe action. Mid-issue stops leave useful work committed
and pushed, with a draft PR when useful. Never call incomplete work done merely
to fit a budget. A stopped Lucky run does not silently resume on later discussion;
follow the user's new request at its stated scope.

## GitHub Text And Review Evidence

Use descriptive `type(scope): outcome` titles from `AGENTS.md`. Send multiline
GitHub text via UTF-8 body files (`gh ... --body-file`) or structured payloads.
PowerShell single-quoted here-strings preserve Markdown backticks; avoid literal
backslash-n paragraphs and shell-interpreted strings. Re-fetch before editing
existing text to preserve concurrent changes; inspect a rendered sample only
when formatting warrants it.

A PR needs its closing issue, concrete result, relevant verification, and any
material limitations. Include source/provenance notes for corpus work and docs
changed when relevant. For visible UI changes, inspect phone/desktop full-page
layout and attach focused evidence that is readable without a huge JSON dump.
Do not create screenshots for text-only workflow changes.

Human approval is required outside an active explicitly authorized Lucky run.
Required GitHub/Vercel checks and provenance/domain safeguards are never waived
for token savings. Keep reviews focused on correctness, source authority,
validation, small-screen usability and unnecessary complexity.

After merge, remove completed branches/worktrees only when safe, and use issues
for follow-ups. Do not introduce a new status ledger or a GitHub Project until
its extra management capability solves a demonstrated problem.
