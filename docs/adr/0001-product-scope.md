# ADR 0001: Initial Product Scope

Status: Accepted

Date: 2026-08-30

## Context

MarkRoom could try to become a full sailing rules assistant immediately, including arbitrary scenario analysis and AI rulings. That would make the hardest, least proven part of the product the first dependency.

## Decision

Release 1 will be a mobile-first learning product:

- rules explorer
- curated canonical scenarios
- keyframe-based scenario viewer
- deterministic quiz mode
- rule citations, provenance, and verification status

Scenario editor comes in Release 2. AI-assisted arbitrary scenario analysis comes later.

## Consequences

The first release is smaller, testable, and useful without depending on LLM correctness.

The architecture still prepares for user-created and imported scenarios by normalizing all scenarios into the same typed keyframe model.
