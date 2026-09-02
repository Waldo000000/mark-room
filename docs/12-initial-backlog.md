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

Status: Initial Scenario schema shipped via PR #3; replaced by the explicit
three-stage boundary in PR #5.

Create Zod schemas and TypeScript types for editor-controlled Scenario,
RRS-language Situation, deterministic Ruling, generic evals, provenance, and
verification.

Done when:

- each boundary validates example fixtures independently
- invalid and cross-boundary fixtures fail tests
- docs link to schema

### MR-003: Corpus Directory And Validation Command

Status: In review via PR #5.

Create corpus file structure and validation script.

Done when:

- `npm run validate:corpus` validates eval files and required metadata sidecars
- CI can call it
- at least two tiny example scenarios exist

### MR-004: Establish Domain Pipeline Boundaries

Status: In review via PR #5.

Adopt `Scenario -> Situation -> Ruling` as three bounded contexts. Keep tack as
explicit Scenario input, keep hull geometry in code, and model Situation time as
ordered moments plus RRS-language transitions.

Done when:

- schemas and ADR agree on all three boundaries
- eval records contain only input and expected outputs
- provenance and verification remain required sidecars
- the live app lets a sailor inspect geometry, expected Situation, expected
  Ruling, and exact eval JSON
- tests reject derived state in Scenario and hull polygons in Situation

## Product

### MR-010: Mobile App Shell

Build the first mobile-first navigation structure.

Done when:

- routes exist for rules, scenarios, quiz, and about/status
- phone viewport layout is tested
- no desktop-only assumptions

### MR-011: Scenario Viewer Prototype

Status: Partially implemented in PRs #3 and #5; the shared viewer now renders
multiple corpus records, while keyframe switching and generic course feature
rendering remain.

Render a keyframe scenario with SVG.

Done when:

- boats, marks, zones, labels, and tracks can render from fixture JSON
- user can switch or scrub between keyframes
- Playwright verifies visible elements in mobile and desktop viewports

### MR-012: Structured Ruling Display

Status: Partially implemented in PRs #3 and #5 for expected `keep-clear`
obligations across two right-of-way Situations.

Display Situation observations, Ruling obligations and outcomes, rule refs, and
explanation for a Scenario eval.

Done when:

- user can see who must keep clear, who has right of way, and which rules apply
- verification status is visible

### MR-013: Quiz Prototype

Generate deterministic quiz questions from structured Rulings.

Done when:

- at least right-of-way/keep-clear questions work
- scoring does not require an LLM
- tests cover generated question/answer behavior

## Corpus And Research

### MR-020: Source Registry

Design source metadata files for official and secondary sources.

Done when:

- source records validate as corpus metadata sidecars
- every eval has exactly one matching sidecar
- missing and orphaned sidecars fail validation

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
- expected Situation, Ruling obligations/outcomes, and rule refs are structured

### MR-023: Derive Situation From Scenario

Implement the first deterministic geometry interpreter for current and selected
multi-moment evals.

Done when:

- standard hull and zone constants are versioned in domain code
- tack, point of sail, luffing, contact, overlap, windward/leeward, proximity,
  and zone membership are derived where applicable
- expected Situation evals pass without invoking rules logic
- at least one multi-moment sailor-facing example exposes derived transitions

### MR-024: Determine Ruling From Situation

Implement the first deterministic rules slice against directly authored
Situations, beginning with Rules 10 and 11.

Done when:

- the transform accepts Situation only
- Rules 10 and 11 obligations match expected Rulings
- unsupported coverage is an explicit capability error
- at least one live sailor-facing example shows an engine-produced Ruling

## Workflow

### MR-030: CI Workflow

Status: Complete via PRs #2 through #5.

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
