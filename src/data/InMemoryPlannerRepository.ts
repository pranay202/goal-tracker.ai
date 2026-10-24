import {
  Contribution,
  Goal,
  GoalProgressEntry,
  HabitPeriodClosure,
  Occurrence,
} from "../domain/models";
import {
  ContributionRepository,
  GoalRepository,
  GoalProgressEntryRepository,
  HabitPeriodClosureRepository,
  OccurrenceRepository,
  PlannerRepository,
} from "../domain/repositories";

/**
 * This adapter is the app's temporary persistence boundary. PlannerService is
 * its only writer, so replacing these maps with device storage later does not
 * change the screen-level behavior.
 */
export class InMemoryPlannerRepository implements PlannerRepository {
  private readonly goals = new Map<string, Goal>();
  private readonly contributions = new Map<string, Contribution>();
  private readonly occurrences = new Map<string, Occurrence>();
  private readonly habitPeriodClosures = new Map<string, HabitPeriodClosure>();
  private readonly progressEntries = new Map<string, GoalProgressEntry>();

  goalRepository: GoalRepository = {
    list: () => [...this.goals.values()],
    findById: (id) => this.goals.get(id),
    save: (goal) => this.goals.set(goal.id, goal),
  };

  contributionRepository: ContributionRepository = {
    list: () => [...this.contributions.values()],
    findById: (id) => this.contributions.get(id),
    save: (contribution) =>
      this.contributions.set(contribution.id, contribution),
  };

  occurrenceRepository: OccurrenceRepository = {
    list: () => [...this.occurrences.values()],
    save: (occurrence) => this.occurrences.set(occurrence.id, occurrence),
  };

  habitPeriodClosureRepository: HabitPeriodClosureRepository = {
    list: () => [...this.habitPeriodClosures.values()],
    save: (closure) => this.habitPeriodClosures.set(closure.id, closure),
  };

  goalProgressEntryRepository: GoalProgressEntryRepository = {
    list: () => [...this.progressEntries.values()],
    listForGoal: (goalId) =>
      [...this.progressEntries.values()].filter(
        (entry) => entry.goalId === goalId,
      ),
    save: (entry) => this.progressEntries.set(entry.id, entry),
  };
}
