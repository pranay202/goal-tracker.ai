# Done checklist

Run this checklist before calling an implementation change complete.

## Before code exists

- [x] Read `HANDOVER.md`, `CONSTRAINTS.md`, `ARCHITECTURE.md`, `FLOW.md`, and
      the relevant feature/bug record.
- [x] Confirm the work is within `FEATURE.md` scope.
- [x] Record material decisions in `DECISIONS.md` with the deciding model/version.
- [x] Update the five-line close note in `HANDOVER.md`.

## Once a stack is selected

- [x] Run `npm run typecheck`; expected result: zero TypeScript errors.
- [x] Run `npx expo export --platform android`; expected result: a successful
      Android JavaScript bundle in `dist/`. This is the available build validation
      before an Android SDK/EAS build is configured.
- [ ] On a connected Android device, create a goal and task, restart the app,
      and confirm both remain. Expected result: SQLite-backed planner data survives
      the restart.
- [x] Run `npm run format:check`; expected result: no formatting changes.
- [x] Run `npm test`; expected result: all service tests pass.
- [ ] Manually test goal creation, quick capture, all four Today outcomes,
      selected progress modes, and weekly-review cleanup.
- [ ] Manually create a habit with each week, month, and year target. Expected
      result: the selected target appears on Today and does not behave as a daily
      streak.
- [ ] Verify that a skipped or failed occurrence is not reported as completed.
- [ ] Create and edit a goal's life area, baseline, target, unit, deadline,
      and progress source. Expected result: the card displays the saved values and
      task-derived progress recalculates only for the Tasks source.
- [x] Test that closing a period twice creates only one next occurrence and
      that an unmet target appears in Review without synthetic overdue tasks.
- [x] Test that a manual log stores value/date/note, rejects another progress
      source, and bounds the manual goal at target.
- [x] Test that a subgoal-mode parent derives only from child completion.
- [ ] On a connected device, log manual progress and add a child outcome, then
      restart. Expected result: entries and derived parent progress persist.
- [ ] Update `FEATURE.md` or `BUG.md`, `FLOW.md`, `ARCHITECTURE.md`, and
      `HANDOVER.md` to match the delivered behavior.
