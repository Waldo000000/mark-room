# Codex And ChatGPT Operating Model

## Roles

Use Codex as the main engineering environment.

Use ChatGPT as a thinking room for:

- brainstorming
- voice notes
- product clarification
- research synthesis
- deciding tradeoffs before implementation

Use GitHub as the source of truth.

## Durable Memory Rule

If a decision matters tomorrow, it goes into Git.

Acceptable durable forms:

- ADR
- Markdown plan
- issue
- pull request
- schema
- test
- source comment when tied to implementation

Conversation memory is convenient, but it is not authoritative.

## Mobile Workflow

The desired workflow is:

- laptop/Windows host runs the development environment
- agents work in Codex tasks and worktrees
- user can supervise and redirect from mobile through ChatGPT/Codex Remote
- all durable outcomes land in GitHub

## Agent Delegation

Good tasks for agents:

- implement a focused route or component
- add schema validation
- build a scenario fixture
- write Playwright coverage
- research source provenance
- review a PR
- run a renderer spike

Poor tasks for agents:

- vaguely "make the app better"
- rewrite the architecture without an ADR
- import a large corpus without provenance rules
- change shared dependencies while other agents are mid-flight

## Handoff Standard

When handing work to another agent, include:

- issue or task goal
- relevant docs to read
- files likely touched
- tests expected
- what counts as done
- what must not be changed
