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

## Domain-Semantic Diagram Checks

Scenario checks must prove more than successful rendering. For every changed
diagram or renderer, compare the validated scenario record with the visible
output and assert machine-checkable geometry in Playwright:

- wind source direction and arrow flow
- boat positions and headings
- standard hull silhouette plus sail side, trim angle, and luffing shape
- every hull spanning one Scenario unit and a visible one-hull-length scale
- explicit tack state implied by non-ambiguous heading and wind geometry
- visible labels, findings, and rule references

Run those checks at phone and desktop sizes and retain screenshots on failure.
When visible diagram layout changes, visually inspect it with its sailing
meaning in mind. A nonblank SVG, valid DOM, and lack of horizontal overflow do
not establish domain correctness.

During rapid schema iteration, the deployed scenario view should expose the
exact validated JSON driving the render so a reviewer can compare model and
output directly.

Commit a focused Playwright screenshot baseline when boat, sail, mark, or zone
glyph geometry changes. Semantic assertions remain required because an approved
pixel baseline can still encode a sailing mistake.

## Required Checks

Each PR should run:

- type check
- lint
- unit tests
- corpus validation
- Playwright smoke tests
- build

UI PRs should include screenshots or recordings, especially for mobile viewports.

## Verification Ladder

During development, run the smallest targeted local checks that give useful
feedback for the files and behavior being changed. The required GitHub and
Vercel pull-request checks on the exact pushed commit are the merge gate.

Do not rerun a full local suite that CI already covers on that exact commit
unless diagnosing a failure, the change is high-risk, or visual or domain
verification cannot be covered remotely. Manual full-page visual inspection is
needed only when visible layout changed. Keep semantic Playwright and domain
checks whenever the affected behavior requires them.

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

## Sailor-Facing Definition Of Done

Every feature slice must expose a minimal, honest path in the deployed app that
a sailor can use to assess the domain behavior and product direction. Internal
schemas, infrastructure, and developer-only validators are necessary building
blocks, but they are not done until the slice has a relevant user-facing proof.

Development or unverified content must remain clearly labelled and must not be
presented as canonical merely to satisfy this requirement.

## Corpus Validation

Corpus checks should fail CI when:

- scenario JSON does not match schema
- its paired corpus metadata is missing or references another scenario
- source provenance is missing from corpus metadata
- corpus verification status is invalid
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
