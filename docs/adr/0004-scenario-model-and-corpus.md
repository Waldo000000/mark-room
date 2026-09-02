# ADR 0004: Scenario Model And Corpus

Status: Accepted

Date: 2026-08-30

Amended: 2026-09-03

## Context

MarkRoom needs scenarios that can be displayed, tested, imported, queried, and reasoned about. A free-text answer is not sufficient for deterministic quizzes or safe AI assistance.

## Decision

Use a typed, keyframe-based 2D scenario model as the canonical representation.
Wind source direction is explicit scenario data and uses degrees clockwise from
north, matching boat headings.

Use hull length as the only linear Scenario unit. This is an app-wide
convention, not a field repeated in every record. Initially all boats share one
standard size and each rendered hull is exactly one Scenario unit long.

Each keyframed boat state explicitly records tack because heading alone cannot
resolve it in head-to-wind and dead-downwind states. The renderer derives sail
side, trim, and luffing deterministically from tack, heading, and wind; these
presentation values are not Scenario data.

Use structured obligations and outcomes rather than a single `answer` field.

Separate the reasoning pipeline into three bounded models: editor-controlled
`Scenario`, self-contained RRS-language `Situation`, and obligations/outcomes
`Ruling`. A rules engine consumes Situation without also needing Scenario.
Situation excludes geometry and renderer details. Defer temporal transition
types until multi-keyframe cases establish the required RRS vocabulary.

Keep Scenario input-only. Geometry-derived facts such as overlap, contact,
zone membership, and course change belong in Situation. Scenario retains only
observed events that geometry cannot reveal, initially hails and penalties
taken.

Store marks but not duplicate zone course features in Scenario. For the
2025-2028 rules, derive each displayed zone from its mark and rules context:
three hull lengths under general RRS and four hull lengths for radio sailing
under Appendix E1.1. Keep `inZoneOfMarks` in Situation as the semantic record of
membership until a deterministic geometry transform owns that derivation.

Record a mark's optional required side in Scenario. Record mark-relative
inside/outside boat relationships in Situation, independently of overlap and
windward/leeward, because these are distinct Rule 18 inputs.

Keep Ruling deterministic and structural. It contains obligations and outcomes
with rule references, but no confidence status, statement IDs, authored
explanations, or conclusion prose.

Package worked learning content as `TrainingExample` records that directly
compose `scenario`, `situation`, and `rulings`. A TrainingExample does not claim
that Situation or Rulings were automatically derived from Scenario. Introduce
a separate evaluation-case model later when deterministic transforms exist.
Validate references between the composed models, and keep corpus teaching,
provenance, and verification outside TrainingExample.

Store initial corpus records as validated files in Git. Keep teaching text,
source provenance, and verification in sidecar metadata keyed by scenario ID,
not in the Scenario model itself. Every stored corpus scenario must have this
metadata.

## Consequences

Scenarios become inspectable, diffable, and testable. The model can support SVG, Canvas, Konva, or other renderers without changing legal/rules data.

Scenario remains focused on sailing data while corpus stewardship can evolve
without changing editor input. Corpus loading must validate that each sidecar
references its paired scenario.

Sail rendering remains consistent across scenarios without exposing drawing
controls that a scenario editor should not ask sailors to manage.

Mark and zone geometry cannot drift independently. A future editor places the
mark once, while the viewer applies the discipline-aware rules distance and
Situation records which boats are in that mark's zone.

Teaching prompts and questions are presentation or corpus concerns, not
Scenario data.

The schema must be discovered and refined against a broad corpus before being treated as stable.
