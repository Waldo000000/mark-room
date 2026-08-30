# Development Setup: Windows, WSL2, VS Code

The canonical local setup is Windows host plus WSL2 Ubuntu. Codex can run on Windows while the repo and development commands live in Ubuntu.

This is an implementation choice for local development, not a product requirement. macOS and Linux contributors should also be able to run the repo normally.

## Recommended Shape

- Windows laptop
- WSL2 with Ubuntu
- repo cloned inside the WSL filesystem
- VS Code on Windows using the WSL extension
- browser on Windows
- dev server running inside WSL
- Git, Node, pnpm, tests, and Playwright running inside WSL

Avoid cloning the repo under `C:\` for WSL development. Keep it under the Ubuntu home directory for better performance and fewer filesystem surprises.

## Fresh Machine Checklist

1. Install WSL2 and Ubuntu.
2. Install VS Code.
3. Install the VS Code WSL extension.
4. In Ubuntu, install Git.
5. Configure Git name and email.
6. Install Node LTS.
7. Enable Corepack.
8. Prepare pnpm through Corepack.
9. Clone the GitHub repo into the WSL filesystem.
10. Open the repo with VS Code from WSL.
11. Install dependencies.
12. Run type check, tests, and the dev server.

## Typical Commands

These commands are a starting point and should be refined once the actual scaffold exists.

```bash
wsl --install -d Ubuntu
```

Inside Ubuntu:

```bash
sudo apt update
sudo apt install -y git curl unzip
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

Install Node using a version manager such as fnm, mise, or nvm. Prefer Active LTS. As of 2026-08-30, Node 24 is Active LTS and Node 26 is Current.

Then:

```bash
corepack enable
corepack prepare pnpm@latest --activate
git clone git@github.com:<owner>/mark-room.git
cd mark-room
pnpm install
pnpm test
pnpm dev
```

Open from WSL:

```bash
code .
```

## Codex Operating Notes

Use Codex as the main engineering cockpit. It can manage tasks and worktrees while the durable state remains in Git.

Use ChatGPT mobile to supervise, discuss, redirect, and continue work. Do not store project decisions only in chat memory.
