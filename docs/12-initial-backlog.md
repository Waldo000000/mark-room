# Initial Backlog

These are agent-ready slices for starting the project.

## Foundation

### MR-001: Scaffold App

Status: Complete via PR #2. shadcn/ui remains intentionally deferred until a
real component needs it.

Create the initial Next.js TypeScript app with Tailwind, linting, formatting,
Vitest or equivalent, and Playwright.

Done when:

- app runs locally
- CI scripts exist in `package.json`
- starter page is replaced with a MarkRoom app shell
- tests pass

### MR-002: Add Scenario Schema

Status: Complete via PR #3.

Create initial Zod schemas and TypeScript types for scenarios, boats,
keyframes, course features, rulings, findings, and separate corpus metadata for
provenance and verification.

Done when:

- schema validates example fixtures
- invalid fixtures fail tests
- docs link to schema

### MR-003: Corpus Directory And Validation Command

Status: Planned. See the current order in
[Delivery Handoff](15-delivery-handoff.md).

Create corpus file structure and validation script.

Done when:

- `npm run validate:corpus` validates all scenario/metadata pairs
- CI can call it
- at least two tiny example scenarios exist

## Product

### MR-010: Mobile App Shell

Build the first mobile-first navigation structure.

Done when:

- routes exist for rules, scenarios, quiz, and about/status
- phone viewport layout is tested
- no desktop-only assumptions

### MR-011: Scenario Viewer Prototype

Status: Partially implemented in PR #3; keyframe switching and generic course
feature rendering remain.

Render a keyframe scenario with SVG.

Done when:

- boats, marks, zones, labels, and tracks can render from fixture JSON
- user can switch or scrub between keyframes
- Playwright verifies visible elements in mobile and desktop viewports

### MR-012: Structured Ruling Display

Status: Partially implemented in PR #3 for one `keep_clear` finding.

Display findings, rule refs, status, and explanation for a scenario.

Done when:

- user can see who must keep clear, who has right of way, and which rules apply
- conditional and not-determinable findings have distinct presentation
- verification status is visible

### MR-013: Quiz Prototype

Generate deterministic quiz questions from structured findings.

Done when:

- at least right-of-way/keep-clear questions work
- scoring does not require an LLM
- tests cover generated question/answer behavior

## Corpus And Research

### MR-020: Source Registry

Design source metadata files for official and secondary sources.

Done when:

- source records validate
- scenarios can reference source IDs
- missing source references fail validation

### MR-021: Schema Adequacy Discovery Set

Collect a broad non-canonical discovery set covering starts, marks, obstructions, contact, exoneration, protests, penalties, changing rights, and Appendix E.

Done when:

- each candidate has provenance notes
- schema fit/gap notes are recorded
- no item is marked canonical merely because it exists

### MR-022: First Canonical Scenario Batch

Create the first small batch of human-reviewed or human-verification-ready scenarios for core boat-on-boat rules.

Done when:

- each scenario has provenance
- each scenario validates
- verification status is explicit
- rule refs and findings are structured

## Workflow

### MR-030: CI Workflow

Status: Implemented except for corpus validation, which depends on MR-003.

Add GitHub Actions for lint, type check, tests, corpus validation, Playwright smoke tests, and build.

Done when:

- CI runs on PRs
- failure messages are agent-readable
- docs mention how to run checks locally

### MR-031: PR And Issue Templates

Status: Complete via PR #2.

Add PR and issue templates for feature work, bugs, corpus items, and ADRs.

Done when:

- templates ask for tests and provenance where relevant
- templates align with `AGENTS.md`

### MR-032: Vercel Deployment

Status: Complete. Production and pull-request previews are operational.

Connect Vercel production and PR previews.

Done when:

- `main` deploys to production
- PRs get preview URLs
- deployment instructions are documented

## Spikes

### MR-040: SVG Vs react-konva Editor Spike

Build the same representative editor interaction twice before Release 2.

Interaction requirements:

- four boats plus a mark
- phone pan and zoom
- tap select
- finger drag
- boat rotation
- large touch targets
- optional snap behavior
- keyframe switching
- undo/redo
- Playwright interaction tests

Done when:

- code size and complexity are compared
- mobile feel is evaluated
- recommendation is captured in an ADR
