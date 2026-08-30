# ADR 0003: Local Development Environment

Status: Accepted

Date: 2026-08-30

## Context

The primary development machine is Windows. The project should still feel easy to edit and run, while keeping agent tooling close to CI and deployment environments.

## Decision

Use Windows host plus WSL2 Ubuntu as the canonical local development environment.

The repo should live in the WSL filesystem. VS Code opens the repo through the WSL extension. Browser testing and preview happen normally from Windows.

## Consequences

This avoids many Windows-specific scripting and filesystem issues while preserving a normal Windows laptop workflow.

macOS and Linux remain supported contributor environments.
