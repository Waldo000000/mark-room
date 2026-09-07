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

Viewer and editor timelines share a native range control with one step per
recorded keyframe and the active keyframe label adjacent to it. This is discrete
selection, not interpolated motion. Direct position controls remain available.
Viewer selection updates the position URL while preserving quiz/question state
and page scroll, including when a direct position link is used.

The editor exposes a connected rotation handle for the selected boat. Hull
gestures move the boat; handle gestures rotate around its stored position in
the active keyframe. A gesture retains its initial pointer-to-heading offset
so grabbing away from the handle center does not jump the heading. Pointer
cancellation restores the starting boat state. The existing heading control
remains the keyboard alternative, and both paths use the same tack inference
while retaining explicit tack at head-to-wind and dead-downwind headings.
At those two ambiguous headings the editor also exposes a port/starboard tack
choice for the selected boat/keyframe. At other headings the control displays
the inferred tack and is disabled. Choosing tack changes only the stored tack,
not heading, position, or movement-alignment settings; sail presentation follows
the existing rendering convention. Heading and wind edits continue to infer
tack wherever their geometry is unambiguous.
Handle drags use whole-degree headings to match that control. The handle's hit
target is at least 44 pixels across, scales with the SVG, and is inset from the
diagram edges. Its connector may move around the boat to retain separation
from the hull's move target.

On desktop, Left Shift plus wheel over the editor diagram rotates the selected
boat without translation: up is clockwise and down is counterclockwise. Wheel
distance accumulates at 20 CSS pixels per degree; line deltas use 20 pixels per
line and page deltas use the diagram height. Fractional remainder is retained
during the gesture and cleared when shortcut conditions end or selection
changes. Other modifiers, focused form controls, and an active pointer gesture
exclude the shortcut. Releasing Left Shift or leaving the window clears its
activation. Ordinary scrolling remains available outside those conditions.

Boat movement initially aligns heading to displacement from the same boat's
position in the immediately preceding keyframe. This is an authoring aid, not
a physical relationship: it runs only on pointer or numeric position edits,
never on loading, selecting, or scrubbing. No preceding position, or a distance
of at most 0.01 hull lengths, preserves the last valid heading. Other moves use
the clockwise-from-north displacement angle rounded to whole degrees and the
established tack policy. Earlier edits never rewrite later headings.

Manual heading adjustment by field, handle, or wheel disables alignment for
that boat in that keyframe. Other boat/keyframe pairs remain eligible. A
cancelled boat move restores position and heading together; a cancelled
rotation also restores its prior alignment setting. A contextual explanation
describes the current behavior without adding a boolean control. ADR 0006
owns persistence of these editor settings separately from Scenario data.
