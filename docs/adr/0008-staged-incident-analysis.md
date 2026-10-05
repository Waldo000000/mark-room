# ADR 0008: Test fact boundaries with inspectable incident analysis

Status: Proposed

Date: 2026-10-05

## Context

The user wants to understand whether the Scenario / Situation / Ruling model
can support difficult sailing incidents before investing further in it.
[ADR 0007](0007-reasoning-boundary-experiment.md) established that a finite
physical-clearance result can cross a detached data boundary. It did not
establish that clearance is sufficient evidence for a ruling.

The current Situation includes a boolean `available-room`. Ruling contains
obligations as well as outcomes. That ordering is suspect: what constitutes
room can depend on the recipient's obligations to other boats. Serializing
the answer earlier does not remove that dependency.

This proposal describes an experiment, not a production migration. The accepted
contract in [ADR 0004](0004-scenario-model-and-corpus.md), current corpus and
production schemas remain in force pending a separate acceptance decision.

## Decision

Preserve **Situation as the relevant sailing facts** and Ruling as the rule
conclusions. Give the broader explanation its own name: the **analysis report**.
It shows facts, obligations, response evidence and conclusions with their
dependencies. Inspectability does not require changing Situation's meaning.

Test the strict Scenario-to-Situation-to-Ruling boundary first. Consider a
rule-directed assessment alternative only when a demonstrated dependency makes
the strict implementation awkward or misleading. Neither Case 147 nor the
clearance prototype disproves a strict boundary. The experiment must establish
which facts a supported ruling needs and whether Scenario can supply them.

Scenario remains the authored description of the incident. An analysis also
identifies the applicable rules context, the input revision, and any additional
model assumptions. These assumptions are research inputs, not new editor
settings or an override mechanism.

### A reading order, not a mandatory single pass

| Stage                       | Question                                                       | Output                                                                   |
| --------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Input and reconstruction    | What was supplied, and what motion does it actually establish? | Authored facts, supported reconstruction, explicit gaps and assumptions  |
| Observations and events     | What relationships and changes occurred, and when?             | Scoped observations, intervals and transitions                           |
| Rights and obligations      | What applies to whom during this part of the incident?         | Rule-linked duties, entitlements and applicability conditions            |
| Response assessment         | What responses were available in that context?                 | Evidence about actual and hypothetical manoeuvres, with limitations      |
| Breach assessment           | Does the evidence establish a particular breach?               | Separate supported, conditional or unresolved findings                   |
| Exoneration and disposition | What follows from each established breach?                     | Exoneration and any supported consequence, with unresolved prerequisites |

The stages are explanation categories. Test their execution order against the
specific question's dependencies. A candidate manoeuvre introducing another
event and obligation is a possible dependency to investigate, not a result
demonstrated by Case 147. Establish such dependencies in a simultaneous
multi-boat example before using them to justify an architectural change.

Represent these dependencies explicitly in the report. Begin with ordinary
TypeScript functions and a hand-written analysis sequence for one incident
family. Do not build a general workflow language, graph executor, fixed-point
solver, database or persistent analysis history. A dependency that cannot yet
be resolved produces an unresolved finding, not a guessed result or an
unbounded iteration.

### Three boundaries worth protecting

1. **Input versus inference.** Never silently replace authored facts with a
   reconstructed or hypothetical account. The current playback duration is a
   presentation convention, not incident timing. A change in drawn heading is
   not automatically a measured change in the boat's trajectory.
2. **Physical evidence versus rule judgment.** The motion evaluator can assess
   a specified response under a named model. It does not decide what a boat was
   entitled to, whether handling was seamanlike, or whether a breach is
   exonerated. The rule analysis owns those questions and their source basis.
3. **Supported conclusions versus explanation.** The analysis report displays
   the recorded findings and their dependencies; it does not silently run new
   geometry queries. A conclusion links to its evidence instead of being
   independently recreated for the UI.

Timing or velocity is not inherently an abstraction leak. The failure would be
making downstream code reinterpret raw tracks without a declared purpose and
assumptions. Physical evidence may include a duration, clearance bound or
response trace when that is necessary to inspect the claim.

### Where the geometry goes

In the strict candidate, a producer derives scoped Situation facts; the rule
evaluator consumes only those facts with no Scenario or geometry access.
Compare the next alternative only if the worked examples establish a need.

In the rule-directed candidate, an incident-analysis coordinator can access
Scenario and invoke physical assessment. A rule function consumes named
findings or states a missing assessment requirement; it does not receive an
unrestricted geometry callback.

For the experiment, one assessment requirement identifies the duty being
examined, boats, interval, actual or hypothetical branch, response assumptions
and the precise physical question. The coordinator evaluates the request and
returns evidence with that same scope. Rule interpretation remains outside the
physical evaluator. Do not hide an entire ruling behind a method named
`hasRoom`.

This alternative permits rule-directed analysis of an encounter. A broad
Scenario API exposed to every rule is not the proposed replacement. If needed,
add only the assessment operation justified by a worked example, then challenge
it with the next case. Do not build both engines merely to fill a comparison.

