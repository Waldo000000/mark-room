# Roadmap

## Release 0: Repository And Foundations

Goal: make the repo ready for parallel agents.

Deliverables:

- Next.js app scaffold with TypeScript
- Tailwind and shadcn/ui setup
- linting, formatting, type checking, unit tests, and Playwright
- corpus directory and initial Zod schemas
- scenario fixture examples
- CI workflow
- Vercel preview and production deployment
- ADR structure
- agent workflow docs

## Release 1: Rules Explorer, Canonical Scenarios, Quiz

Goal: a useful mobile-first learning product with no LLM dependency for the basic experience.

Scope:

- radio sailing beachhead
- core boat-on-boat rules first
- Part 2, dependent definitions, relevant Appendix E modifications, and surrounding rules required by curated scenarios
- approximately 20 to 40 high-quality canonical scenarios
- keyframe-based scenario viewer
- timeline scrubber or position selector
- structured findings and conclusions
- rule citations and source provenance
- deterministic quiz scoring for known scenarios
- clear verification status in UI

Not in Release 1:

- user accounts
- payments
- server-side persistence
- arbitrary scenario analysis
- native apps
- full offline mode

## Release 2: Scenario Editor

Goal: users can construct and edit keyframe-based scenarios.

Scope:

- mobile-first editor interaction spike
- SVG vs react-konva comparison for editing
- selected renderer documented by ADR
- add, move, rotate, and label boats
- place marks, zones, and course features
- edit discrete positions/keyframes
- undo/redo
- local draft persistence in browser storage
- export/import scenario JSON
- validation warnings for incomplete scenarios

The canonical scenario schema remains independent of renderer choice.

## Release 3: AI-Assisted Scenario Analysis

Goal: help users reason about novel scenarios without treating the model as an oracle.

Scope:

- OpenAI-only backend behind a small internal AI service boundary
- retrieval over curated corpus
- candidate structured findings
- citations to relevant rules and similar scenarios
- confidence/caveat presentation
- user-editable facts
- no claim of authoritative ruling unless the scenario has been verified

## Release 4: Import And Corpus Expansion

Goal: expand the scenario corpus from authoritative and real-world sources.

Scope:

- raw source registry
- extraction tooling
- image/sketch-assisted reconstruction
- broad schema adequacy sampling
- source-to-normalized scenario audit trail
- agent review workflow
- human verification workflow

## Later

Potential later directions:

- authentication
- saved scenario libraries
- cross-device progress
- shared scenarios
- Postgres-backed persistence and retrieval
- payments or subscriptions
- richer video import
- PWA/offline support
- native apps, only if web proves insufficient
