import {
  Contribution,
  Goal,
  GoalProgressEntry,
  HabitPeriodClosure,
  HabitPeriod,
  Occurrence,
  OccurrenceState,
  ProgressMode,
  TodayItem,
} from "../domain/models";
import { periodAnchorFor, toDateKey } from "../domain/habitPeriods";
import { PlannerRepository } from "../domain/repositories";

export type CreateGoalInput = Omit<Goal, "id" | "progress" | "parentGoalId">;

export type LogGoalProgressInput = Omit<GoalProgressEntry, "id">;

const dateAfter = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return toDateKey(result);
};

export class PlannerService {
  private sequence = 0;

  constructor(
    private readonly store: PlannerRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private todayKey = () => toDateKey(this.now());

  createGoal(input: CreateGoalInput): Goal {
    const goal: Goal = {
      ...input,
      id: this.id("goal"),
      progress: input.baseline,
    };
    this.store.goalRepository.save(goal);
    return goal;
  }

  createSubgoal(
    parentGoalId: string,
    input: CreateGoalInput,
  ): Goal | undefined {
    const parent = this.store.goalRepository.findById(parentGoalId);
    if (!parent || parent.progressMode !== "subgoals") return undefined;

    const subgoal: Goal = {
      ...input,
      id: this.id("goal"),
      parentGoalId,
      progress: input.baseline,
    };
    this.store.goalRepository.save(subgoal);
    this.recalculateSubgoalBasedGoals();
    return subgoal;
  }

  updateGoal(id: string, input: CreateGoalInput): Goal | undefined {
    const existing = this.store.goalRepository.findById(id);
    if (!existing) return undefined;

    // Goal measurement edits enter through the service so the UI cannot bypass
    // the progress-source invariant. Each selected source is recomputed below
    // from its own records rather than inheriting a mixed displayed value.
    const goal: Goal = {
      ...existing,
      ...input,
      progress: Math.min(
        input.target,
        Math.max(input.baseline, existing.progress),
      ),
    };
    this.store.goalRepository.save(goal);
    this.recalculateGoalProgress();
    return this.store.goalRepository.findById(id);
  }

  logGoalProgress(input: LogGoalProgressInput): GoalProgressEntry | undefined {
    const goal = this.store.goalRepository.findById(input.goalId);
    if (
      !goal ||
      goal.progressMode !== "manual" ||
      !Number.isFinite(input.value) ||
      input.value <= 0 ||
      !this.isDateKey(input.date)
    )
      return undefined;

    // Manual entries are immutable evidence. The aggregate is recalculated
    // from them so the card stays explainable after an edit or app restart.
    const entry: GoalProgressEntry = {
      ...input,
      id: this.id("progress"),
      note: input.note?.trim() || undefined,
    };
    this.store.goalProgressEntryRepository.save(entry);
    this.recalculateManualProgress(goal.id);
    this.recalculateSubgoalBasedGoals();
    return entry;
  }

  getGoalProgressEntries(goalId: string): GoalProgressEntry[] {
    return this.store.goalProgressEntryRepository
      .listForGoal(goalId)
      .sort((left, right) => right.date.localeCompare(left.date));
  }

  captureTask(title: string, goalId?: string): void {
    const contribution: Contribution = {
      id: this.id("task"),
      title,
      kind: "task",
      goalId,
      scheduledFor: this.todayKey(),
    };
    this.scheduleContribution(contribution);
  }

  captureHabit(
    title: string,
    targetCount: number,
    period: HabitPeriod,
    goalId?: string,
  ): void {
    const contribution: Contribution = {
      id: this.id("habit"),
      title,
      kind: "habit",
      goalId,
      scheduledFor: this.todayKey(),
      habitTarget: { count: targetCount, period },
      periodAnchor: periodAnchorFor(this.now(), period),
    };
    this.scheduleContribution(contribution);
  }

  private scheduleContribution(contribution: Contribution): void {
    const occurrence: Occurrence = {
      id: this.id("occurrence"),
      contributionId: contribution.id,
      scheduledFor: this.todayKey(),
      state: "scheduled",
      periodAnchor: contribution.periodAnchor,
    };
    this.store.contributionRepository.save(contribution);
    this.store.occurrenceRepository.save(occurrence);
  }

  listGoals(): Goal[] {
    return this.store.goalRepository.list();
  }

  getToday(): TodayItem[] {
    return this.store.occurrenceRepository
      .list()
      .filter(
        (occurrence) =>
          occurrence.scheduledFor === this.todayKey() &&
          occurrence.state === "scheduled",
      )
      .flatMap((occurrence) => {
        const contribution = this.store.contributionRepository.findById(
          occurrence.contributionId,
        );
        return contribution ? [{ occurrence, contribution }] : [];
      })
      .map(({ occurrence, contribution }) => ({
        ...occurrence,
        contribution,
        goal: contribution.goalId
          ? this.store.goalRepository.findById(contribution.goalId)
          : undefined,
      }));
  }

  getWeeklyHistory(): TodayItem[] {
    return this.store.occurrenceRepository.list().flatMap((occurrence) => {
      const contribution = this.store.contributionRepository.findById(
        occurrence.contributionId,
      );
      return contribution
        ? [
            {
              ...occurrence,
              contribution,
              goal: contribution.goalId
                ? this.store.goalRepository.findById(contribution.goalId)
                : undefined,
            },
          ]
        : [];
    });
  }

  applyOccurrenceAction(
    occurrenceId: string,
    action: OccurrenceState | "reschedule",
  ): void {
    const existing = this.store.occurrenceRepository
      .list()
      .find((item) => item.id === occurrenceId);
    if (!existing) return;

    // Today buttons converge here so every outcome updates history consistently;
    // only completed tasks can affect a goal that explicitly chose task progress.
    const updated: Occurrence =
      action === "reschedule"
        ? {
            ...existing,
            scheduledFor: dateAfter(this.now(), 1),
            state: "scheduled",
          }
        : { ...existing, state: action };
    this.store.occurrenceRepository.save(updated);
    this.recalculateGoalProgress();
  }

  private recalculateGoalProgress(): void {
    this.recalculateTaskBasedGoals();
    this.store.goalRepository
      .list()
      .filter((goal) => goal.progressMode === "manual")
      .forEach((goal) => this.recalculateManualProgress(goal.id));
    this.recalculateSubgoalBasedGoals();
  }

  private recalculateTaskBasedGoals(): void {
    this.store.goalRepository.list().forEach((goal) => {
      if (goal.progressMode !== "completedTasks") return;
      const completions = this.store.occurrenceRepository
        .list()
        .filter((occurrence) => {
          const contribution = this.store.contributionRepository.findById(
            occurrence.contributionId,
          );
          return (
            contribution?.goalId === goal.id && occurrence.state === "completed"
          );
        }).length;
      this.store.goalRepository.save({
        ...goal,
        progress: Math.min(goal.target, goal.baseline + completions),
      });
    });
  }

  private recalculateManualProgress(goalId: string): void {
    const goal = this.store.goalRepository.findById(goalId);
    if (!goal || goal.progressMode !== "manual") return;
    const loggedValue = this.store.goalProgressEntryRepository
      .listForGoal(goalId)
      .reduce((total, entry) => total + entry.value, 0);
    this.store.goalRepository.save({
      ...goal,
      progress: Math.min(
        goal.target,
        Math.max(goal.baseline, goal.baseline + loggedValue),
      ),
    });
  }

  private recalculateSubgoalBasedGoals(): void {
    const goals = this.store.goalRepository.list();
    const recalculate = (goal: Goal, visiting: Set<string>): Goal => {
      if (goal.progressMode !== "subgoals" || visiting.has(goal.id))
        return goal;
      const children = goals.filter((child) => child.parentGoalId === goal.id);
      if (children.length === 0) {
        const reset = { ...goal, progress: goal.baseline };
        this.store.goalRepository.save(reset);
        return reset;
      }

      // Parents may be nested. Resolving a child first makes each parent's
      // progress a direct average of its current measurable child outcomes.
      const nextVisiting = new Set(visiting).add(goal.id);
      const completion =
        children.reduce((total, child) => {
          const resolved = recalculate(child, nextVisiting);
          const range = resolved.target - resolved.baseline;
          const ratio =
            range <= 0 ? 0 : (resolved.progress - resolved.baseline) / range;
          return total + Math.max(0, Math.min(1, ratio));
        }, 0) / children.length;
      const updated = {
        ...goal,
        progress: goal.baseline + (goal.target - goal.baseline) * completion,
      };
      this.store.goalRepository.save(updated);
      return updated;
    };

    goals.forEach((goal) => recalculate(goal, new Set()));
  }

  private isDateKey(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T12:00:00Z`);
    return (
      !Number.isNaN(parsed.valueOf()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }

  closeEndedHabitPeriods(): HabitPeriodClosure[] {
    const reviewDate = this.now();
    const newClosures: HabitPeriodClosure[] = [];

    this.store.contributionRepository.list().forEach((contribution) => {
      const target = contribution.habitTarget;
      if (
        contribution.kind !== "habit" ||
        !target ||
        !contribution.periodAnchor
      )
        return;

      const currentAnchor = periodAnchorFor(reviewDate, target.period);
      if (contribution.periodAnchor >= currentAnchor) return;
      const alreadyClosed = this.store.habitPeriodClosureRepository
        .list()
        .some(
          (closure) =>
            closure.contributionId === contribution.id &&
            closure.periodAnchor === contribution.periodAnchor,
        );
      if (alreadyClosed) return;

      // Review is the only recurrence writer. Recording this closure before
      // scheduling the successor makes repeating the command converge instead
      // of duplicating an occurrence for the same period.
      const completedCount = this.store.occurrenceRepository
        .list()
        .filter(
          (occurrence) =>
            occurrence.contributionId === contribution.id &&
            occurrence.periodAnchor === contribution.periodAnchor &&
            occurrence.state === "completed",
        ).length;
      const closure: HabitPeriodClosure = {
        id: this.id("habit-period"),
        contributionId: contribution.id,
        periodAnchor: contribution.periodAnchor,
        completedCount,
        targetCount: target.count,
        closedAt: this.todayKey(),
      };
      this.store.habitPeriodClosureRepository.save(closure);

      // If someone opens Review after several missed windows, resume at the
      // current window rather than replaying history one click at a time.
      const nextAnchor = currentAnchor;
      this.store.contributionRepository.save({
        ...contribution,
        periodAnchor: nextAnchor,
      });
      this.store.occurrenceRepository.save({
        id: this.id("occurrence"),
        contributionId: contribution.id,
        scheduledFor: nextAnchor,
        periodAnchor: nextAnchor,
        state: "scheduled",
      });
      newClosures.push(closure);
    });
    return newClosures;
  }

  getHabitPeriodClosures(): HabitPeriodClosure[] {
    return this.store.habitPeriodClosureRepository.list();
  }

  private id(prefix: string): string {
    this.sequence += 1;
    return `${prefix}-${Date.now()}-${this.sequence}`;
  }
}

export { ProgressMode };
