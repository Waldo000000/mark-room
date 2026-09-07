# Agent Instructions

Build the smallest useful MarkRoom change. GitHub owns delivery state; Git owns
shipped code and durable decisions. Preserve user and other-agent work.

## Start Here

1. Read [vision](docs/00-vision.md) and
   [product principles](docs/01-product-principles.md) once per session.
2. Check open PRs before issues. Select the lowest-numbered unblocked `ready`
   issue unless the user gives another priority. Fetch summaries first, then
   only the selected issue's body and relevant owner docs.
3. State one user-visible outcome and its verification path. Use a dedicated
   branch/worktree and open a PR for every repository change.
4. For delivery details and explicitly requested overnight runs, read
   [the workflow](docs/07-agent-git-workflow.md). Outside an active, explicitly
   requested "I'm Feeling Lucky" run, human approval is required to merge.

## Spend Complexity Carefully

- Apply YAGNI: implement demonstrated needs, not everything a roadmap lists as
  possible. "If needed" is not a requirement. Prefer removing an unnecessary
  concept to making its implementation more elaborate.
- Before adding a feature, identify the concrete user problem, the smallest
  existing mechanism that solves it, and the new state/interaction burden.
  Challenge optional persistence, history, management UI, abstractions and
  configuration before implementation. A smaller implementation choice needs
  no permission; a new product requirement needs evidence.
- Do not mark agent-invented optional scope `ready` just to keep a run busy.
  During unattended work, defer it with a brief reason and select confirmed
  work; stop if none remains after bounded roadmap refinement.
- Default to one agent for routine changes. Delegate only an independent,
  bounded task that repays its setup and integration cost. A small control or
  straightforward fix does not automatically need implementation plus review
  agents. Risk-based review guidance lives in the workflow.
- Read owner docs once; recover facts with narrow searches. Do not dump full
  histories, all issue bodies, or whole logs. Pass agents file names, scope and
  acceptance criteria instead of the entire conversation.
- Keep one concise issue scope/decision record and one PR explanation. Link
  existing evidence instead of copying it into multiple comments. Use a short
  handoff at a real stop; do not maintain a repository delivery ledger.
- Wait for CI through bounded watch/wait tools, with backoff and change-only
  output. Do not repeatedly ask the model to interpret the same pending checks.
  Progress updates should convey new information, subject to host requirements.
- Do not claim precise token savings from elapsed time or account usage
  percentages. Prefer observable evidence: removed work, smaller instruction
  payloads, fewer duplicated checks, or fewer integration boundaries.

## Product And Domain Invariants

- Correctness beats breadth. Official World Sailing material owns rules truth;
  community examples are secondary. Never strengthen a source ruling silently.
- Provenance and verification are separate. Do not call a transcription
  canonical or human-verified without its required verification record.
- Use TypeScript; keep domain logic independent of React where practical.
  Initial corpus data stays validated and diffable in Git.
- Do not add runtime databases, auth, payments, native apps or offline service
  workers without an accepted ADR. AI calls belong behind a small service
  boundary, not scattered through UI code.
- Optimize for small touch screens. Feature slices need a minimal sailor-facing
  review path; workflow-only changes do not need an artificial product UI.
- All linear Scenario dimensions use hull lengths; every hull is one Scenario
  unit long. Boat glyphs use rounded plan-view hulls, sails offset to leeward,
  appropriate trim and wavy luffing sails, not generic navigation symbols.

## Verification And Delivery

Follow [the testing strategy](docs/06-testing-strategy.md): targeted local
checks while developing, then required GitHub and Vercel checks on the exact
pushed commit. Do not duplicate a full local CI suite without a concrete need.

For changed diagrams, assert the affected geometry and sailing semantics, not
just a nonblank render. Inspect phone and desktop layouts when visibly changed.
Use focused screenshots of the changed surface plus a full-page layout check;
not repeated giant JSON screenshots. Keep meaningful failure evidence.

Diagnose a failing test before changing product code. In pointer tests, confirm
the viewport, coordinate transform and actual hit target. Do not promote an
unverified hypothesis into a product fix. State unavailable verification in the PR.

Use `type(scope): concise lowercase outcome` PR titles. Types: `feat`, `fix`,
`docs`, `test`, `refactor`, `chore`. Scopes: `browse`, `quiz`, `editor`, `derive`,
`model`, `corpus`, `render`, `ci`, `deploy`, `workflow`. Each PR closes its issue,
explains the outcome and records relevant validation, limitations and sources.
Do not omit required checks or approval to save tokens.

## Documentation Owners

- ADRs: durable decisions and rationale; use [the template](docs/adr/0000-template.md)
  for framework/dependency, schema, rendering, verification, deployment,
  workflow, persistence/auth/offline changes. Amend the relevant ADR when apt.
- [Scenario model](docs/04-scenario-model.md): vocabulary and schema.
- [Corpus policy](docs/05-corpus-provenance-verification.md): provenance and verification.
- [Testing](docs/06-testing-strategy.md): verification policy.
- [Workflow](docs/07-agent-git-workflow.md): selection, delegation and delivery.
- [Non-goals](docs/13-non-goals.md): deferred scope and product limitations.

Update the owner when its durable truth changes; link to it elsewhere instead
of repeating its policy. Do not load unrelated owners just because they exist.
