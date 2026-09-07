# Architecture

## Core Shape

MarkRoom is a responsive web app with a typed domain model and validated corpus files.

The first implementation should use:

- Next.js with React and TypeScript
- Tailwind CSS and shadcn/ui
- Zod for schema validation
- JSON files for canonical scenarios and source records
- SVG for the Release 1 scenario viewer
- Playwright for browser and mobile viewport tests
- Vercel for production and PR preview deployments

As of 2026-08-30, Next.js 16 is Active LTS. Prefer the current Active LTS at repo initialization rather than pinning the earlier planning-chat mention of Next.js 15.

## Boundaries

Keep these boundaries clean:

- `domain`: scenario types, geometry, findings, validation helpers, quiz derivation
- `corpus`: source records, normalized scenario JSON, validation fixtures
- `viewer`: renderer adapters and UI components
- `app`: route composition and product screens
- `ai`: small internal interface for OpenAI-backed features when introduced

The scenario model should not know whether it is displayed by SVG, Canvas, Konva, screenshots, or tests.

## Quiz Framing

When a recorded moment includes a give-mark-room obligation, practice focuses
on who is owed mark-room. Keep-clear and keep-clear-rule questions are omitted
for that moment. Existing viewer quiz links use the mark-room question when
there is one unambiguous entitlement. Feedback preserves any simultaneous
keep-clear obligation owed by the boat receiving mark-room; the quiz does not
alter the structured ruling.

## Persistence

Initial milestones should not have a runtime database.

Use:

- Git for canonical corpus and source records
- build-time validation for corpus integrity
- browser storage for anonymous local quiz progress and draft scenarios

Introduce Postgres later only when a concrete feature needs server-side persistence, scale, semantic retrieval infrastructure, shared libraries, accounts, or production data ownership rules.

When Postgres becomes necessary, prefer Drizzle and keep migrations boring. Early migration difficulty is a reason to delay the database, not to introduce an in-memory fake that will need replacing.

## AI

Use OpenAI only initially, behind a small internal service boundary.

Do not:

- create premature multi-provider abstractions
- call OpenAI directly from React components
- rely on unstructured model output for canonical rulings

Do:

- ask the model for candidate structured findings
- validate those findings
- retrieve supporting corpus records
- present citations and caveats

## Rendering

The editor moves existing course marks through pointer/touch dragging or numeric
X/Y controls. Both paths update the same bounded Scenario coordinates, so the
mark, derived zone, local draft, and JSON export agree across every keyframe.
Dragging a mark does not change the selected boat or any boat state.
Existing mark controls also edit its optional label, positive physical radius
in hull lengths, and optional required rounding side. Clearing the label uses
the stable mark ID for display; unspecified rounding side makes no course
requirement claim. The physical radius does not change the rules-zone radius.
The editor can add marks with unused course-feature IDs and remove individual
marks, including the last one. Removing a mark detaches optional layline links
to it while preserving those laylines' geometry and all other Scenario data.

Adding a boat creates an unused identity and one state in every keyframe, then
selects it at the current position. Default placement is deterministic and
bounded, favoring separation where space permits; initial heading and tack
come from the previously selected boat in each keyframe. Existing geometry and
manual-heading settings remain intact, while the new boat's positions start
with the default movement-alignment behavior.

Release 1 viewer: React + SVG.

Reasoning:

- few objects per scenario
- crisp vector diagrams
- inspectable elements
- native pointer events
- easier Playwright tests
- readable implementation for agents

Release 2 editor: decide after an explicit SVG vs react-konva mobile interaction spike.

Prefer SVG unless the spike demonstrates that react-konva materially simplifies the code or improves touch manipulation.

## Deployment

Use Vercel:

- production deployment from protected `main`
- preview deployment for every pull request
- CI gates before merge

## Architecture Principle

Prefer the simplest implementation that delivers the required user experience. Add abstraction or sophistication only when it solves a demonstrated problem.
