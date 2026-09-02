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
- human approval before merge except for explicitly authorized "I'm Feeling
  Lucky" runs merging their own green pull requests
- Codex as primary engineering cockpit
- ChatGPT as thinking room
- GitHub as durable source of truth
- GitHub Issues as the live delivery queue, with `ready` for small actionable
  slices and `roadmap` plus area labels for broader outcomes
- GitHub milestones for release scope and order; sub-issues and dependencies
  for decomposition and blocking relationships
- repository docs for durable product direction and decisions, not duplicated
  commit, pull-request, or next-work status
- fresh sessions resume by inspecting open pull requests and then selecting the
  lowest-numbered unblocked `ready` issue unless the user reprioritizes
- an explicit hands-free "I'm Feeling Lucky" mode which extends that workflow,
  records decisions in GitHub issue comments, refines large issues before
  coding, asks only for the user's weekly usage-stop percentage at launch, and
  stops at defined checkpoints once reported usage reaches that percentage
- a Sol High parent for hands-free orchestration, with explicit per-subagent
  model and reasoning settings chosen from a conservative confidence ladder
- a sailor-facing deployed proof as part of the definition of done for every feature slice
- domain-semantic browser assertions for scenario diagram changes, alongside visual inspection

## Consequences

Agents can work independently without sharing one fragile working tree. The repo must include enough docs and tests for an agent to resume from scratch.

Consistent, outcome-oriented titles make the delivery history useful as a
high-level project log without coupling titles to issue numbers.

Delivery status does not need a hand-maintained repository ledger. A fresh
agent reconstructs it from GitHub, then loads only the durable owner docs needed
for the selected issue. Creating and curating issues replaces copying GitHub
state into Markdown after each merge.

Hands-free work remains bounded and reviewable: an agent takes one issue at a
time, avoids known conflicts, and leaves its material choices in the selected
issue. A user-selected weekly usage-stop percentage prevents it from beginning
further costly work after the account reports that threshold has been reached.

An explicitly authorized hands-free run makes contained, reversible decisions
using its best judgment and records them in the issue. It may merge its own pull
request when the required checks pass, the decision record is complete, and
branch protection permits it; it cannot bypass protection or merge another
agent's work.

Subagents can protect the parent context from noisy intermediate work, but each
also consumes its own context and tool calls. Delegation is therefore justified
by context isolation, parallel progress, or a confidently cheaper model rather
than an assumption that spawning always reduces total usage.

A GitHub Project is deferred until custom priority fields, dates, iterations,
or cross-repository planning would repay its additional maintenance. Milestones
and issue metadata are sufficient for the current single-repository roadmap.

Diagram verification must compare rendered geometry and sailing conclusions to
the validated scenario record. Rendering successfully is not, by itself, a
passing result.
