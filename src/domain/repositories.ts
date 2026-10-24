import {
  Contribution,
  Goal,
  GoalProgressEntry,
  HabitPeriodClosure,
  Occurrence,
} from "./models";

export interface GoalRepository {
  list(): Goal[];
  findById(id: string): Goal | undefined;
  save(goal: Goal): void;
}

export interface ContributionRepository {
  list(): Contribution[];
  findById(id: string): Contribution | undefined;
  save(contribution: Contribution): void;
}

export interface OccurrenceRepository {
  list(): Occurrence[];
  save(occurrence: Occurrence): void;
}

export interface HabitPeriodClosureRepository {
  list(): HabitPeriodClosure[];
  save(closure: HabitPeriodClosure): void;
}

export interface GoalProgressEntryRepository {
  list(): GoalProgressEntry[];
  listForGoal(goalId: string): GoalProgressEntry[];
  save(entry: GoalProgressEntry): void;
}

/**
 * PlannerService receives this aggregate instead of a storage implementation.
 * Keeping the three views together preserves the existing service flow while
 * allowing the app to exchange its temporary in-memory adapter for SQLite.
 */
export interface PlannerRepository {
  goalRepository: GoalRepository;
  contributionRepository: ContributionRepository;
  occurrenceRepository: OccurrenceRepository;
  habitPeriodClosureRepository: HabitPeriodClosureRepository;
  goalProgressEntryRepository: GoalProgressEntryRepository;
}
