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
unverified records and are not part of the canonical corpus. Corpus metadata is
stored separately from Scenario so provenance, verification, and teaching
material cannot be mistaken for sailing input or derived rules output.

The app exposes a minimal sailor-facing scenario at
`/scenarios/port-starboard`. It renders directly from a validated fixture so a
domain user can assess the diagram, finding, rule reference, provenance, and
verification treatment in each deployed preview.

One coordinate unit is one hull length of the common boat class. The origin is
at the bottom-left, positive `x` points right, positive `y` points up, and
headings are degrees clockwise from north in the range
`0 <= heading < 360`. The app supports no other linear unit, so Scenario JSON
does not repeat a unit field.

For the initial product, every boat is the same size and exactly one Scenario
unit long. Supporting mixed fleets later requires a deliberate schema and
geometry decision.

`wind.fromDegrees` uses the same compass convention and records the direction
the wind comes from. A north wind is therefore `0`, while its flow arrow points
south.

Each boat state records tack explicitly because heading cannot resolve it when
the boat is head to wind or running square. Away from those ambiguous headings,
tack is validated against heading and wind direction.

Sail side, trim, and luffing are deterministic presentation derived from tack,
heading, and wind. The renderer puts the sail to leeward, luffs it within 15
degrees of head to wind, and eases it progressively from upwind to reaching to
downwind. These drawing choices are app conventions, not user-editable Scenario
data.

## Key Concepts

A scenario contains:

- stable scenario ID and schema version
- title and short prompt/question
- sailing context, such as radio sailing or general RRS
- 2D sailing area measured in hull lengths
- wind direction
- boats with stable identities
- discrete keyframes such as Position 1, 2, 3, 4
- boat positions, headings, and explicit tack at each keyframe
- optional course features: marks, zones, lines, boundaries, laylines
- explicit physical or asserted facts: overlap, zone entry, contact, course changes, hail events, penalties
- structured ruling/findings

Corpus records associate this model with separate metadata containing teaching
text, source provenance, and verification status. Those fields describe the
record and its stewardship, not the sailing scenario itself.

## Rulings And Findings

Avoid a single free-text `answer` field as the canonical result.

Use structured findings:

```ts
type ScenarioFinding = {
  id: string;
  atKeyframe?: string;
  subjectBoat: string;
  findingType:
    | 'right_of_way'
    | 'keep_clear'
    | 'entitled_to_room'
    | 'entitled_to_mark_room'
    | 'must_give_room'
    | 'must_avoid_contact'
    | 'rule_applies'
    | 'rule_breached'
    | 'exonerated'
    | 'penalty'
    | 'no_breach';
  otherBoat?: string;
  ruleRefs: string[];
  status: 'definite' | 'conditional' | 'not_determinable';
  explanation?: string;
};

type ScenarioRuling = {
  findings: ScenarioFinding[];
  conclusion: string;
};
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
