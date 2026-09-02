# Agent Instructions

This repository is designed for parallel coding agents. Treat Git as the project memory and leave the repo clearer than you found it.

## Prime Directives

- Read the relevant Markdown docs before making changes.
- Do not rely on conversation-only context for durable decisions.
- Preserve user-authored and other-agent changes unless explicitly asked to change them.
- Keep changes scoped to the issue or task.
- Prefer simple, inspectable code over clever abstraction.
- Update docs, ADRs, schemas, examples, and tests when your change alters durable behavior.
- Open a pull request for every change; do not merge to `main`.

## Product Principles

- Correctness beats breadth and speed.
- Authoritative source material beats generated confidence.
- The user experience must be excellent on small touch screens.
- Scenario data must be inspectable, diffable, testable, and provenance-aware.
- AI may assist, but deterministic validated data should power Release 1.

## Before You Start

1. Read [docs/00-vision.md](docs/00-vision.md).
2. Read [docs/01-product-principles.md](docs/01-product-principles.md).
3. Read the relevant architecture or workflow docs for your task.
4. Check existing issues, branches, and pull requests to avoid duplicate work.
5. Create or use a dedicated branch/worktree for your task.

## Development Expectations

- Use TypeScript for app and domain code.
- Keep domain logic independent of React where practical.
- Store canonical corpus data as validated files in Git during the initial milestones.
- Do not introduce a runtime database, authentication, payments, native apps, or offline service worker support unless an accepted ADR says to do so.
- Do not scatter OpenAI API calls through UI code. Use a small internal AI service boundary.
- Do not label a scenario as canonical or human-verified unless the required verification record exists.

## Testing Expectations

Every substantive PR should include appropriate verification:

- unit tests for schema validation, geometry, findings, quiz scoring, and pure rules helpers
- Playwright tests for mobile-first user flows and scenario viewer behavior
- accessibility checks for core screens where possible
- visual or screenshot inspection for diagram changes
- corpus validation for any data changes

For scenario diagrams, verify domain semantics as well as pixels: rendered wind
direction, headings, tack, positions, labels, and findings must agree with the
validated scenario record. A nonblank, responsive screenshot is not sufficient.
Use browser assertions for machine-checkable geometry and inspect the result at
phone and desktop sizes with sailing meaning in mind.

All linear Scenario dimensions use hull lengths. Until an accepted ADR changes
the limitation, all boats are the same size and every rendered hull is exactly
one Scenario unit long.

Boat glyphs must use the established plan-view sailing-diagram convention:
rounded hull silhouette, sail visibly offset to leeward, trim appropriate to the
depicted point of sail, and a curved/wavy sail when luffing. Do not substitute a
generic triangle, diamond, or navigation arrow for a boat.

Every feature slice must also expose the smallest honest sailor-facing path in
the deployed app that lets a domain user assess whether the product is moving
in the right direction. Developer-only tooling or internal plumbing does not
satisfy the definition of done by itself.

If a test cannot be run, say so in the PR with the reason.

## Scenario And Corpus Rules

- Official World Sailing material is the authoritative source for rules content.
- Community examples and competitor apps are secondary references only.
- Every scenario needs provenance.
- Provenance and verification are separate.
- An official source can still have an unverified MarkRoom transcription.
- Preserve raw source references and extraction notes.
- Never silently rewrite a source-derived ruling into a stronger claim than the source supports.

## Pull Request Rules

PRs should include:

- what changed
- why it changed
- screenshots or recordings for UI work
- tests run
- source/provenance notes for corpus changes
- docs updated or a reason docs were not needed

Human approval is required before merging to `main`.

## ADR Rules

Create or update an ADR when a task changes:

- framework or major dependency choices
- scenario or corpus schema
- rendering approach
- verification model
- deployment model
- agent workflow
- persistence/auth/offline strategy

Use [docs/adr/0000-template.md](docs/adr/0000-template.md).
