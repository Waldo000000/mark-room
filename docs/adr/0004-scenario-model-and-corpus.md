# ADR 0004: Scenario, Situation, Ruling, And Corpus

Status: Accepted

Date: 2026-08-30

Updated: 2026-09-02

## Context

The initial `0.1.0` Scenario record combined editor geometry, derived physical
observations, legal conclusions, teaching copy, provenance, and verification.
That made invalid combinations representable and would have coupled the rules
engine to editor data. Heading also cannot determine tack when a boat is head to
wind or running square.

Rules that depend on change over time require more than a bag of snapshot facts,
but raw keyframe geometry is not the language in which the Racing Rules of
Sailing are most naturally evaluated.

## Decision

Adopt a one-way, three-stage domain pipeline:

```text
Scenario -> Situation -> Ruling
```

- `Scenario` is editor-controlled geometry and directly observed actions.
- `Situation` is a self-contained temporal description in RRS language.
- `Ruling` is obligations and outcomes produced from Situation alone.

Record tack explicitly in every Scenario boat state. An editor may calculate a
default, while validation permits either tack at head-to-wind and dead-downwind
ambiguity.

Use hull length as the only linear Scenario unit. This is an app-wide convention,
not a field repeated in every record. For the first cut, all boats are the same
size and exactly one Scenario unit long; do not add per-boat length or renderer
scaling inputs.

Keep standard hull geometry and other app-wide physical constants in code.
Geometry may use hull shapes to derive contact, overlap, proximity, and zone
membership, but Situation does not persist hull polygons.

Represent temporal Situation data as ordered moments plus explicit transitions.
Refine that vocabulary against the discovery corpus before declaring it stable.

Use deterministic transforms with these contracts:

```ts
deriveSituation(scenario: Scenario): Situation;
determineRuling(situation: Situation): Ruling;
```

Do not encode confidence or uncertainty in Ruling. Invalid or incomplete input
fails validation; unsupported rules coverage is an explicit capability error.

Store Git-backed evals as `EvalCase<Scenario, { situation; ruling }>` records
containing only `input` and `expected`. Store teaching copy, provenance, and
verification in required sidecar metadata keyed by Scenario ID.

## Consequences

The editor, geometry interpreter, and rules engine can evolve and be tested in
isolation. Situation data can be authored directly for rules-engine tests, and
the same record supports occasional end-to-end checks.

Situation duplicates selected identities and explicit tack because it is a
self-contained translation into another bounded context. It does not duplicate
coordinates or renderer geometry.

The schema is still provisional. Multi-moment cases, room, mark-room,
obstructions, and changing obligations must drive further vocabulary discovery.
