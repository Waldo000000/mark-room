# Product Principles

## Correctness Beats Breadth

MarkRoom should prefer a small number of excellent, verified scenarios over a large library of plausible but inaccurate examples.

A polished diagram is not enough. The Scenario geometry, expected Situation,
rule references, and expected Ruling must be correct or clearly marked as
unverified.

## Prefer Authoritative Sources

Official World Sailing material is authoritative for rules content:

- current Racing Rules of Sailing
- definitions
- official cases
- interpretations
- relevant appendices, especially Appendix E for radio sailing

Community material, competitor products, race anecdotes, and generated explanations may help discovery, but they do not override official sources.

## Explain, Do Not Merely Answer

The app should show:

- which editor inputs matter
- which RRS-language Situation was derived
- which rules apply
- which boat has which obligation
- which deterministic obligations and outcomes follow
- how the user can see the same pattern next time

Incomplete or invalid input should produce clear validation errors. Supported,
valid input should produce a deterministic result rather than an uncertainty
score.

## Mobile First Means Actually Mobile First

The scenario viewer and future editor must be first-class on small touch screens. Controls, hit targets, timelines, labels, and gestures should be designed for use beside a pond or at a sailing club, not merely shrunk from a desktop design.

## Git Is The Memory

No durable project knowledge should live only in ChatGPT, Codex, or another chat session. Decisions and context should be committed as Markdown, schemas, tests, or code.

## Simplicity Is A Feature

Prefer the simplest implementation that delivers the required user experience. Add abstraction or sophistication only when it solves a demonstrated problem.

This applies especially to rendering, persistence, AI provider architecture, and workflow automation.
