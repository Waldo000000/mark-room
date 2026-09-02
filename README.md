# MarkRoom

MarkRoom is a mobile-first web app for learning and applying the Racing Rules of Sailing, starting with radio sailing and growing toward broader sailing use.

The product teaches rules through authoritative explanations, animated scenario diagrams, structured rulings, and quizzes. Over time it should also help sailors construct or import real incidents, compare them with a curated corpus, and reason about which rules apply.

## Repository Purpose

This repository should be the durable source of truth for the project.

Everything important belongs in Git:

- product vision and scope
- architecture decisions
- corpus provenance
- scenario schemas
- agent instructions
- testing expectations
- backlog and phase definitions
- deployment and workflow conventions

ChatGPT, Codex, and other agent conversations are useful working rooms, but they are not authoritative project memory. When a durable decision is made in conversation, record it here.

## Initial Product

Release 1 is deliberately narrow:

- mobile-first rules explorer
- curated canonical scenarios for core boat-on-boat rules
- keyframe-based animated scenario viewer
- deterministic quiz mode over known scenarios
- authoritative rules citations and provenance
- explicit verification status for every scenario

Release 1 does not include accounts, payments, a runtime database, native apps, full offline mode, or open-ended AI rulings for arbitrary user scenarios.

## Current App

The first runnable web app lives at the repository root. It is a minimal
mobile-first MarkRoom surface with:

- an honest coming-soon page
- a first unverified sailing scenario rendered from validated data
- hull-length geometry with equal-size one-unit boats and a visible scale
- a Next.js, TypeScript, and Tailwind scaffold
- a Vercel-ready path for production and pull-request previews

Run it locally with:

```bash
npm ci
npm run dev
```

Node 24 and npm are the repository standard. `.nvmrc`, `package.json`, CI, and
Vercel are kept aligned; native Windows, WSL2, macOS, and Linux are supported.

Run the current CI checks locally with:

```bash
npm run check:project
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## Recommended Stack

Use a conventional, agent-friendly web stack:

- Next.js, TypeScript, React
- Tailwind CSS
- shadcn/ui when the first real component needs it
- validated JSON corpus in Git
- Zod schemas and build-time validation
- Playwright for end-to-end and mobile viewport testing
- Vitest or the repo-selected unit test runner for pure domain logic
- Vercel for production and pull-request preview deployments

As of 2026-09-01, Next.js 16 is Active LTS and Next.js 15 is Maintenance LTS.
The repository uses Node 24 LTS for local development, CI, and Vercel.

## Start Here

Read these files first:

- [AGENTS.md](AGENTS.md)
- [docs/00-vision.md](docs/00-vision.md)
- [docs/03-architecture.md](docs/03-architecture.md)
- [docs/07-agent-git-workflow.md](docs/07-agent-git-workflow.md)
- [docs/08-dev-setup-windows-wsl.md](docs/08-dev-setup-windows-wsl.md)
- [docs/13-non-goals.md](docs/13-non-goals.md)
- [docs/14-source-notes.md](docs/14-source-notes.md)
- [GitHub Issues](https://github.com/Waldo000000/mark-room/issues) for live
  delivery priorities and roadmap decomposition

## Naming

Working product name: **MarkRoom**

Repository/package slug: **mark-room**

The name is a working name, not final trademark clearance. It intentionally evokes the sailing concept of mark-room and the editor action of marking boat positions.

## License Intent

Application source code should use Apache-2.0.

Corpus content, copied source text, official diagrams, and derived scenario data require separate licensing and provenance review. Do not assume that publicly visible World Sailing material can be republished wholesale.
