# ADR 0002: Development And Agent Workflow

Status: Accepted

Date: 2026-08-30

Amended: 2026-09-02

## Context

The project is intended to be developed with multiple agents working in parallel. The user wants all durable context in Git and wants to supervise work from both laptop and mobile. Pull request history must remain skimmable enough to show what each small change delivered without opening its diff.

## Decision

Use:

- public GitHub repo
- protected `main`
- every change through a pull request
- descriptive `type(scope): outcome` pull request titles using the compact
  vocabulary defined in `AGENTS.md`
- one branch/worktree per issue or agent
- human approval before merge
- Codex as primary engineering cockpit
- ChatGPT as thinking room
- GitHub as durable source of truth
- a sailor-facing deployed proof as part of the definition of done for every feature slice
- domain-semantic browser assertions for scenario diagram changes, alongside visual inspection

## Consequences

Agents can work independently without sharing one fragile working tree. The repo must include enough docs and tests for an agent to resume from scratch.

Consistent, outcome-oriented titles make the delivery history useful as a
high-level project log without coupling titles to issue numbers.

Diagram verification must compare rendered geometry and sailing conclusions to
the validated scenario record. Rendering successfully is not, by itself, a
passing result.
