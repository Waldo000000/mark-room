# ADR 0005: Rendering Strategy

Status: Accepted

Date: 2026-08-30

## Context

Scenario diagrams must be clear, mobile-friendly, testable, and maintainable by agents. The app will initially render tens of objects, not thousands.

## Decision

Use React + SVG for the Release 1 scenario viewer.

Before building the Release 2 editor, run an explicit SVG vs react-konva mobile interaction spike. Prefer SVG unless the spike demonstrates a material advantage for react-konva in code simplicity or touch experience.

## Consequences

SVG keeps Release 1 transparent and easy to test. The renderer remains an adapter over the canonical scenario model.

Tests must compare SVG geometry and labels to the validated record and assert
sailing semantics such as wind flow, headings, and tack. Pixel presence alone
does not validate a scenario diagram.

The project does not make an ideological commitment to SVG. It commits to the simplest implementation that delivers the required user experience.