### What a finding must preserve

A small experimental record needs an identifier, claim, boats and interval,
actual/hypothetical branch, dependencies, evidence references, assumptions and
evaluation status. These are design requirements, not a committed schema.

Keep two distinctions separate:

- **Basis:** supplied source fact, derived observation, or explicit assumption.
- **Assessment:** established, contradicted, or unresolved, including the
  reason for an unresolved result.

A finding depending on an assumption remains conditional when shown to the
user. An unsupported rule, missing timing and a numerical resolution limit are
different reasons for not concluding. None means the proposition is false.
Deterministic execution can return an unresolved answer; that does not require
a confidence percentage or a probabilistic engine.

Source-based fixtures may provide facts for testing the rule analysis. Those
facts must remain visibly source-supplied. Reproducing the source answer from
them is not evidence that geometry can derive them, and introduces no sailor
override UI.

## Worked Analysis

### Start with the user's two-boat luff

Use L and W on the same tack with established overlap. The experiment must
declare its history and rules scope, rather than silently excluding Rule 15 or
Rule 17 because the visible drawing starts after the overlap began.

The relevant rule baseline is compact: Rule 11 imposes the windward boat's
keep-clear duty; Rule 16.1 constrains the right-of-way boat's course change.
Rule 15 concerns acquisition of right of way, not every luff. Room includes
prompt, seamanlike handling in the existing conditions and compliance with
other relevant obligations. See the official [definitions](https://media.sailing.org/sailing/wp-content/uploads/2025/07/29083752/2025-2028-RRS-with-Changes-and-Corrections.pdf#page=15)
and [Rules 11, 15-17](https://media.sailing.org/sailing/wp-content/uploads/2025/07/29083752/2025-2028-RRS-with-Changes-and-Corrections.pdf#page=21).

| Step        | What the experiment should expose                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Input       | The authored positions, event order and available history; actual durations only if supplied                                               |
| Observation | Overlap and relative windward position; the supported course-change interval, with its reconstruction basis                                |
| Obligation  | Each applicable duty, its trigger and the interval being assessed                                                                          |
| Assessment  | The actual response separately from alternative responses; declared response delay, handling model and what was knowable when action began |
| Breach      | A Rule 16.1 finding only if the required room assessment is supported; a separate Rule 11 finding from the actual incident                 |
| Disposition | Exoneration checked against the particular breach and its causal basis; no blanket assertion that every rule was obeyed                    |

For today's geometric prototype the honest end result remains: **physical
witness found under synthetic assumptions; legal room not established**. A
slower luff is a useful experimental variable, not a legal threshold. This is a
complete account of the prototype's evidence and limits, not a completed ruling.

The next implementation must demonstrate both a complete source-grounded
conclusion and this unresolved path. Otherwise it could appear successful by
either assuming away the hard predicate or declining every hard question.

### Add the third boat

[Case 114, question 2](https://media.sailing.org/sailing/wp-content/uploads/2025/07/31104846/WS-Case-Book-2025-2028-v2025-07.pdf#page=253)
confirms that L's room for middle boat M must accommodate M giving room to W.

Our architectural inference: start the assessment from a network of duties,
not an isolated L/M distance. Preserve one compatible response branch across
all affected boats. Do not combine an M manoeuvre from one candidate with a W
manoeuvre that assumed a different M track. Nor should moving W farther away
automatically produce a legal conclusion: the rest of the evidence still has
to support it.

This does not justify evaluating every boat in a fleet. Start with the incident
participants and expand when an observation or duty identifies another relevant
boat. The participant set and analysis horizon are explicit limits; absence of
a boat from the input is not proof that it could not matter.

### A pairwise, time-dependent baseline

[Case 147](https://media.sailing.org/sailing/wp-content/uploads/2025/07/31104846/WS-Case-Book-2025-2028-v2025-07.pdf#page=317)
provides this chain:

Scope this path to S's encounter with PB; PA's earlier interaction supplies
context. Use the source's rules context, without silently converting it into a
radio-sailing ruling.

| Stage           | Source-backed finding                                         |
| --------------- | ------------------------------------------------------------- |
| Event           | Starboard boat S avoids PA, then luffs toward PB              |
| Obligation      | S has right of way over PB; S's luff activates the room duty  |
| Response limits | PB cannot keep clear by tacking or maintaining course         |
| Further action  | S promptly bears away to avoid PB                             |
| Room conclusion | That further course change satisfies S's Rule 16.1 obligation |
| Breach          | PB breaks Rule 10                                             |
| Exoneration     | PB is exonerated under Rule 43.1(b) and reinstated            |

This is a source-based reasoning fixture, not a geometric reconstruction or a
new canonical corpus entry. The experiment must account for each step instead
of recognizing a case identifier and returning a stored answer.

This case supports pairwise reasoning through time; it does not show that
independent pairs fail or that response assessment activates another duty.
Use Case 114's linked obligations to investigate those harder questions.
Pairwise rules may remain useful if their assessments preserve compatible
actions and assumptions across the group.

The narrower lesson is that evaluating only the keep-clear boat's
options against a frozen future for the right-of-way boat is insufficient.
Likewise, rejecting every branch containing a breach would lose a valid
exoneration analysis. The report must retain breach and exoneration as separate
claims. It must also distinguish actions that actually happened from
cooperative actions a simulation merely imagines.

Under [Rule 43](https://media.sailing.org/sailing/wp-content/uploads/2025/07/29083752/2025-2028-RRS-with-Changes-and-Corrections.pdf#page=35),
exoneration is tied to specified conditions and breaches. It is not a global
"boat innocent" flag. A missing breach finding cannot be replaced by an
exoneration finding, and an exonerated breach must not disappear from the
explanation.

## Consequences

### Source-fact baseline

`/experiments/reasoning` implements the bounded S/PB fact consumer for Rules
10, 16.1 and 43. The consumer uses a detached JSON-compatible experimental
packet, with no Scenario or geometry access. It separately reports breach,
room compliance and exoneration. Withheld or contradictory premises leave
dependent conclusions unresolved while preserving independent findings.

The difficult room, entitlement and causal assessments remain explicitly
source-supplied. Reproducing this answer demonstrates inference dependencies,
not automatic derivation of those assessments. Additional context premises
describe the temporal incident without becoming artificial prerequisites for
every rule. The experiment supports the declared general-RRS context only;
its agent transcription is not a human-verified corpus record.

The live editor inspector can show useful observations and duties immediately,
then explain exactly where the reasoning stops. On each edit it recomputes
against that input revision. For the first slice, recompute the small analysis;
do not introduce incremental dependency caching. If analysis later becomes
asynchronous, never present a previous revision's result as current.

The largest unresolved risk is **input sufficiency**, not serialization.
Untimed keyframes cannot identify a unique response opportunity. Nor do points
alone establish handling capability, perception or all relevant events.
Changing the architecture cannot recover information absent from the input.
Use labeled research assumptions and conditional results while investigating
which quantities can be measured, bounded or avoided. Do not ask sailors for
missing facts or add overrides in this experiment.

Possible responses require causal discipline. A physically successful path
chosen after seeing the entire incident is weaker evidence than a response
available using information at the time. The experiment must expose that
distinction and the basis for any handling assumptions. It does not need a
full sailing simulator to discover where its evidence is insufficient.

Reversal cost stays low: production schemas and corpus remain unchanged, and
the report is experimental. Acceptance would require amending ADR 0004, the
Scenario owner and roadmap #29, and deciding how existing Situation and Ruling
records relate to the analysis. Do not migrate or rename those records merely
to match this proposal.

## Alternatives Considered

- **Enlarge a universal Situation packet first.** It could work for a bounded
  question set, but risks relocating all rule analysis upstream while retaining
  an unhelpful name and an artificial execution order.
- **Let every rule inspect arbitrary geometry.** Easy to start, but makes
  assumptions, duplicate calculations and incompatible hypothetical branches
  harder to detect.
- **Build a universal simulator or rule engine now.** Neither is necessary to
  test these boundaries, and neither supplies missing factual evidence.

## Follow-Up

Build one experimental, inspectable Rule 16.1 analysis report using explicit
functions. Show source-fact and geometric-evidence entry paths separately. The
smallest next product slice is a facts-to-rulings report for the pairwise
baseline, followed by attempted geometric derivation of its required facts,
the simultaneous multi-boat challenge, and a held-out mark-room example.
Expose supported findings in the editor after their claims and unresolved
states are credible. Keep architecture acceptance separate from experimental
results; a recommendation does not authorize a production schema migration.

Use the following challenges as acceptance gates, not an instruction to
implement every rule family at once:

| Challenge                                          | Required distinction                                                                          |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Same geometric path, different known durations     | Time-dependent findings change only with justified timing; deleting timing exposes dependence |
| L/M pair unchanged, W added or moved               | Shared response compatibility and newly relevant duties survive the analysis boundary         |
| Same current positions, different overlap history  | Applicability cannot be inferred from the final snapshot alone                                |
| Identical incident prefix, different later actions | Early available-response claims cannot use future knowledge                                   |
| Case 147                                           | Breach, room and exoneration coexist without contradiction or case-ID shortcuts               |
| No successful finite candidate                     | Search incompleteness remains distinct from established impossibility                         |
| Mark-room history and a hail-dependent incident    | Before broader adoption, test whether the stages support reasoning other than luffing         |

Judge the proposal by whether each result has explicit, independently testable
dependencies, and whether one source-supported complete analysis can coexist
with honest unresolved geometric input. Agreement with an answer alone is
insufficient. A universal order is not a success criterion.

Reject or revise the design if simple additions demand arbitrary hidden
Scenario access, if response branches contaminate actual observations, or if
the obligations/assessment split cannot express the source reasoning without
circular assertions. Failure to derive room from the current inputs is an
input/model limitation to investigate, not by itself evidence for either
software architecture.
