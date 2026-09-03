# ADR 0005: Rendering Strategy

Status: Accepted

Date: 2026-08-30

## Context

Scenario diagrams must be clear, mobile-friendly, testable, and maintainable by agents. The app will initially render tens of objects, not thousands.

## Decision

Use React + SVG for the Release 1 scenario viewer and the first Release 2
editor interaction spike.

Before adding a canvas dependency such as react-konva, prove the editor's basic
mobile interactions against the existing SVG renderer. Prefer SVG unless the
spike demonstrates a material advantage for react-konva in code simplicity,
touch experience, or rendering correctness.

## Consequences

SVG keeps Release 1 transparent and easy to test. The renderer remains an adapter over the canonical scenario model.

Tests must compare SVG geometry and labels to the validated record and assert
sailing semantics such as wind flow, headings, and tack. Pixel presence alone
does not validate a scenario diagram.

Boat rendering follows the conventional plan view used in sailing rules
diagrams: a narrow rounded hull and a separate sail line offset to leeward. Sail
trim and luffing shape come from keyframe data rather than from decorative UI
choices.

The renderer normalizes the standard hull path to exactly one Scenario
hull-length unit and displays a one-hull-length scale. Renderer pixels do not
define or alter Scenario dimensions. Editor interactions must convert pointer
input back into Scenario units before validation or export.

The project does not make an ideological commitment to SVG. It commits to the simplest implementation that delivers the required user experience.

Scenario diagrams share a ghosted-positions treatment across the viewer and
editor: non-selected keyframes render semi-transparent for sequence context,
while the selected keyframe remains primary. Ghost labels are hidden until a
later issue proves a readable label treatment.
