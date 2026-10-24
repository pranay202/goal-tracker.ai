# Decisions

This log records meaningful product and engineering choices. Add a decision
before or alongside the code that relies on it, including the model/version
that made the recommendation.

## D-001 — Keep the MVP goal-first

- **Status:** accepted, 17 October 2026
- **Decision:** Build the first release around a traceable `Goal → contribution
→ Today` chain, instead of a general nested to-do list.
- **Reason:** The research identifies visible progress toward meaningful
  outcomes as the core unmet user need. A generic task tree loses that
  connection.
- **Consequences:** Every habit, project, or task that is shown as a goal
  contribution must keep a goal reference. The Today screen must be able to
  show that relationship without making it required for inbox capture.
- **Alternatives considered:** Task-first design (faster to ship, but weak goal
  traceability); a full Griply-style hierarchy (too much setup for an MVP).
- **Decision model:** GPT-5 Codex.

## D-013 — Close target habits through an explicit elapsed-period review

- **Status:** accepted and implemented, 20 October 2026
- **Decision:** Store a calendar-aligned period anchor on each new habit and a persisted closure record for each reviewed period. Review closes only elapsed periods, records completed/target counts, and creates one current-period occurrence.
- **Reason:** The anchor and closure marker make repeated review idempotent, while resuming at the current period prevents an absence from becoming obsolete work.
- **Consequences:** Existing habits without an anchor preserve their old behavior and are not assigned a guessed schedule. The UI exposes a deliberate close action and target metrics.
- **Decision model:** GPT-5 Codex.

## D-014 — Use Vitest and Prettier at the service boundary

- **Status:** accepted and implemented, 20 October 2026
- **Decision:** Add Vitest for deterministic service tests and Prettier for formatting, with SQLite composition moved outside `PlannerService`.
- **Reason:** The in-memory repository tests app logic without loading device-only modules; Prettier keeps the MVP readable.
- **Decision model:** GPT-5 Codex, with owner approval for both dependencies.

## D-015 — Make manual and child-outcome progress explainable

- **Status:** accepted and implemented, 21 October 2026
- **Decision:** Store immutable positive manual progress entries with an entered
  date and optional note. A goal in `manual` mode derives its displayed value
  from baseline plus its entries. A goal in `subgoals` mode derives its value
  from the unweighted average completion percentage of its direct measurable
  child goals.
- **Reason:** Both values remain traceable to user-entered evidence without
  mixing task completion, manual updates, and child outcomes. Averaging gives
  equally scoped child outcomes a predictable result before weighting is a
  product requirement.
- **Consequences:** Entries are rejected for non-manual goals; task updates do
  not affect manual/subgoal goals. Parent goals with no children remain at
  baseline. SQLite schema version 3 migrates existing snapshots with an empty
  entry history rather than inventing progress.
- **Decision model:** GPT-5 Codex.

## D-002 — Scope to one vertical MVP loop

- **Status:** accepted, 17 October 2026
- **Decision:** Ship onboarding, measurable goals, one-off tasks, flexible
  habits, Today actions, and weekly review before calendar sync, AI,
  collaboration, widgets, desktop, or a roadmap/Gantt.
- **Reason:** This is the smallest loop that creates a goal, turns it into
  action, handles missed work, and enables reflection.
- **Consequences:** Data boundaries should allow future schedule integrations,
  but the first release owns its schedule locally.
- **Decision model:** GPT-5 Codex, based on `PRODUCT_RESEARCH.md`.

## D-003 — Progress has exactly one source of truth per goal

- **Status:** accepted, 17 October 2026
- **Decision:** A goal must select manual/numeric progress, completed-task
  progress, or subgoal progress. The system must not silently aggregate these.
- **Reason:** Combining incompatible signals can report progress that the user
  cannot explain or correct.
- **Consequences:** The goal form needs `progressMode`; progress calculation is
  centralized rather than duplicated in screen code.
- **Decision model:** GPT-5 Codex, based on the researched Griply model.

## D-004 — Defer mobile-stack and package choice

- **Status:** pending owner approval, 17 October 2026
- **Decision:** Do not bootstrap Flutter, React Native/Expo, or another stack,
  and do not add dependencies, until the owner approves the initial choice.
- **Reason:** This workspace has no existing app or package conventions, and
  `CONSTRAINTS.md` prohibits new dependencies without approval.
- **Alternatives considered:** React Native/Expo aligns with the inspected
  reference; Flutter is a viable native-feeling option. Neither is justified
  without the owner's product/platform preference.
- **Decision model:** GPT-5 Codex.

## D-005 — Use Expo blank TypeScript with no app-library additions

- **Status:** accepted, 17 October 2026
- **Decision:** Bootstrap the mobile client with Expo's blank TypeScript
  template and use React Native primitives for the initial interface.
- **Reason:** The owner selected the React Native Expo stack. Keeping the
  scaffold dependency set intact lets the first vertical slice prove the core
  model before navigation, state-management, icon, or UI-library choices.
- **Consequences:** The app has a small hand-built tab switcher and in-memory
  repository adapter. Device persistence is intentionally deferred until an
  owner approves a persistence package and its migration policy.
- **Alternatives considered:** Adding React Navigation and AsyncStorage now
  (useful soon, but unapproved additional dependencies); a single giant screen
  with React state only (would violate the repository boundary).
- **Decision model:** GPT-5 Codex.

## D-006 — Use a native debug build for the connected Android device

