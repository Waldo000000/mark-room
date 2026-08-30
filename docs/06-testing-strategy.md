# Testing Strategy

MarkRoom should be built so agents can verify their own work in background loops.

## Test Pyramid

Use focused unit tests for:

- scenario schema validation
- geometry helpers
- keyframe interpolation
- finding normalization
- quiz generation and scoring
- provenance and verification rules
- corpus validation

Use integration tests for:

- loading corpus records
- deriving quiz questions from structured findings
- rendering scenarios from fixtures
- validating source-to-scenario links

Use Playwright for:

- core mobile flows
- rules explorer navigation
- scenario viewer interaction
- quiz flows
- visual regressions around diagrams
- PR smoke tests

## Required Checks

Each PR should run:

- type check
- lint
- unit tests
- corpus validation
- Playwright smoke tests
- build

UI PRs should include screenshots or recordings, especially for mobile viewports.

## Mobile Viewports

Test at least:

- narrow phone portrait
- larger phone portrait
- phone landscape if scenario controls are affected
- desktop

Scenario viewer/editor work must verify that:

- controls are reachable by touch
- labels do not overlap important geometry
- hit targets are large enough
- timeline/keyframe controls are usable
- pan/zoom or scrub interactions do not hide essential UI

## Agent Self-Validation

Agents should fix their own failures before opening or updating a PR.

Every PR description should include:

- tests run
- known gaps
- screenshots for UI
- corpus validation notes for data changes

## Corpus Validation

Corpus checks should fail CI when:

- scenario JSON does not match schema
- source provenance is missing
- verification status is invalid
- rule references are malformed
- a canonical scenario lacks required verification
- schema version migration is missing

## AI Feature Testing

When AI features arrive:

- keep prompt tests fixture-based
- validate structured output
- test refusal/caveat behavior
- test retrieval citations
- never use model confidence alone as a pass condition
