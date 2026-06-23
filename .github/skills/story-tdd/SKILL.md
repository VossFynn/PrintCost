---
name: story-tdd
description: 'Implement new stories with strict TDD (Red-Green-Refactor). Use when starting a story, adding behavior, fixing regressions, or reviewing implementation readiness under test-first rules.'
argument-hint: 'Story ID and acceptance criteria to implement with TDD'
user-invocable: true
disable-model-invocation: false
---

# Story TDD

## Outcome
Produce a completed story where behavior is driven by tests first, with clear traceability from acceptance criteria to automated tests.

## When To Use
- Starting any new story implementation.
- Converting vague acceptance criteria into executable behavior checks.
- Fixing a bug in a story path while preventing regressions.
- Reviewing whether a story is truly done (not just manually verified).

## Inputs
- Story ID or title.
- Acceptance criteria (must-have behaviors).
- Non-functional constraints (performance, security, accessibility, offline behavior, etc.).
- Relevant module, component, or service boundaries.

## Procedure
1. Define testable story intent.
2. Decompose criteria into smallest observable behaviors.
3. Select the lowest-cost test level per behavior.
4. Execute Red-Green-Refactor per behavior slice.
5. Run full quality gates and map evidence back to acceptance criteria.

## Step 1: Define Testable Story Intent
1. Restate the story as behavior in a "Given/When/Then" style.
2. Extract explicit acceptance criteria into a checklist.
3. Identify missing or ambiguous criteria before writing production code.

Completion check:
- Each criterion is observable in a test without manual interpretation.

## Step 2: Split Into Behavior Slices
1. Create thin slices that can be implemented independently.
2. For each slice, define:
- expected output or state change
- error/edge case path
- instrumentation or side effects (if applicable)
3. Order slices by risk and dependency, implementing highest-risk path first.

Completion check:
- Every slice can be proven with at least one failing test.

## Step 3: Choose Test Level (Decision Logic)
Use the smallest test scope that can validate the behavior with confidence.

- If logic is deterministic and isolated: write a unit test.
- If behavior crosses class/module boundaries: write an integration test.
- If behavior is user-critical and spans UI flow: write an end-to-end test.
- If a bug was reported in production: first add a regression test at the level that would have caught it.

Quality rule:
- Avoid defaulting to broad E2E tests when a lower-level test gives equivalent confidence.

## Step 4: Red-Green-Refactor Loop
For each behavior slice, run this loop completely before moving on.

1. Red:
- Write one minimal failing test that expresses the next behavior.
- Confirm failure is for the expected reason.
2. Green:
- Write the minimum production code required to pass the test.
- Do not add unrelated features in this step.
3. Refactor:
- Improve structure while keeping tests green.
- Remove duplication and clarify names.
4. Commit discipline:
- Prefer small commits that pair test and implementation for the same behavior.

Stop condition for each slice:
- The new test passes.
- Existing relevant tests still pass.
- No uncovered acceptance criterion was introduced by refactor.

## Step 5: Story Completion Gates
Before marking the story done, verify all gates:

1. Acceptance traceability:
- Each acceptance criterion links to one or more test cases.
2. Regression safety:
- Historical bug paths touched by the story have regression coverage.
3. Test quality:
- Tests assert behavior, not internal implementation details.
- Tests are deterministic (no flaky timing/network assumptions).
4. Code quality:
- Refactor completed after green, not skipped.
- No dead code introduced by speculative implementation.
5. Execution:
- Relevant unit/integration/E2E suites pass locally.

## Branching Rules
- If criteria are unclear: pause implementation and request clarification with proposed assumptions.
- If a test is hard to write first: refactor seams (dependency boundaries) before adding new behavior.
- If implementation grows beyond the current slice: split into additional Red-Green-Refactor cycles.
- If a defect is found during implementation: add a failing regression test first, then fix.

## Definition Of Done (TDD)
A story is done only when:
- All acceptance criteria are automated and passing.
- New behavior was introduced via failing tests first.
- Refactor pass has been completed with green tests.
- The final test run demonstrates no regressions in impacted areas.

## Example Prompts
- /story-tdd Implement story PC-142 using these acceptance criteria: ...
- Use story-tdd to plan test slices for this feature before coding.
- Apply story-tdd to fix this bug with a regression-first approach.