# Rollback plan

## Documentation foundation

The present change adds only planning documents. Roll back by removing the
nine documentation files added on 17 October 2026, then re-read
`PRODUCT_RESEARCH.md`. This is safe only if no later implementation depends on
these documents.

## Future implementation changes

1. Record the known-good commit SHA in this file before risky work begins.
2. If the change breaks core flows, revert that isolated implementation commit;
   do not reset the shared working tree.
3. Restore any schema/data migration only with an explicit reverse migration or
   a confirmed backup strategy; never delete user data as a shortcut.
4. Re-run every applicable item in `CHECKLIST.md`, especially all four Today
   outcomes and progress-source verification.
5. Update the related feature/bug record and `HANDOVER.md` with the rollback
   reason and model/version that made the call.

## Expo vertical slice

The current change adds the Expo scaffold plus `App.tsx` and `src/`. If the
slice breaks, remove or revert those implementation files while preserving the
planning documents. There is no persisted user data yet, so rollback does not
require a data migration. Re-run `npm run typecheck` after restoration.

The generated `android/` folder can be removed only when deliberately
returning to Expo managed-only development; Expo will recreate it with
`npx expo prebuild`. Do not delete it while a native build is active.

# Rollback plan

## SQLite persistence change

1. If local persistence causes a startup or data-flow regression, restore
   `createPlanner()` in `src/application/PlannerService.ts` to use
   `InMemoryPlannerRepository` and remove `expo-sqlite` from the dependency
   manifest only after confirming the rollback target.
2. Keep `src/data/SqlitePlannerRepository.ts` and the on-device database intact
   until the failure is understood; deleting the database would discard a
   person's local plan.
3. Re-run `npm run typecheck` and `npx expo export --platform android`, then
   manually confirm the four Today outcomes remain distinct.

## Flexible habit change

1. If habit capture disrupts task capture, restore `App.tsx` to call only
   `captureTask()` and remove `captureHabit()` from `PlannerService`.
2. Preserve any SQLite state until its migration impact is inspected; older
   task-only snapshots are intentionally read as task contributions.
3. Re-run `npm run typecheck` and `npx expo export --platform android`, then
   confirm a task can still be captured and all four outcomes still work.

## Goal measurement editing and Expo patch

1. If an edit corrupts a displayed measurement or task-progress calculation,
   revert the isolated `App.tsx` and `PlannerService.ts` change. Existing
   SQLite goal records use the same model fields and need no migration.
2. If Expo 58.0.16 regresses the build, restore the prior lockfile and the
   `expo` declaration of `~58.0.14`; do not use `npm audit fix`, which proposes
   an incompatible SDK 44 downgrade.
3. Re-run `npm run typecheck`, `npx expo export --platform android`, and the
   manual measurement-edit checklist after restoration.

## Explicit progress and subgoal change

1. If manual entries or child aggregation misreport progress, revert the
   isolated domain, repository, adapter, service, UI, and schema-version
   changes together; do not delete the SQLite snapshot or its evidence records.
2. Schema version 3 accepts missing entries for older snapshots. A rollback to
   version 2 must preserve the JSON row and ignore the additive field rather
   than destructively rewriting user data.
3. Re-run `npm test`, `npm run typecheck`, `npm run format:check`, and Android
   export, then manually verify each of the three progress modes stays isolated.

## Habit-period closure and UI theme

1. If closure produces unexpected work, revert `PlannerService`, the domain
   repository contracts, and both adapters as one unit. Do not delete the
   SQLite snapshot or closure records.
2. If the UI refresh regresses readability, restore `App.tsx` and
   `src/presentation/theme.ts` together so no screen retains dangling tokens.
3. Re-run `npm test`, `npm run typecheck`, `npm run format:check`, and Android
   export before declaring the rollback safe.
