# ADR 0003: Local Development Environment

Status: Accepted

Date: 2026-08-30

Amended: 2026-09-01

## Context

The primary development machine is Windows. The initial plan made WSL2 and a
Linux-hosted checkout mandatory, but the repository, CI, and Vercel were
successfully established with npm and native cross-platform tooling.

## Decision

Use Node 24 and npm as the canonical toolchain. Keep the Node major in `.nvmrc`
and `package.json`, and make CI consume `.nvmrc`.

Support native Windows, WSL2, macOS, and Linux. Do not require a particular
checkout filesystem when the full verification suite passes.

## Consequences

The package lock, commands, and runtime stay consistent across local work, CI,
and deployment. Contributors can choose their operating environment without
creating a second package-management path.

An automated project-consistency check prevents documentation and CI from
silently drifting to a different Node major or package manager.
