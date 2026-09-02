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

- `scenario`: editor-controlled geometry and directly observed actions
- `situation`: self-contained RRS-language moments and transitions
- `ruling`: deterministic obligations and outcomes
- `domain`: pure transforms and validation helpers between those models
- `corpus`: eval inputs/expected outputs plus provenance and verification sidecars
- `viewer`: renderer adapters and UI components
- `app`: route composition and product screens
- `ai`: small internal interface for OpenAI-backed features when introduced

No domain model should know whether it is displayed by SVG, Canvas, Konva,
screenshots, or tests. A rules transform consumes Situation only and never
reaches back into Scenario geometry.

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

- ask the model only for assistive input, retrieval, or explanatory output
- validate all structured output at its domain boundary
- retrieve supporting corpus records
- present citations and caveats

## Rendering

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
