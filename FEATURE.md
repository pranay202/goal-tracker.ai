# Feature record — MVP goal-to-today loop

## Scope

Build a person’s first complete planning cycle:

1. Choose one to three life areas and create a measurable goal.
2. Add an inbox task or flexible habit linked to that goal.
3. Schedule it into Today.
4. Complete, skip, fail, or reschedule it.
5. See accurate goal progress and use a weekly review to choose the next action.

## Acceptance criteria

- A goal stores a name, life area, baseline, target, unit, deadline, and
  progress mode.
- An inbox task can be captured without leaving the current context and later
  linked to a goal.
- A habit supports a target count per week, month, or year; it is not modelled
  only as a daily streak.
- Today displays only actionable scheduled work and exposes complete, skip,
  fail, and reschedule distinctly.
- Progress updates only according to the selected goal progress mode.
- Weekly review exposes missed work for deliberate cleanup rather than silently
  accumulating overdue items.

## What was tried

Product research compared goal-first, visual planning, task-first, and
feature-dense planning products. The chosen scope keeps Griply-like goal
traceability while borrowing low-friction daily planning principles. The first
Expo slice used an in-memory repository, then replaced only the data adapter
with a versioned SQLite snapshot so existing goal, Today, and review behavior
survives app restarts.

## Verification status

Implemented as a runnable Expo TypeScript vertical slice using local SQLite
data: goal creation with an explicit progress source, quick task or flexible
habit capture linked to a selected goal or Inbox, four distinct Today outcomes,
completed-task progress, and a review summary that surfaces missed work.
Habits store a positive target count for a week, month, or year instead of a
daily streak. `npm run typecheck` passes.

Goal measurements are now editable at creation and from each active goal card:
life area, baseline, target, unit, deadline, and progress source. The service
recalculates task-derived progress after an edit; it does not invent manual or
subgoal progress. Automatic recurrence remains deliberately unimplemented.
Manual and subgoal progress modes are selectable and displayed but
now have explicit source-specific workflows. A manual goal accepts a positive
value, `YYYY-MM-DD` date, and optional note; its bounded progress is baseline
plus its persisted entries. A subgoal-mode goal can create measurable child
outcomes. Its bounded progress is the unweighted average completion percentage
of direct children, mapped to the parent's own baseline/target range. Neither
workflow accepts or combines task progress. On-device restart verification is
pending until ADB access is restored.

## Explicit progress and child outcomes — F-002

- **Scoped:** 21 October 2026. Manual progress needs a deliberate log rather
  than a hidden mutable number; subgoal progress needs measurable children.
- **Implemented:** `PlannerService.logGoalProgress()` validates and persists a
  positive dated entry only for a manual goal. `createSubgoal()` accepts a
  parent only when it chose subgoal progress. Parent progress is recalculated
  from direct child completion ratios; it is never combined with manual entries
  or Today completions.
- **Verification:** Six Vitest service tests cover source isolation, bounded
  manual increments, entry metadata, and a 75% derived parent result.

## Recurring-habit scope — R-001

- **Cadence:** The existing count and `week` / `month` / `year` period define
  one target window, not an implied daily schedule or streak.
- **Next occurrence:** A future review command closes a completed period and
  generates at most one next-period occurrence, idempotently. Opening the app
  and completing an occurrence do not generate another one.
- **Missed targets:** Review must show the closed period's completed count and
  target as a missed target. It must not manufacture overdue copies for every
  remaining repetition; the user chooses a fresh next action.
  - **Implemented:** New habits store an anchor; Review persists one closure
    per elapsed anchor, reports completed/target results, and schedules one
    current-period successor. Late review does not backfill stale periods.

## Owner / model record

Scoped and implemented by GPT-5 Codex on 17–20 October 2026 from
`PRODUCT_RESEARCH.md`.
