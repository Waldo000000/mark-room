# ADR 0004: Scenario Model And Corpus

Status: Accepted

Date: 2026-08-30

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

Use structured rulings and findings rather than a single `answer` field.

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

Teaching prompts and questions are presentation or corpus concerns, not
Scenario data.

The schema must be discovered and refined against a broad corpus before being treated as stable.
