# Goal tracker market research — 16 October 2026

## Decision

**Use Griply as the primary product reference.** It is the clearest goal-first
system found across the major stores: daily work is explicitly linked to the
long-term outcome it serves. Use **Structured** as the interaction and visual
planning reference, and **Todoist/TickTick** for capture speed, recurrence,
reminders, and cross-platform reliability.

Do not copy a competitor's branding, copy, artwork, or implementation. The
recommendations below are a product model derived from public listings and
static inspection of Griply's public web client.

## What users are actually trying to solve

| Headache                                | Product response that wins                                                                      |
| --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| I am busy but cannot see progress       | Link every task and habit to a goal, and show metric progress plus the next action.             |
| A large goal is too vague to start      | Break it into measurable milestones, projects, habits, and tasks.                               |
| My daily plan is impossible             | Put tasks beside existing calendar events; give the user a visible capacity/time-blocking view. |
| Planning becomes admin work             | One-tap inbox capture, natural dates, sensible defaults, and a weekly review.                   |
| I missed a task and now feel behind     | Offer reschedule, skip, or mark failed; avoid creating an unbounded overdue pile.               |
| Rigid daily habits fail in real life    | Support target-based habits such as “exercise 3×/week,” not only fixed daily streaks.           |
| I need focus now, not another dashboard | Make Today the home surface: a short, ordered plan tied to current goals.                       |

## Shortlist

| App            | Best at                                                                         | Evidence                                                                                                                                          | Gap to avoid                                                                         |
| -------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Griply**     | Goal → subgoal/project → habit/task traceability                                | Native goal metrics, subgoals, life areas, a goal roadmap, calendar blocks, smart lists, and progress charts.                                     | Smaller installed base; goal setup can be too much for a first-time user.            |
| **Structured** | Low-friction visual daily planning, especially for ADHD/executive-function load | 4.8/5 from 167K App Store ratings; visual timeline, inbox, drag/drop planning, subtasks, calendar integration, replan, and accessibility tools.   | Its day-first model does not provide as strong an explicit long-term goal hierarchy. |
| **Todoist**    | Fast, dependable task capture and organization at massive scale                 | 4.6/5 from about 304K Google Play reviews and 10M+ installs; 4.8/5 from 130K App Store ratings.                                                   | It is task-first: users must build their own goal system.                            |
| **TickTick**   | Feature-complete personal execution system                                      | 4.6/5 from 164K Google Play reviews and 10M+ installs; combines calendar, flexible repeats, habits, focus/Pomodoro, reminders, and collaboration. | It can feel feature-dense, and the native goal layer is weaker than Griply's.        |

