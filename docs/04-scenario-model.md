# Domain Pipeline

## Model Goal

MarkRoom uses three models with one-way deterministic transforms:

```text
Scenario -> deriveSituation -> Situation -> determineRuling -> Ruling
```

Each model is optimized for one bounded context. No transform should need to
reach back to an earlier model after its input has been produced.

## Scenario: Editor Language

`Scenario` is the complete input to geometry interpretation and maps one-to-one
to controls in the future scenario editor. It contains:

- wind direction and sailing-area dimensions
- boat identities, positions, headings, and explicit tack at each keyframe
- physical course objects such as marks, lines, and boundaries
- directly observed actions that geometry cannot derive, such as hails or a
  penalty taken

Tack is explicit because heading and wind do not identify tack when a boat is
head to wind or running square. A future editor may default tack as heading
changes, but the sailor remains able to set it. Away from the two ambiguous
headings, validation rejects a tack that is physically inconsistent with wind
and heading.

Scenario does not contain teaching prompts, sail trim, luffing, hull polygons,
overlap, contact, zone membership, windward/leeward relationships, room
assessments, obligations, breaches, or penalties imposed by a ruling. Teaching
copy belongs to corpus metadata or the presenting product feature.

By convention, all linear Scenario dimensions are measured in hull lengths.
Coordinates, sailing-area dimensions, mark radii, line endpoints, and boundary
points are therefore multiples of the common boat hull length. Scenario records
do not carry a unit field because the app supports no other linear unit. Angles
remain degrees.

The provisional Scenario schema is version `0.2.0` and lives in
[`src/domain/scenario/schema.ts`](../src/domain/scenario/schema.ts).

## App-Wide Physical Constants

Values that a sailor does not edit belong in versioned domain code, not in each
Scenario. Examples include:

- standard hull shape, beam-to-length ratio, and collision shape
- the no-go/luffing angle relative to the wind
- point-of-sail and sail-trim curves
- zone construction in hull lengths

Renderers may use the standard hull silhouette, but hull polygons are an
implementation detail. They may be used while deriving contact, separation,
overlap, and zone membership; they are never persisted in Situation.

For the initial product, every boat has the same size and is exactly one hull
length long. Scenario has no per-boat hull-length field. Supporting mixed fleets
later will require a deliberate schema and geometry decision.

## Situation: RRS Language

`Situation` is the self-contained output of geometry interpretation and the
complete input to rules reasoning. It discards editor coordinates and describes
what is happening in Racing Rules of Sailing language:

- tack, point of sail, and luffing/sail state
- overlap or clear-ahead/clear-astern relationships
- windward and leeward boats
- contact
- proximity measured in hull lengths
- zone membership
- whether relevant room is physically available
- directly observed RRS actions copied from Scenario

Situation contains boat and mark identities, but not coordinates or hull
polygons. The provisional schema is version `0.1.0` and lives in
[`src/domain/situation/schema.ts`](../src/domain/situation/schema.ts).

### Time

A single snapshot is not sufficient for many rules. Situation therefore has:

- ordered `moments`, each holding the RRS state at a point in time
- `transitions` between moments, recording changes such as alteration of
  course, overlap establishment or breakage, zone crossing, and contact
  starting or ending

The temporal vocabulary is deliberately provisional. Corpus discovery must
test it against rules that depend on when a relationship began, who reached a
zone first, and whether room was provided through a manoeuvre. We should extend
RRS-language transitions rather than leak editor geometry into Situation.

## Ruling: Obligations And Outcomes

`Ruling` is the deterministic output of rules reasoning. It contains:

- obligations such as keep clear, give room, give mark-room, and avoid contact
- outcomes such as breach, exoneration, penalty, and no breach
- applicable rule references and a concise conclusion

Ruling contains no geometry. The engine does not report model confidence or
uncertainty. A Scenario that is incomplete or invalid must fail validation
before analysis; a valid supported Situation produces one deterministic Ruling.
Unsupported rule coverage is an explicit engine capability error, not a
probabilistic ruling.

The provisional schema is version `0.1.0` and lives in
[`src/domain/ruling/schema.ts`](../src/domain/ruling/schema.ts).

## Evaluation Cases

The checked-in corpus uses the generic shape:

```ts
type EvalCase<Input, Expected> = {
  input: Input;
  expected: Expected;
};
```

The current end-to-end record is:

```ts
type ScenarioEvalCase = EvalCase<
  Scenario,
  { situation: Situation; ruling: Ruling }
>;
```

That one record supports independent boundary checks:

- compare `deriveSituation(input)` with `expected.situation`
- compare `determineRuling(expected.situation)` with `expected.ruling`
- occasionally run the composed pipeline end to end

The expected Situation is intentionally reusable as direct rules-engine input.
This is eval data at a bounded-context boundary, not production state duplicated
alongside Scenario.

Eval JSON contains only `input` and `expected`. Teaching copy, provenance, and
verification are corpus concerns stored in sidecar metadata keyed by Scenario
ID. The deployed viewer shows the exact eval JSON so a sailor and developer can
compare geometry, RRS observations, and obligations while the schemas evolve.

## Coordinate Convention

One Scenario coordinate unit is one hull length of the common boat class. The
origin is bottom-left, positive `x` points right, positive `y` points up, and
headings are degrees clockwise from north in the range
`0 <= heading < 360`.
`wind.fromDegrees` records the direction the wind comes from.

## Discovery Requirement

Before any model is stable, test the pipeline against starts, marks,
obstructions, contact, changing rights, room, exoneration, penalties, protests,
Appendix E, and ordinary Part 2 situations. When a case does not fit, identify
which boundary lacks vocabulary, revise that schema deliberately, and add a
migration and boundary eval.
