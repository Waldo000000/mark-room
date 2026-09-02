# Vision

MarkRoom should become the best AI-assisted reasoning platform for the Racing Rules of Sailing, grounded in authoritative sources and built around clear visual scenarios.

The first audience is radio sailing racers. The underlying model should remain general enough for dinghy, keelboat, and other sailing contexts later.

## Problem

Sailors need to learn the Racing Rules of Sailing and apply them under pressure. The standard rule book and PDFs are authoritative, but they are not always easy to absorb. Many sailors learn through diagrams showing boats at several positions over time, paired with rule references and explanations.

That is exactly the shape MarkRoom should make easier:

- show what happened
- identify which rules apply
- explain who has which obligation
- cite authoritative sources
- help the user practice and retain the lesson

## Product Shape

MarkRoom starts as an educational web app:

- a better rules explorer than a static PDF
- animated and scrub-able scenario diagrams
- structured Situations and deterministic Rulings
- quizzes over known, verified scenarios

Later, MarkRoom grows into an analysis tool:

- users construct their own incident scenarios
- users import sketches, images, or videos
- the app normalizes those inputs into the editor-focused Scenario model
- deterministic geometry derives an RRS-language Situation
- deterministic rules logic derives a Ruling from that Situation
- the app retrieves similar verified scenarios
- AI may assist input, retrieval, and explanation without replacing the
  deterministic domain pipeline

## Foundational Bet

The durable asset is not a pile of prompts. It is a curated, provenance-aware
corpus of typed Scenario-to-Situation-to-Ruling evals, plus a product that
teaches and reasons from that corpus.
