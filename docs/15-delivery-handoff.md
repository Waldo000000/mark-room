# Delivery Handoff

This file is the single current ledger for delivery order and status. Keep it
short; link to owner docs and ADRs instead of copying architecture prose.

Last updated: 2026-09-02

## Current Main

`origin/main` is `b5dfe90` from
[PR #16](https://github.com/Waldo000000/mark-room/pull/16). The latest merged
sequence is:

1. [PR #8: Move corpus metadata out of Scenario](https://github.com/Waldo000000/mark-room/pull/8)
2. [PR #9: Store tack instead of sail geometry in Scenario](https://github.com/Waldo000000/mark-room/pull/9)
3. [PR #10: Remove prompt copy from Scenario](https://github.com/Waldo000000/mark-room/pull/10)
4. [PR #11: Define the self-contained Situation model](https://github.com/Waldo000000/mark-room/pull/11)
5. [PR #12: Define the structured Ruling model](https://github.com/Waldo000000/mark-room/pull/12)
6. [PR #13: Make Scenario input-only](https://github.com/Waldo000000/mark-room/pull/13)
7. [PR #14: Make the pull request template human-first](https://github.com/Waldo000000/mark-room/pull/14)
8. [PR #16: Compose Scenario, Situation, and Ruling as an EvalCase](https://github.com/Waldo000000/mark-room/pull/16)

## Ordered Next Pull Requests

1. Validate scenario evals and metadata in CI
2. Browse validated scenarios from the corpus
3. Add a windward-leeward Rule 11 scenario

## Durable Decisions

- Agent and Git workflow: [ADR 0002](adr/0002-development-and-agent-workflow.md)
- Domain vocabulary and model: [docs/04](04-scenario-model.md) and
  [ADR 0004](adr/0004-scenario-model-and-corpus.md)
- Corpus provenance and verification: [docs/05](05-corpus-provenance-verification.md)
- Testing and merge gate: [docs/06](06-testing-strategy.md)
- Rendering: [ADR 0005](adr/0005-rendering-strategy.md)
- Persistence and AI boundary: [ADR 0006](adr/0006-persistence-and-ai.md)

## Known Constraints

- Human approval is required before merge; agents do not merge `main`.
- Use one focused branch and worktree per pull request.
- Release 1 remains deterministic and corpus-backed; current product scope is
  in [docs/02](02-roadmap.md).
- Current Scenario, corpus, and verification constraints live in their owner
  docs above, not in this ledger.

## Resume Steps

1. Start a fresh ChatGPT or Codex session for the next pull request.
2. Fetch `origin/main`; read `AGENTS.md`, this file, and only the owner docs
   relevant to the next outcome.
3. Confirm the latest merged and open pull requests, then update this ledger if
   its status or order has changed.
4. Create a dedicated branch and worktree from current `origin/main`.
5. Implement one title-sized outcome and run targeted local checks.
6. Push the exact commit, open the pull request, and use required GitHub and
   Vercel checks as the merge gate. Add manual full-page inspection only for a
   visible layout change; retain relevant semantic and domain checks.
7. Leave merge approval to a human. The next fresh session records the merged
   result here before continuing the sequence.
