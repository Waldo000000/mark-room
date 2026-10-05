# ADR 0007: Test reasoning boundaries before expanding Situation

Status: Proposed

Date: 2026-10-05

## Context

The concern behind [#144](https://github.com/Waldo000000/mark-room/issues/144)
is whether a self-contained Situation can support time-dependent, multi-boat
reasoning without becoming another copy of Scenario. ADR 0004 remains the
accepted production boundary. This experiment neither supersedes it nor changes
the production Scenario, Situation or Ruling schemas.

The isolated `/experiments/luffing` page compares two implementations using the
same synthetic trajectories and the same finite candidate evaluator:

- Complete findings: evaluate all joint responses, serialize pair findings to
  JSON, then assess that detached packet without geometry imports or callbacks.
- Shared analysis: evaluate those responses on demand against encounter data,
  stopping at the first joint witness.

Neither implementation produces a sailing ruling. The bounded question is
whether a tested combination keeps every model hull clear for five seconds.

## Decision

Keep the production architecture provisional while retaining the existing
boundary. The experiment provides no reason to reject a self-contained
Situation. It also does not establish that the existing Situation vocabulary is
sufficient for Rules 15/16 or mark-room.

Results with `synthetic-luff-v1`:

| Encounter                           | Certified joint response | Complete evaluations | Shared evaluations |
| ----------------------------------- | ------------------------ | -------------------: | -----------------: |
| Two boats, gradual luff             | Found                    |                    9 |                  2 |
| Third boat close to windward        | None in tested set       |                   81 |                 81 |
| Third boat farther to windward      | Found                    |                   81 |                 11 |
| Two boats, abrupt luff              | None in tested set       |                    9 |                  9 |
| Two boats, delayed response subset  | None in tested set       |                    3 |                  3 |
| Three boats, incompatible responses | None in tested set       |                   81 |                 81 |

Both implementations agree on the result and first witness. Agreement checks the
boundary, not independent correctness: they intentionally share the evaluator.
The larger complete packet and extra evaluations are choices in this prototype,
not intrinsic costs of separation. A scoped producer could stop early and emit
a compact certificate, provided its contract states what it has established.

The most important result is that **joint compatibility must survive the
boundary**. Separate pairwise claims that each boat has some response do not
establish that one response works for the group. Candidate identifiers preserve
that relationship here without passing trajectories to the consumer.

This also exposes where the hard work lives: the producer establishes physical
clearance. Moving a conclusion into a findings packet does not make its
derivation easy, nor prove it is the correct legal predicate. A boundary can be
perfectly isolated while its upstream model is wrong.

## Consequences

The prototype is inspectable from the home page. Changing the encounter updates
the assessment; a response selector and time scrubber expose the underlying
hypothetical motion and its evidence. It is not yet the editor's live Situation
inspector.

The model declares identical one-unit capsule hulls of width 0.4, speed 0.8 hull
lengths/second, initial heading 300 degrees, north wind, and 45-degree luffs.
Responses combine delays 0.25/0.6/1 seconds with turn rates 12/24/36 degrees per
second. These are uncalibrated hypotheses, not RRS thresholds. There is no speed
loss, equipment contact, current, sheet handling or tacking model.

Straight segments and constant-rate arcs are integrated analytically. Capsule
clearance is sampled at intervals no greater than 0.025 seconds. A conservative
motion bound certifies the entire interval: each capsule axis endpoint moves no
faster than speed plus half-axis length times angular speed, so the sum of the
two endpoint bounds times half the sample interval bounds possible clearance
loss between samples. Unresolved bounds are distinct from observed hull
intersection. Tests additionally check hull geometry, motion, finer sampling,
JSON-only consumption, joint compatibility and mobile review controls.

A witness is sufficient only for this model's hull-clearance question. Absence
of a certified candidate is not proof that no manoeuvre exists or room was
insufficient. An actual delayed response cannot erase an earlier opportunity.
Responses begin after the triggering boat starts turning, but selecting the
successful candidate retrospectively does not prove a sailor could identify it
without foresight.

## Alternatives Considered

- Freeze a universal geometry-free Situation now: premature without a defined
  supported question set and evidence that it preserves those distinctions.
- Give the ruling engine unrestricted Scenario/geometry access: this experiment
  does not demonstrate the need; it would weaken an existing boundary without
  answering the harder domain questions.
- Declare a shared encounter model the winner because it evaluates fewer
  candidates: misleading, since a strict producer can also evaluate lazily.
- Treat positive geometric clearance as room: unsupported. Room includes
  seamanlike manoeuvring and relevant obligations, not just disjoint hulls.

## Follow-Up

[ADR 0008](0008-staged-incident-analysis.md) develops the proposed next
experiment: inspectable staged analysis with Situation retaining its factual
meaning and a strict-boundary baseline before any rule-directed alternative. It remains
proposed and does not replace the accepted production boundary.

Before extending the production schema, define one source-backed Rule 16.1
question and the facts that could justify its answer. Distinguish observed
events, available responses, obligations, and conclusions. Require a complete
example from input to conditional ruling with unresolved facts represented
honestly. Rules 15, mark-room, exoneration and general collision avoidance remain
outside this prototype.

Then use paired examples to challenge sufficiency: preserve the proposed
findings while changing timing, a third boat's obligations, or what was knowable
when action became necessary. If the supported answer must change, identify the
missing domain fact. Add that fact only if it has a useful, independently
testable meaning. If the contract repeatedly needs arbitrary new hypothetical
trajectory queries, reconsider shared encounter analysis through a new accepted
decision. Do not expand the response library merely to disguise an undefined
legal predicate.

Official source anchors are World Sailing
[Case 114](https://media.sailing.org/sailing/wp-content/uploads/2025/07/31104846/WS-Case-Book-2025-2028-v2025-07.pdf#page=253)
(room and obligations through a group) and
[Case 92](https://media.sailing.org/sailing/wp-content/uploads/2025/07/31104846/WS-Case-Book-2025-2028-v2025-07.pdf#page=213)
(responding without required foresight). The synthetic trajectories are not
reconstructions or verified transcriptions of either case.
