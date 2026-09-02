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

Animation and RRS-language observations are derived from the model, not from
rendered pixels.

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
- title
- sailing context, such as radio sailing or general RRS
- 2D sailing area measured in hull lengths
- wind direction
- boats with stable identities
- discrete keyframes such as Position 1, 2, 3, 4
- boat positions, headings, and explicit tack at each keyframe
- optional course features: marks, zones, lines, boundaries, laylines
- user-observed events that geometry cannot reveal, currently hails and penalties taken

Corpus records associate this model with separate metadata containing teaching
text, source provenance, and verification status. Those fields describe the
record and its stewardship, not the sailing scenario itself.

## Pipeline Models

MarkRoom uses three bounded models:

1. `Scenario` is editor-controlled geometry, identity, wind, course features,
   and observed events. It contains no derived facts or ruling output.
2. `Situation` is a self-contained RRS-language interpretation derived from a
   Scenario. It contains tack, point of sail, luffing, mark-zone membership,
   contact, relative position, windward/leeward relationships, proximity in
   hull lengths, available room, and observed actions. It does not contain
   positions, headings, hull polygons, or renderer-only sail trim.
3. `Ruling` contains obligations and outcomes derived from Situation without
   needing Scenario geometry. It is deterministic structured output: statement
   IDs, confidence, authored explanations, and conclusion prose are excluded.

The provisional Situation schema lives in
[`src/domain/situation/schema.ts`](../src/domain/situation/schema.ts). Temporal
transition vocabulary is deferred until a representative multi-keyframe rules
case establishes what the model needs.

The provisional Ruling schema lives in
[`src/domain/ruling/schema.ts`](../src/domain/ruling/schema.ts). Obligations
identify the boat, moment, obligation type, boat owed the obligation,
and applicable rule references. Outcomes identify breaches, exoneration,
penalties, or no breach.

## Ruling Shape

Avoid a free-text `answer` field. A Ruling uses compact statements such as:

```ts
type Obligation = {
  atMoment: string;
  boatId: string;
  type: 'keep-clear' | 'give-room' | 'give-mark-room' | 'avoid-contact';
  owedToBoatId: string;
  ruleRefs: string[];
};
```

Legal conclusions such as entitlement to mark-room belong in Ruling, not in
Scenario or Situation. Human-readable teaching material belongs in corpus
metadata or presentation. Do not infer stronger rulings than the authoritative
source supports.

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
