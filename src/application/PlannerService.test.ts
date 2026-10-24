import { describe, expect, it } from "vitest";
import { InMemoryPlannerRepository } from "../data/InMemoryPlannerRepository";
import { nextPeriodAnchor, periodAnchorFor } from "../domain/habitPeriods";
import { PlannerService } from "./PlannerService";

const measurableGoal = {
  name: "Read more",
  lifeArea: "Personal",
  baseline: 0,
  target: 5,
  unit: "books",
  deadline: "December",
  progressMode: "completedTasks" as const,
};

describe("PlannerService goal editing", () => {
  it("recalculates task-derived progress after an edit instead of accepting a mixed source", () => {
    const service = new PlannerService(
      new InMemoryPlannerRepository(),
      () => new Date("2026-01-05T12:00:00"),
    );
    const goal = service.createGoal(measurableGoal);
    service.captureTask("Read chapter one", goal.id);
    service.applyOccurrenceAction(service.getToday()[0].id, "completed");

    const edited = service.updateGoal(goal.id, {
      ...measurableGoal,
      baseline: 2,
      target: 8,
    });

    expect(edited?.progress).toBe(3);
    expect(edited?.target).toBe(8);
  });
});

describe("PlannerService explicit goal progress", () => {
  it("records dated manual increments and never accepts them for another source", () => {
    const service = new PlannerService(new InMemoryPlannerRepository());
    const manualGoal = service.createGoal({
      ...measurableGoal,
      progressMode: "manual",
    });
    const taskGoal = service.createGoal(measurableGoal);

    expect(
      service.logGoalProgress({
        goalId: taskGoal.id,
        value: 1,
        date: "2026-01-05",
      }),
    ).toBeUndefined();
    service.logGoalProgress({
      goalId: manualGoal.id,
      value: 2,
      date: "2026-01-05",
      note: "Finished two books",
    });
    service.logGoalProgress({
      goalId: manualGoal.id,
      value: 10,
      date: "2026-01-06",
    });

    expect(
      service.listGoals().find((goal) => goal.id === manualGoal.id)?.progress,
    ).toBe(5);
    expect(service.getGoalProgressEntries(manualGoal.id)).toMatchObject([
      { value: 10, date: "2026-01-06" },
      { value: 2, note: "Finished two books" },
    ]);
  });

  it("derives a subgoal-mode parent from measurable child completion only", () => {
    const service = new PlannerService(new InMemoryPlannerRepository());
    const parent = service.createGoal({
      ...measurableGoal,
      name: "Read a curriculum",
      target: 100,
      unit: "%",
      progressMode: "subgoals",
    });
    const firstChild = service.createSubgoal(parent.id, {
      ...measurableGoal,
      name: "Part one",
      target: 4,
      progressMode: "manual",
    });
    const secondChild = service.createSubgoal(parent.id, {
      ...measurableGoal,
      name: "Part two",
      target: 10,
      progressMode: "manual",
    });
    expect(firstChild).toBeDefined();
    expect(secondChild).toBeDefined();

    service.logGoalProgress({
      goalId: firstChild!.id,
      value: 4,
      date: "2026-01-05",
    });
    service.logGoalProgress({
      goalId: secondChild!.id,
      value: 5,
      date: "2026-01-05",
    });

    expect(
      service.listGoals().find((goal) => goal.id === parent.id)?.progress,
    ).toBe(75);
    expect(
      service.createSubgoal(firstChild!.id, {
        ...measurableGoal,
        progressMode: "manual",
      }),
    ).toBeUndefined();
  });
});

describe("PlannerService habit-period closure", () => {
  it("closes an elapsed week once, records target metrics, and schedules one successor", () => {
    let now = new Date("2026-01-05T12:00:00"); // Monday
    const repository = new InMemoryPlannerRepository();
    const service = new PlannerService(repository, () => now);
    service.captureHabit("Walk", 2, "week");
    service.applyOccurrenceAction(service.getToday()[0].id, "completed");

    now = new Date("2026-01-12T12:00:00"); // Next Monday: previous week is elapsed.
    expect(service.closeEndedHabitPeriods()).toMatchObject([
      { completedCount: 1, targetCount: 2, periodAnchor: "2026-01-05" },
    ]);
    expect(repository.occurrenceRepository.list()).toHaveLength(2);
    expect(repository.occurrenceRepository.list()[1]).toMatchObject({
      scheduledFor: "2026-01-12",
      periodAnchor: "2026-01-12",
      state: "scheduled",
    });

    expect(service.closeEndedHabitPeriods()).toEqual([]);
    expect(repository.occurrenceRepository.list()).toHaveLength(2);
    expect(service.getHabitPeriodClosures()).toHaveLength(1);
  });

  it("uses calendar boundaries for weekly, monthly, and yearly anchors", () => {
    expect(periodAnchorFor(new Date("2026-03-01T12:00:00"), "week")).toBe(
      "2026-02-23",
    );
    expect(periodAnchorFor(new Date("2026-03-17T12:00:00"), "month")).toBe(
      "2026-03-01",
    );
    expect(periodAnchorFor(new Date("2026-10-20T12:00:00"), "year")).toBe(
      "2026-01-01",
    );
    expect(nextPeriodAnchor("2026-12-01", "month")).toBe("2027-01-01");
    expect(nextPeriodAnchor("2026-01-01", "year")).toBe("2027-01-01");
  });

  it("resumes at the current window without backfilling missed periods", () => {
    let now = new Date("2026-01-05T12:00:00");
    const repository = new InMemoryPlannerRepository();
    const service = new PlannerService(repository, () => now);
    service.captureHabit("Write", 1, "week");

    now = new Date("2026-01-26T12:00:00");
    service.closeEndedHabitPeriods();

    expect(repository.occurrenceRepository.list()).toHaveLength(2);
    expect(repository.occurrenceRepository.list()[1].scheduledFor).toBe(
      "2026-01-26",
    );
    expect(service.closeEndedHabitPeriods()).toEqual([]);
  });
});
