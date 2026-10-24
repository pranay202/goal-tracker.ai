import * as SQLite from "expo-sqlite";
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

type PlannerSnapshot = {
  goals: Goal[];
  contributions: Contribution[];
  occurrences: Occurrence[];
  habitPeriodClosures: HabitPeriodClosure[];
  goalProgressEntries: GoalProgressEntry[];
};

type PersistedState = {
  state_json: string;
};

const schemaVersion = 3;
const emptySnapshot = (): PlannerSnapshot => ({
  goals: [],
  contributions: [],
  occurrences: [],
  habitPeriodClosures: [],
  goalProgressEntries: [],
});

/**
 * This is the production persistence boundary. PlannerService writes through
 * these repository views, so screens remain unaware that the planner state now
 * lives in SQLite rather than memory. The small MVP state is saved as one
 * versioned snapshot; a later schema can migrate this record without changing
 * the service or presentation contracts.
 */
export class SqlitePlannerRepository implements PlannerRepository {
  private readonly database = SQLite.openDatabaseSync("goal-to-today.db");
  private readonly snapshot: PlannerSnapshot;

  constructor() {
    this.database.execSync(`
      CREATE TABLE IF NOT EXISTS planner_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        schema_version INTEGER NOT NULL,
        state_json TEXT NOT NULL
      );
    `);
    this.snapshot = this.loadSnapshot();
    this.persist();
  }

  goalRepository: GoalRepository = {
    list: () => [...this.snapshot.goals],
    findById: (id) => this.snapshot.goals.find((goal) => goal.id === id),
    save: (goal) => {
      this.replaceById(this.snapshot.goals, goal);
      this.persist();
    },
  };

  contributionRepository: ContributionRepository = {
    list: () => [...this.snapshot.contributions],
    findById: (id) =>
      this.snapshot.contributions.find(
        (contribution) => contribution.id === id,
      ),
    save: (contribution) => {
      this.replaceById(this.snapshot.contributions, contribution);
      this.persist();
    },
  };

  occurrenceRepository: OccurrenceRepository = {
    list: () => [...this.snapshot.occurrences],
    save: (occurrence) => {
      this.replaceById(this.snapshot.occurrences, occurrence);
      this.persist();
    },
  };

  habitPeriodClosureRepository: HabitPeriodClosureRepository = {
    list: () => [...this.snapshot.habitPeriodClosures],
    save: (closure) => {
      this.replaceById(this.snapshot.habitPeriodClosures, closure);
      this.persist();
    },
  };

  goalProgressEntryRepository: GoalProgressEntryRepository = {
    list: () => [...this.snapshot.goalProgressEntries],
    listForGoal: (goalId) =>
      this.snapshot.goalProgressEntries.filter(
        (entry) => entry.goalId === goalId,
      ),
    save: (entry) => {
      this.replaceById(this.snapshot.goalProgressEntries, entry);
      this.persist();
    },
  };

  private loadSnapshot(): PlannerSnapshot {
    const persisted = this.database.getFirstSync<PersistedState>(
      "SELECT state_json FROM planner_state WHERE id = 1",
    );
    if (!persisted) return emptySnapshot();

    try {
      const parsed: unknown = JSON.parse(persisted.state_json);
      if (!this.isSnapshot(parsed))
        throw new Error("Planner snapshot has an unexpected shape");
      return {
        ...parsed,
        // Older task-only snapshots predate the kind field. Treating missing
        // values as tasks keeps the migration backward compatible on launch.
        contributions: parsed.contributions.map((contribution) => ({
          ...contribution,
          kind: contribution.kind ?? "task",
        })),
        // Version-one snapshots have no closure history. An empty list is a
        // safe migration because recurrence is opt-in through Review, not load.
        habitPeriodClosures: parsed.habitPeriodClosures ?? [],
        // Progress entries were introduced after initial releases. Missing
        // history remains empty so an upgrade never fabricates a past update.
        goalProgressEntries: parsed.goalProgressEntries ?? [],
      };
    } catch (error) {
      // A corrupt local cache must not prevent a person from opening the app;
      // retaining the database row lets a future recovery flow inspect it.
      console.warn("Ignoring unreadable local planner state", error);
      return emptySnapshot();
    }
  }

  private persist(): void {
    this.database.runSync(
      `INSERT INTO planner_state (id, schema_version, state_json)
       VALUES (1, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         schema_version = excluded.schema_version,
         state_json = excluded.state_json`,
      schemaVersion,
      JSON.stringify(this.snapshot),
    );
  }

  private replaceById<T extends { id: string }>(items: T[], item: T): void {
    const index = items.findIndex((existing) => existing.id === item.id);
    if (index === -1) items.push(item);
    else items[index] = item;
  }

  private isSnapshot(value: unknown): value is PlannerSnapshot {
    if (!value || typeof value !== "object") return false;
    const snapshot = value as Partial<PlannerSnapshot>;
    return (
      Array.isArray(snapshot.goals) &&
      Array.isArray(snapshot.contributions) &&
      Array.isArray(snapshot.occurrences) &&
      (snapshot.habitPeriodClosures === undefined ||
        Array.isArray(snapshot.habitPeriodClosures)) &&
      (snapshot.goalProgressEntries === undefined ||
        Array.isArray(snapshot.goalProgressEntries))
    );
  }
}
