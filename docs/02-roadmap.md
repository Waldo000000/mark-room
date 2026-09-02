# Roadmap

## Release 0: Repository And Foundations

Goal: make the repo ready for parallel agents.

Deliverables:

- Next.js app scaffold with TypeScript
- Tailwind setup; add shadcn/ui only when a real component needs it
- linting, formatting, type checking, unit tests, and Playwright
- corpus directory and initial Scenario, Situation, Ruling, and eval schemas
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
- structured expected Situations, obligations, outcomes, and conclusions
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
- edit discrete positions/keyframes, including explicit tack
- undo/redo
- local draft persistence in browser storage
- export/import scenario JSON
- validation warnings for incomplete scenarios

The canonical scenario schema remains independent of renderer choice.

## Release 3: Deterministic Scenario Analysis

Goal: produce reproducible rulings for valid novel scenarios through the same
three-stage pipeline proven by the corpus.

Scope:

- deterministic `Scenario -> Situation` geometry interpretation
- deterministic `Situation -> Ruling` rules evaluation
- boundary evals plus selected end-to-end evals from the curated corpus
- explicit validation and unsupported-coverage errors
- citations to relevant rules and similar scenarios
- optional OpenAI assistance behind a small internal service boundary for input,
  retrieval, and explanation only
- no claim that an unverified corpus transcription is authoritative

## Release 4: Import And Corpus Expansion

Goal: expand the scenario corpus from authoritative and real-world sources.

Scope:

- raw source registry
- extraction tooling
- image/sketch-assisted reconstruction
- broad schema adequacy sampling
- source-to-Scenario and expected-output audit trail
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
