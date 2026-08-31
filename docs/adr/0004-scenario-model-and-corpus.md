# ADR 0004: Scenario Model And Corpus

Status: Accepted

Date: 2026-08-30

## Context

MarkRoom needs scenarios that can be displayed, tested, imported, queried, and reasoned about. A free-text answer is not sufficient for deterministic quizzes or safe AI assistance.

## Decision

Use a typed, keyframe-based 2D scenario model as the canonical representation.
Wind source direction is explicit scenario data and uses degrees clockwise from
north, matching boat headings.

Each keyframed boat state explicitly records sail side, trim angle, and whether
the sail is luffing. These values drive the renderer and help resolve tack in
head-to-wind and dead-downwind states where heading alone is insufficient.

Use structured rulings and findings rather than a single `answer` field.

Store initial corpus records as validated files in Git. Every scenario must carry provenance and verification status.

## Consequences

Scenarios become inspectable, diffable, and testable. The model can support SVG, Canvas, Konva, or other renderers without changing legal/rules data.

The schema must be discovered and refined against a broad corpus before being treated as stable.
