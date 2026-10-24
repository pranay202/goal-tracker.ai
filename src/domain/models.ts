export type ProgressMode = "manual" | "completedTasks" | "subgoals";

export type OccurrenceState = "scheduled" | "completed" | "skipped" | "failed";

export type ContributionKind = "task" | "habit";

export type HabitPeriod = "week" | "month" | "year";

export type Goal = {
  id: string;
  name: string;
  lifeArea: string;
  baseline: number;
  target: number;
  unit: string;
  deadline: string;
  progressMode: ProgressMode;
  progress: number;
  // A child remains a complete measurable goal; the parent decides whether it
  // derives its own progress from these children.
  parentGoalId?: string;
};

export type GoalProgressEntry = {
  id: string;
  goalId: string;
  value: number;
  date: string;
  note?: string;
};

export type Contribution = {
  id: string;
  title: string;
  kind: ContributionKind;
  goalId?: string;
  scheduledFor: string;
  habitTarget?: {
    count: number;
    period: HabitPeriod;
  };
  // The calendar-window start makes recurrence deterministic across restarts.
  periodAnchor?: string;
};

export type Occurrence = {
  id: string;
  contributionId: string;
  scheduledFor: string;
  state: OccurrenceState;
  periodAnchor?: string;
};

export type HabitPeriodClosure = {
  id: string;
  contributionId: string;
  periodAnchor: string;
  completedCount: number;
  targetCount: number;
  closedAt: string;
};

export type TodayItem = Occurrence & {
  contribution: Contribution;
  goal?: Goal;
};
