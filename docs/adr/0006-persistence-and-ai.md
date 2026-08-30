# ADR 0006: Persistence And AI

Status: Accepted

Date: 2026-08-30

## Context

The project wants a fast local development loop and a path to production, but early database migrations and auth complexity previously slowed progress.

## Decision

Do not use a runtime database for initial milestones.

Store canonical corpus data in Git as validated files. Use browser storage for anonymous local quiz progress and draft scenarios.

Use OpenAI only initially for AI features, behind a small internal AI service boundary. Do not add multi-provider abstraction before it solves a demonstrated problem.

## Consequences

Release 1 can avoid auth, database migrations, RLS, account ownership, and server persistence.

Postgres with Drizzle remains the preferred later direction when persistence or retrieval scale requires it.
