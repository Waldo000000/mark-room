# ADR 0006: Persistence And AI

Status: Accepted

Date: 2026-08-30

## Context

The project wants a fast local development loop and a path to production, but early database migrations and auth complexity previously slowed progress.

## Decision

Do not use a runtime database for initial milestones.

Store canonical corpus data in Git as validated files. Use browser storage for anonymous local quiz progress and draft scenarios.

Opening a corpus scenario from the viewer creates an editable local draft and
retains the selected keyframe. If a valid saved draft differs from the incoming
Scenario, the editor offers explicit replacement or retention before changing
it, including when both records have the same ID. After the choice, consume the
incoming URL request so reloading cannot overwrite subsequent local edits.
This path never writes back to the corpus or changes verification status.

Draft storage also retains the boat/keyframe pairs whose headings were set
manually, disabling the movement-alignment aid described in ADR 0005 for those
pairs. This optional editor metadata stays outside Scenario JSON and exports.
Older drafts without it start with alignment enabled; malformed or stale pairs
are ignored. Import, reset, and incoming-draft replacement start fresh settings,
while retaining a conflicting saved draft retains its settings too.

Use OpenAI only initially for AI features, behind a small internal AI service boundary. Do not add multi-provider abstraction before it solves a demonstrated problem.

## Consequences

Release 1 can avoid auth, database migrations, RLS, account ownership, and server persistence.

Postgres with Drizzle remains the preferred later direction when persistence or retrieval scale requires it.