- **Status:** accepted, 18 October 2026
- **Decision:** Generate Expo's Android native project and use `expo run:android`
  for direct USB installation on the connected device.
- **Reason:** The device's Expo Go SDK was older than this SDK 58 project, and
  its automatic matching-client update did not complete.
- **Consequences:** `android/` is now a generated build artifact. It may be
  regenerated with Expo prebuild; app behavior remains owned by the TypeScript
  source. The first Gradle download can take several minutes.
- **Decision model:** GPT-5 Codex.

## D-007 — Persist the MVP planner as a versioned SQLite snapshot

- **Status:** accepted, 18 October 2026
- **Decision:** Use Expo's SDK-compatible `expo-sqlite` module behind
  `SqlitePlannerRepository`. Store the small MVP planner state as one
  versioned JSON snapshot in a SQLite row.
- **Reason:** SQLite persists across restarts and preserves the existing
  repository boundary. A single snapshot keeps this first data migration small
  while the domain is still evolving; the stored schema version reserves a
  deliberate migration point.
- **Consequences:** Planner writes are synchronous and suited only to the
  small local MVP dataset. Screens and `PlannerService` remain storage-agnostic.
  A later scale-up can migrate the snapshot into normalized tables without
  changing UI ownership.
- **Alternatives considered:** AsyncStorage (simple key-value persistence, but
  no useful schema/migration boundary); normalized SQLite tables now (more
  query-efficient, but premature before habits and editing rules stabilize).
- **Decision model:** GPT-5 Codex.

## D-008 — Model habits as target-based contributions, not streaks

- **Status:** accepted, 18 October 2026
- **Decision:** A habit is a contribution with an explicit positive count and
  week, month, or year period. Capturing one schedules its first occurrence in
  Today using the same outcome path as a task.
- **Reason:** The MVP needs flexible target habits without implying that every
  behavior is daily or that one missed day breaks an artificial streak.
- **Consequences:** The current UI captures one habit occurrence rather than
  generating a recurring schedule automatically. Completion may contribute to
  a goal only when that goal selected completed-task progress.
- **Alternatives considered:** Daily streak-only habits (does not support
  weekly/monthly/yearly intent); automatic recurrence generation now (requires
  unapproved scheduling rules and a broader review model).
- **Decision model:** GPT-5 Codex.

## D-009 — Edit every goal measurement through the service boundary

- **Status:** accepted, 20 October 2026
- **Decision:** Expose life area, baseline, target, unit, deadline, and
  progress source in both the create and edit goal form. Route edits through
  `PlannerService.updateGoal()` rather than writing a repository row from the
  screen.
- **Reason:** Fixed UI defaults contradicted the measurable-goal model. The
  service remains the one place that can preserve source-specific progress:
  task-derived goals are recalculated after an edit, while the other sources
  retain only their existing value bounded by the edited range.
- **Consequences:** A target must be higher than its baseline; an edit never
  silently combines task, manual, and subgoal progress. Existing card values
  can be corrected without recreating the goal.
- **Decision model:** GPT-5 Codex.

## D-010 — Define recurring habits as reviewable targets before generation

- **Status:** accepted for scope; implementation deferred, 20 October 2026
- **Decision:** A habit's `count × period` is the commitment. The next
  occurrence is generated only when the current period is closed in review,
  never immediately after completion or merely because the app is opened.
  An incomplete period appears in review as a missed target with completed /
  target counts; it does not create an overdue copy of each missed repetition.
- **Reason:** A weekly, monthly, or yearly target is not a daily streak.
  Eager generation can duplicate work, silently move a target, or make one
  missed day look like multiple failed tasks.
- **Consequences:** The current first Today occurrence remains intentional.
  Future implementation needs a persisted period anchor, closed-period marker,
  and idempotent review command before it can generate the next occurrence.
- **Alternatives considered:** Generate immediately on completion (does not
  respect the period); generate at app launch (non-deterministic); create an
  overdue item for each unsatisfied repetition (misrepresents target habits).
- **Decision model:** GPT-5 Codex.

## D-011 — Keep Expo at its current SDK 58 patch despite audit downgrade advice

- **Status:** accepted, 20 October 2026
- **Decision:** Upgrade Expo from `~58.0.14` to `~58.0.16`, then do not apply
  `npm audit fix` because its only proposed resolution is an incompatible
  downgrade to Expo 44.
- **Reason:** The npm audit report marks the latest Expo 58 dependency graph
  with broad transitive advisory ranges and does not offer a forward fix. SDK
  44 would conflict with the current React 19.3 / React Native 0.88 project.
- **Consequences:** Recheck the audit when Expo or its transitive dependencies
  publish a forward remediation. Do not claim the audit is clean.
- **Decision model:** GPT-5 Codex.

## D-012 — Publish the app source as a private repository without research APKs

- **Status:** accepted, 20 October 2026
- **Decision:** Initialize this workspace on `main` and publish the app source,
  documentation, and lockfile to the user-requested private GitHub repository
  `goal-tracker.app`. Keep `artifacts/` ignored.
- **Reason:** The APK files are authorized local research inputs, not app
  source or distributable project assets. A private remote is still a transfer
  to a third party and is not needed to build the tracker.
- **Consequences:** The initial commit is reproducible through `npm ci` but
  does not contain Android generated output, local Expo state, or the research
  binaries. The remote URL and commit SHA must be added to `HANDOVER.md` once
  GitHub creation succeeds.
- **Decision model:** GPT-5 Codex.
