# Scenario Model

## Model Goal

Every scenario should normalize into a typed, keyframe-based 2D representation.

This applies to:

- hand-authored examples
- official cases
- reconstructed diagrams
- imported images
- user-created incidents
- future video-derived incidents

Animation is derived from the model. Legal/rules reasoning operates on explicit scenario facts and keyframes, not on rendered pixels.

## Initial Implementation

The provisional `0.1.0` Zod schema lives in
[`src/domain/scenario/schema.ts`](../src/domain/scenario/schema.ts). TypeScript
types are inferred from that schema so runtime validation and application types
cannot drift apart.

Development fixtures live beside the schema tests. They are synthetic,
unverified records and are not part of the canonical corpus. The corpus layout
and repository-wide validation command belong to MR-003.

The app exposes a minimal sailor-facing scenario at
`/scenarios/port-starboard`. It renders directly from a validated fixture so a
domain user can assess the diagram, finding, rule reference, provenance, and
verification treatment in each deployed preview.

Coordinates use abstract scenario units with the origin at the bottom-left.
Positive `x` points right, positive `y` points up, and headings are degrees
clockwise from north in the range `0 <= heading < 360`. Renderers are responsible
for adapting that convention to their own coordinate systems.

## Key Concepts

A scenario contains:

- stable scenario ID and schema version
- title and short prompt/question
- sailing context, such as radio sailing or general RRS
- 2D sailing area
- boats with stable identities
- discrete keyframes such as Position 1, 2, 3, 4
- boat positions and headings at each keyframe
- optional course features: marks, zones, lines, boundaries, laylines
- explicit physical or asserted facts: tack, overlap, zone entry, contact, course changes, hail events, penalties
- structured ruling/findings
- explanatory teaching text
- source provenance
- verification status

## Rulings And Findings

Avoid a single free-text `answer` field as the canonical result.

Use structured findings:

```ts
type ScenarioFinding = {
  id: string
  atKeyframe?: string
  subjectBoat: string
  findingType:
    | "right_of_way"
    | "keep_clear"
    | "entitled_to_room"
    | "entitled_to_mark_room"
    | "must_give_room"
    | "must_avoid_contact"
    | "rule_applies"
    | "rule_breached"
    | "exonerated"
    | "penalty"
    | "no_breach"
  otherBoat?: string
  ruleRefs: string[]
  status: "definite" | "conditional" | "not_determinable"
  explanation?: string
  provenanceRefs?: string[]
}

type ScenarioRuling = {
  findings: ScenarioFinding[]
  conclusion: string
}
```

This list is a hypothesis, not a frozen ontology. The corpus discovery process must test and refine it.

## Three Layers

Keep these separate:

- facts: what physically happened or was asserted
- findings: structured rules conclusions
- explanation: human-readable teaching material

Legal conclusions such as entitlement to mark-room belong in findings, not in
the physical facts layer.

Do not infer stronger findings than the authoritative source supports.

## Schema Discovery Requirement

Before declaring the v1 schema stable, sample a broad set of scenarios:

- starts
- marks
- obstructions
- penalties
- protests
- changing rights and obligations
- contact and avoiding contact
- exoneration
- Appendix E radio sailing cases
- ordinary Part 2 right-of-way situations

The Release 1 product may be narrow. The schema discovery corpus must not be narrow.

## Model Adequacy Tests

Maintain a fixture suite of representative scenarios that the schema must encode cleanly without awkward free-text escape hatches.

When a scenario does not fit:

- record the failure
- revise the schema deliberately
- add a migration if existing data changes
- document significant decisions in ADRs
