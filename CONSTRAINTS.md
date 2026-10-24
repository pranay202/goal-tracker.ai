# Constraints

These rules apply to every implementation session.

1. Do not add a package, SDK, service, analytics tool, or build dependency
   without explicit owner approval.
2. Do not touch payment, subscriptions, advertising, or monetization unless the
   owner explicitly expands scope; none exists in the MVP.
3. Use repository interfaces between application services and persistence; UI
   code must not access storage directly.
4. Keep goal progress source-specific. Never add manual, task, and subgoal
   progress together by implication.
5. Preserve `complete`, `skip`, `fail`, and `reschedule` as distinguishable
   outcomes for a scheduled occurrence.
6. Do not copy, decompile into, or redistribute competitor source, wording,
   artwork, icons, or branding. The provided APKs are research artifacts only.
7. Comment non-obvious control flow where it is introduced, explaining what
   invokes it and the invariant it preserves—not restating syntax.
8. Update the living documentation in this workspace with every meaningful
   behavior, architecture, or scope change, including the model/version that
   made the decision.
9. End every session by updating the five-line session close note in
   `HANDOVER.md`.
10. Manual progress is append-only evidence: do not write it directly from UI
    state or apply it to task/subgoal progress sources. Parent aggregation may
    use only measurable child goals.
