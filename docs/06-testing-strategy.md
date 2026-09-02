# Testing Strategy

MarkRoom should be built so agents can verify their own work in background loops.

## Boundary Tests

Use focused unit tests for:

- Scenario, Situation, Ruling, eval, provenance, and verification schemas
- Scenario-to-Situation geometry and temporal derivation
- Situation-to-Ruling rules helpers
- each boundary independently using checked-in expected data
- selected composed Scenario-to-Ruling behavior
- keyframe interpolation, quiz scoring, and corpus validation

Situation-to-Ruling tests should accept authored Situation fixtures directly;
they must not require Scenario geometry. Scenario-to-Situation tests should stop
at Situation and make no rules assertions.

Use integration tests for loading corpus records, composing evals with sidecar
metadata, rendering Scenario geometry with expected Situation state, deriving
quiz questions from expected Rulings, and validating source links.

Use Playwright for core mobile flows, scenario viewer interaction, quiz flows,
diagram regressions, and PR smoke tests.

## Domain-Semantic Diagram Checks

For every changed diagram or renderer, compare the visible result with the
validated eval and assert:

- wind source direction and arrow flow from Scenario
- boat positions, headings, and explicit tack from Scenario
- standard hull silhouette from versioned app code
- sail side, trim, point of sail, and luffing from expected Situation
- visible RRS relationships, obligations, and rule references
- labels that do not obscure any hull or sail

Run checks at phone and desktop sizes, retain screenshots on failure, and inspect
the diagram with sailing meaning in mind. A nonblank SVG, valid DOM, and no
horizontal overflow do not establish domain correctness.

During schema iteration, the deployed scenario view must expose the exact
validated eval JSON so a reviewer can compare Scenario, expected Situation, and
expected Ruling directly.

Commit focused Playwright screenshot baselines when boat, sail, mark, or zone
glyph geometry changes. Semantic assertions remain required because an approved
pixel baseline can still encode a sailing mistake.

Playwright runs against a production build. Run
`npm run test:e2e -- --update-snapshots` deliberately when reviewed geometry
changes, then inspect phone and desktop images.

## Required Checks

Each PR should run type checking, linting, unit tests, corpus validation,
Playwright smoke tests, and a production build. UI PRs should include screenshots
or recordings, especially for mobile viewports.

## Mobile Viewports

Test narrow phone portrait, larger phone portrait, phone landscape when controls
are affected, and desktop. Verify touch reachability, label clearance, hit target
size, usable moment controls, and that pan, zoom, or scrubbing does not hide
essential UI.

## Sailor-Facing Definition Of Done

Every feature slice must expose a minimal honest path in the deployed app that a
sailor can use to assess domain behavior and product direction. Internal schemas
and validators are not done by themselves. Development or unverified content
must remain clearly labelled.

## Corpus Validation

`npm run validate:corpus` validates every eval in `corpus/scenarios` and every
sidecar in `corpus/metadata`. CI fails for schema errors, missing or orphaned
metadata, invalid cross-boundary references, mismatched explicit tack, missing
verification, malformed rule references, or missing schema migrations.

## AI Feature Testing

When AI assistance arrives, keep prompt tests fixture-based, validate structured
output, test retrieval citations, and prove that AI output cannot bypass either
deterministic transform or corpus verification.
