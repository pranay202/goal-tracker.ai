# Architecture

## Product shape

The application is a local-first mobile goal tracker. Its core promise is to
make a person's long-term intention visible in the work they choose today.
The MVP is organized by domain responsibility, not by screens.

```text
UI: Onboarding / Goals / Today / Habits / Weekly review
                    │ commands + queries
Application: goal progress, occurrence generation, plan actions, review
                    │ repository interfaces
Data: repository adapters (SQLite snapshot now; migrations reserved by version)
                    │
Domain: Goal, Contribution, HabitSchedule, Occurrence, ProgressEntry
```

## Domain modules

| Module        | Owns                                                                   | Does not own                                      |
| ------------- | ---------------------------------------------------------------------- | ------------------------------------------------- |
| Goals         | measurable goal fields, deadline, selected progress mode               | a task's scheduled occurrence                     |
| Contributions | projects, one-off tasks, and their optional goal link                  | goal percentage calculation policy                |
| Habits        | target count and period (week/month/year)                              | coercing a missed target into an overdue task     |
| Plan          | Today list, ordering, due times, complete/skip/fail/reschedule actions | external calendar sync                            |
| Review        | weekly progress snapshot and planning prompts                          | changing historical completion records implicitly |
| Persistence   | repository implementations and schema migrations                       | presentation state                                |

## Data movement

1. A user creates a goal with its metric and exactly one progress mode.
2. The user captures a task or habit; a habit has a target count and week,
   month, or year period. Either may reference the goal, but inbox capture
   remains valid without a goal link.
3. Plan services create and order today's actionable occurrences from scheduled
   tasks and habits.
4. An action changes the occurrence state. A progress service recalculates only
   goals whose chosen progress mode depends on that state.
5. Weekly review reads the persisted plan history and current goal progress,
   then creates the next scheduled actions through the same services.

## Boundary rules

- Screen components/pages call application services; they do not write directly
  to persistence.
- Application services depend on repository interfaces, allowing a later cloud
  sync implementation without reshaping domain behavior.
- Progress calculations are deterministic and reusable from Today, Goals, and
  Review.
- No API, account, notification, or calendar connector exists in the MVP.

## Current implementation

`App.tsx` is the presentation shell. It owns only transient input, selected
tab, and refresh state. It invokes `PlannerService`, which owns commands,
today queries, and task-based goal progress recalculation. The service reads
and writes repository views provided by `SqlitePlannerRepository`.

`SqlitePlannerRepository` is now the production adapter. It persists goals,
contributions, and occurrences as a small versioned snapshot in the app's
SQLite database, so data survives an app restart. `InMemoryPlannerRepository`
remains available as a lightweight adapter, but `createPlanner()` selects
SQLite. UI components remain unaware of this storage choice.

The Goals screen owns editable form state only. `PlannerService.updateGoal()`
owns persisted measurement changes and the task-progress recalculation that
may follow. `PlannerService.closeEndedHabitPeriods()` owns recurring closure:
it writes period anchors into contributions and closure metrics through the
repository interfaces. Review invokes it only from an explicit button.
`src/presentation/theme.ts` is the single runtime palette/token source.

`GoalProgressEntry` is a domain record owned by Goals, not the screen. It is
written only through `PlannerService.logGoalProgress()` and read through a
repository view for the latest-entry context on a goal card. A `Goal` may name
another goal as its `parentGoalId`; this is the child-outcome relationship.
`PlannerService` owns the parent aggregation and resolves direct child progress
before writing the parent, so SQLite and the in-memory test adapter share the
same behavior.
