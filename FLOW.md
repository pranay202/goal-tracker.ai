# Execution flow

This is the intended call path for the MVP vertical slice. Update it whenever
an implementation changes ownership or order.

```text
Onboarding screen
  → CreateGoal command
  → GoalService.create()
  → GoalRepository.save()
  → Goals query refreshes the goal summary

Today screen
  → Quick capture / schedule command
  → ContributionService.createTask() or HabitService.createHabit()
  → ContributionRepository.save()
  → PlanService.getToday() generates or loads occurrences
  → Today list renders occurrence + optional goal context

Today action (complete / skip / fail / reschedule)
  → PlanService.applyOccurrenceAction()
  → OccurrenceRepository.update()
  → ProgressService.recalculateAffectedGoals()
  → GoalRepository.saveProgress()
  → Today and Goal summary queries refresh

Weekly review screen
  → ReviewService.getWeeklySnapshot()
  → repositories read progress and occurrence history
  → ReviewService schedules selected next actions
  → PlanService applies the same scheduling path used by Today
```

## Current modification point

The first React Native Expo slice now implements this path:

```text
App.tsx (Today / Goals / Review tabs)
  → PlannerService.createGoal() / captureTask() / captureHabit()
  → SqlitePlannerRepository repository views
  → PlannerService.getToday() / getWeeklyHistory()
  → App re-renders from a revision counter

TodayCard action
  → PlannerService.applyOccurrenceAction()
  → occurrence state update or tomorrow reschedule
  → recalculateTaskBasedGoals() only for completedTasks goals
  → Today, goal cards, and review statistics re-render
```

`src/domain/models.ts` is the shared vocabulary for this path. The UI does not
access repository data directly. `src/data/SqlitePlannerRepository.ts` now
loads the persisted snapshot at planner creation and writes it after each
repository save. `InMemoryPlannerRepository.ts` remains a compatible test
adapter; it is not selected by `createPlanner()`.

Habit capture follows the same route as task capture. `App.tsx` validates a
positive whole-number target, calls `PlannerService.captureHabit()`, and the
service schedules the first occurrence through `scheduleContribution()`.
There is deliberately no automatic recurrence generation yet.

Goal measurement editing follows this path:

```text
GoalCard "Edit measurement"
  → App.tsx pre-fills the same measurable-goal form
  → PlannerService.updateGoal()
  → GoalRepository.save()
  → recalculateTaskBasedGoals() only when the edited source is completedTasks
  → Goals / Today / Review refresh from the revision counter
```

Recurring generation now follows this explicit path:

```text
Review "Close elapsed periods"
  → PlannerService.closeEndedHabitPeriods()
  → read persisted anchor and closure records
  → save completed/target metric
  → save one current-period occurrence
  → Review re-renders target met/missed result
```

The command is idempotent for a period and does not run on launch or completion.
`src/application/createPlanner.ts` is the SQLite composition root, keeping
the service itself testable without device modules.

Explicit progress and decomposition follow this path:

```text
GoalCard "Log progress" (manual only)
  → App.tsx validates value + date input
  → PlannerService.logGoalProgress()
  → GoalProgressEntryRepository.save()
  → recalculateManualProgress() from immutable entries
  → parent subgoal goals recalculate, then card refreshes

GoalCard "Add child outcome" (subgoals only)
  → App.tsx reuses the measurable-goal form with parent context
  → PlannerService.createSubgoal()
  → GoalRepository.save(child)
  → recalculateSubgoalBasedGoals() resolves children before parents
  → parent card refreshes from its direct child completion average
```