Store sources: [Griply — Google Play](https://play.google.com/store/apps/details?id=app.griply), [Griply — App Store](https://apps.apple.com/us/app/daily-planner-goals-griply/id1556692747), [Structured — Google Play](https://play.google.com/store/apps/details?id=io.unorderly.structured), [Structured — App Store](https://apps.apple.com/us/app/structured-daily-planner-todo/id1499198946), [Todoist — Google Play](https://play.google.com/store/apps/details?id=com.todoist), [Todoist — App Store](https://apps.apple.com/us/app/todoist-to-do-list-calendar/id572688855), [TickTick — Google Play](https://play.google.com/store/apps/details?id=com.ticktick.task), [TickTick — App Store](https://apps.apple.com/us/app/ticktick-to-do-list-calendar/id626144601).

## Reverse-engineered reference: Griply

### Product model

```text
Life area / vision
  └─ Goal (deadline + metric)
      ├─ Subgoal (measurable milestone)
      ├─ Project (task container)
      ├─ Habit (recurring contribution)
      └─ Task (one-off contribution)
             └─ Calendar time block / focus block
```

The public client contains separate routes for goal lists, active/completed/
archived/unplanned goals, a roadmap, goal-level summary/progress/roadmap/tasks,
life-area vision/roadmap/tasks, project progress/roadmap/tasks, habits, and a
calendar. Its goal form exposes a deadline, start and target values, unit,
life area, description, and progress modes for a numeric target, custom value,
completed tasks, or subgoal progress. The habit schedule supports specific-day
rules and a count target per week, month, or year. This is why the model works:
every level answers a different question rather than turning every item into a
generic nested to-do.

### Important behaviour to adopt

1. **Metric-aware goals.** A goal needs a unit, baseline, target, deadline, and
   one clearly selected source of truth for progress. Never silently add task
   completion and manual percentage together.
2. **Two types of decomposition.** A subgoal represents an outcome; a project
   represents a body of work. Keeping that distinction prevents fake progress.
3. **Flexible habit commitments.** “Read 100 pages/month” and “work out
   3×/week” are better than forcing an arbitrary daily streak.
4. **Time feasibility is visible.** Tasks, habits, goal deadlines, events, and
   focus blocks belong in one schedule, with drag-to-reschedule.
5. **Failure has a first-class state.** Let a person complete, skip, fail,
   reschedule, or log progress for an occurrence. Do not pretend every missed
   plan should become an overdue task.
6. **Goal review is built in.** Surface a small weekly ritual: inspect
   progress, choose next actions, schedule them, and revise the plan.

### REA evidence and bounds

REA statically analyzed the fetched public Griply web bundle
(`index-50d5f221.js`, 1,670,092 bytes, SHA-256
`03fa91ea8bab0d026c933057ea6ff704352b3886aba0d80d083052383034a9b8`).
The analysis parsed one JavaScript file with no parse failures and retained
evidence `ev_df1fd48003fb708ab26d359dacb3615bd0a71ee7de367bf77ef75291090f6a4f`.
Static inspection only: it did not execute the app, log in, inspect private
data, or establish runtime behaviour. The top-level bundle lazy-loads feature
chunks, so this is a credible UI/data-model reconstruction, not a complete
source reconstruction.

### Desktop binary inspection

I also obtained Griply's official Windows installer from the developer's public
download page and statically extracted its Electron payload. The installer is
an NSIS PE package (SHA-256
`5ec3f3886de0aaf5441272c269a1e8e78eaaf0a2504496fd7c45e37b76037bb4`),
containing `app-64.7z`, which contains `resources/app.asar` (SHA-256
`c832bfedc3ac415075a307d8a73587158f1ba84a1313ebdaa31ea98f96628f32`).

REA analysis of the ASAR (evidence
`ev_ff99e960b25da49a44ddaf78298aa0613c3e5ab52a2b08d762db71ecefe7f868`)
found a single Electron `BrowserWindow`, three explicit web-preference
observations, two context-bridge surfaces, 15 exposed API members, and static
desktop hooks for task creation, push-token retrieval, popover sizing,
opening a browser, and local Electron-store data access. This supports the
architecture inference that Griply's desktop client is a focused native shell
around the same web product, augmented with small OS integrations—not a
separate desktop product. Static evidence does not prove execution,
reachability, or security-policy enforcement.

### Android binary inspection

An authorized Android device supplied the official Google Play installation of
Griply 3.53.4 (package `app.griply`, version code 23). I copied its four
installed APK splits into `artifacts/griply-3.53.4/`; the inspected base APK
has SHA-256 `108dd7a24a72d67def296b424e9923f07b2bf557a42fe785748b11df93a4f842`.
REA/JADX static package evidence is
`ev_1d634ac2d4f2e61017b4c0894e29e56126fb3f73cb45df77fd8fe01a9a01ce39`.

The Android client is React Native with Expo integration, rather than a wholly
native UI: `MainActivity` returns the React component name `main` (evidence
`ev_7714391982ac4c3958905150a5beebc74caa785fe5c03304bf17e7e78a650da7`),
and the verified package inventory contains a 11,929,288-byte Hermes JavaScript
bundle at `assets/index.android.bundle` (inventory evidence
`ev_200a73997a417cd04010cfde08ebc0cb1e73707653625d733c96d4ab5e181f64`).
The bundle is Hermes bytecode, so readable original JavaScript source is not
present in the APK.

Platform-specific integration is deliberately narrow but valuable: the
application declares a Today widget receiver/update worker, a quick-add task
tile, and a share-to-create-task activity. Its widget updater reads a trigger
parameter and delegates refresh work through Android WorkManager (method
evidence `ev_e746297f7eea89a1a65b7246df5500eed780d558069151b76541dca6a137dafd`).
The manifest also declares notifications, boot completion, network state,
biometrics, camera, audio, Google/Firebase messaging, and Play Billing
permissions. These declarations and code paths are static observations—not
proof that each capability is used during a given session.

## MVP recommendation

Build the smallest version that preserves the goal-to-today chain:

1. Onboarding: pick 1–3 life areas and create one measurable goal.
2. Goals: metric, deadline, progress history, and a single next action.
3. Today: inbox + scheduled tasks/habits, with quick complete/skip/reschedule.
4. Habits: target-per-period scheduling; no streak pressure as the primary
   signal.
5. Weekly review: progress, missed-plan cleanup, and next-week planning.

Defer calendar sync, AI planning, collaboration, widgets, desktop clients,
advanced filtering, and full roadmap/Gantt visualisation until the core loop
retains users.
