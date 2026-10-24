import { StatusBar } from "expo-status-bar";
import { useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ProgressMode } from "./src/application/PlannerService";
import { createPlanner } from "./src/application/createPlanner";
import {
  Goal,
  GoalProgressEntry,
  HabitPeriod,
  HabitPeriodClosure,
  OccurrenceState,
  TodayItem,
} from "./src/domain/models";
import { theme } from "./src/presentation/theme";

type Tab = "today" | "goals" | "review";
const modes: { label: string; value: ProgressMode }[] = [
  { label: "Tasks", value: "completedTasks" },
  { label: "Manual", value: "manual" },
  { label: "Subgoals", value: "subgoals" },
];
const habitPeriods: HabitPeriod[] = ["week", "month", "year"];

export default function App() {
  const planner = useRef(createPlanner()).current;
  const [tab, setTab] = useState<Tab>("today");
  const [revision, setRevision] = useState(0);
  const [goalName, setGoalName] = useState("");
  const [lifeArea, setLifeArea] = useState("Personal");
  const [baseline, setBaseline] = useState("0");
  const [target, setTarget] = useState("5");
  const [unit, setUnit] = useState("actions");
  const [deadline, setDeadline] = useState("This week");
  const [editingGoalId, setEditingGoalId] = useState<string | undefined>();
  const [subgoalParentId, setSubgoalParentId] = useState<string | undefined>();
  const [progressGoalId, setProgressGoalId] = useState<string | undefined>();
  const [progressValue, setProgressValue] = useState("");
  const [progressDate, setProgressDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [progressNote, setProgressNote] = useState("");
  const [taskName, setTaskName] = useState("");
  const [captureKind, setCaptureKind] = useState<"task" | "habit">("task");
  const [habitTarget, setHabitTarget] = useState("3");
  const [habitPeriod, setHabitPeriod] = useState<HabitPeriod>("week");
  const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>();
  const [mode, setMode] = useState<ProgressMode>("completedTasks");
  const goals = useMemo(() => planner.listGoals(), [planner, revision]);
  const today = useMemo(() => planner.getToday(), [planner, revision]);
  const history = useMemo(
    () => planner.getWeeklyHistory(),
    [planner, revision],
  );
  const closures = useMemo(
    () => planner.getHabitPeriodClosures(),
    [planner, revision],
  );
  const refresh = () => setRevision((value) => value + 1);
  const clearGoalForm = () => {
    setGoalName("");
    setLifeArea("Personal");
    setBaseline("0");
    setTarget("5");
    setUnit("actions");
    setDeadline("This week");
    setMode("completedTasks");
    setEditingGoalId(undefined);
    setSubgoalParentId(undefined);
  };
  const saveGoal = () => {
    const name = goalName.trim();
    if (!name)
      return Alert.alert(
        "Name your goal",
        "Give this goal a short, memorable name.",
      );
    const parsedBaseline = Number(baseline);
    const parsedTarget = Number(target);
    if (
      !Number.isFinite(parsedBaseline) ||
      !Number.isFinite(parsedTarget) ||
      parsedTarget <= parsedBaseline
    ) {
      return Alert.alert(
        "Check the measurement",
        "Target must be a number greater than the baseline.",
      );
    }
    const measurement = {
      name,
      lifeArea: lifeArea.trim(),
      baseline: parsedBaseline,
      target: parsedTarget,
      unit: unit.trim(),
      deadline: deadline.trim(),
      progressMode: mode,
    };
    if (!measurement.lifeArea || !measurement.unit || !measurement.deadline) {
      return Alert.alert(
        "Complete the measurement",
        "Life area, unit, and deadline are required.",
      );
    }
    const goal = editingGoalId
      ? planner.updateGoal(editingGoalId, measurement)
      : subgoalParentId
        ? planner.createSubgoal(subgoalParentId, measurement)
        : planner.createGoal(measurement);
    if (!goal)
      return Alert.alert(
        "Could not save",
        "This child goal needs a parent using subgoal progress.",
      );
    if (goal) setSelectedGoalId(goal.id);
    clearGoalForm();
    refresh();
  };
  const editGoal = (goal: Goal) => {
    setGoalName(goal.name);
    setLifeArea(goal.lifeArea);
    setBaseline(String(goal.baseline));
    setTarget(String(goal.target));
    setUnit(goal.unit);
    setDeadline(goal.deadline);
    setMode(goal.progressMode);
    setEditingGoalId(goal.id);
    setSubgoalParentId(undefined);
  };
  const startSubgoal = (parent: Goal) => {
    clearGoalForm();
    setSubgoalParentId(parent.id);
    setMode("manual");
  };
  const logProgress = () => {
    const value = Number(progressValue);
    if (!progressGoalId || !Number.isFinite(value) || value <= 0)
      return Alert.alert(
        "Enter progress",
        "Use a positive number for this progress update.",
      );
    if (
      !planner.logGoalProgress({
        goalId: progressGoalId,
        value,
        date: progressDate,
        note: progressNote,
      })
    )
      return Alert.alert(
        "Check the entry",
        "Use a valid YYYY-MM-DD date for a manual goal.",
      );
    setProgressGoalId(undefined);
    setProgressValue("");
    setProgressNote("");
    refresh();
  };
  const captureTask = () => {
    const title = taskName.trim();
    if (!title) return;
    if (captureKind === "task") planner.captureTask(title, selectedGoalId);
    else {
      const target = Number(habitTarget);
      if (!Number.isInteger(target) || target < 1)
        return Alert.alert(
          "Set a target",
          "Use a whole number of at least 1 for this habit.",
        );
      planner.captureHabit(title, target, habitPeriod, selectedGoalId);
    }
    setTaskName("");
    refresh();
  };
  const applyAction = (
    item: TodayItem,
    action: OccurrenceState | "reschedule",
  ) => {
    planner.applyOccurrenceAction(item.id, action);
    refresh();
  };
  const closePeriods = () => {
    planner.closeEndedHabitPeriods();
    refresh();
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.eyebrow}>GOAL TO TODAY</Text>
        <Text style={styles.title}>
          {tab === "today"
            ? "Make today count."
            : tab === "goals"
              ? "Your direction."
              : "Close the loop."}
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {tab === "today" && (
          <TodayView
            items={today}
            goals={goals}
            selectedGoalId={selectedGoalId}
            taskName={taskName}
            captureKind={captureKind}
            habitTarget={habitTarget}
            habitPeriod={habitPeriod}
            onTaskName={setTaskName}
            onKind={setCaptureKind}
            onHabitTarget={setHabitTarget}
            onHabitPeriod={setHabitPeriod}
            onGoal={setSelectedGoalId}
            onCapture={captureTask}
            onAction={applyAction}
          />
        )}
        {tab === "goals" && (
          <GoalsView
            goals={goals}
            goalName={goalName}
            lifeArea={lifeArea}
            baseline={baseline}
            target={target}
            unit={unit}
            deadline={deadline}
            mode={mode}
            editing={Boolean(editingGoalId)}
            subgoalParent={
              subgoalParentId
                ? goals.find((goal) => goal.id === subgoalParentId)
                : undefined
            }
            progressGoal={
              progressGoalId
                ? goals.find((goal) => goal.id === progressGoalId)
                : undefined
            }
            progressValue={progressValue}
            progressDate={progressDate}
            progressNote={progressNote}
            onGoalName={setGoalName}
            onLifeArea={setLifeArea}
            onBaseline={setBaseline}
            onTarget={setTarget}
            onUnit={setUnit}
            onDeadline={setDeadline}
            onMode={setMode}
            onSave={saveGoal}
            onCancel={clearGoalForm}
            onEdit={editGoal}
            onStartSubgoal={startSubgoal}
            onLogGoal={setProgressGoalId}
            onProgressValue={setProgressValue}
            onProgressDate={setProgressDate}
            onProgressNote={setProgressNote}
            onLogProgress={logProgress}
            onCancelProgress={() => setProgressGoalId(undefined)}
            entriesForGoal={(goalId) => planner.getGoalProgressEntries(goalId)}
          />
        )}
        {tab === "review" && (
          <ReviewView
            history={history}
            closures={closures}
            onClosePeriods={closePeriods}
          />
        )}
      </ScrollView>
      <View style={styles.tabBar}>
        {(["today", "goals", "review"] as Tab[]).map((item) => (
          <TabButton
            key={item}
            item={item}
            active={tab === item}
            onPress={() => setTab(item)}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

function TodayView({
  items,
  goals,
  selectedGoalId,
  taskName,
  captureKind,
  habitTarget,
  habitPeriod,
  onTaskName,
  onKind,
  onHabitTarget,
  onHabitPeriod,
  onGoal,
  onCapture,
  onAction,
}: {
  items: TodayItem[];
  goals: Goal[];
  selectedGoalId?: string;
  taskName: string;
  captureKind: "task" | "habit";
  habitTarget: string;
  habitPeriod: HabitPeriod;
  onTaskName: (value: string) => void;
  onKind: (value: "task" | "habit") => void;
  onHabitTarget: (value: string) => void;
  onHabitPeriod: (value: HabitPeriod) => void;
  onGoal: (id: string | undefined) => void;
  onCapture: () => void;
  onAction: (item: TodayItem, action: OccurrenceState | "reschedule") => void;
}) {
  return (
    <>
      <Text style={styles.sectionTitle}>TODAY'S PLAN</Text>
      <View style={styles.captureCard}>
        <View style={styles.modeRow}>
          <Chip
            label="Task"
            selected={captureKind === "task"}
            onPress={() => onKind("task")}
          />
          <Chip
            label="Habit"
            selected={captureKind === "habit"}
            onPress={() => onKind("habit")}
          />
        </View>
        <TextInput
          value={taskName}
          onChangeText={onTaskName}
          placeholder={
            captureKind === "habit"
              ? "What habit are you building?"
              : "What is one next action?"
          }
          placeholderTextColor={theme.colors.inkMuted}
          style={styles.input}
          onSubmitEditing={onCapture}
        />
        {captureKind === "habit" && (
          <View style={styles.habitTargetRow}>
            <TextInput
              value={habitTarget}
              onChangeText={onHabitTarget}
              keyboardType="number-pad"
              style={[styles.input, styles.targetInput]}
            />
            <Text style={styles.helper}>times per</Text>
            <View style={styles.modeRow}>
              {habitPeriods.map((period) => (
                <Chip
                  key={period}
                  label={period}
                  selected={habitPeriod === period}
                  onPress={() => onHabitPeriod(period)}
                />
              ))}
            </View>
          </View>
        )}
        {goals.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            <Chip
              label="Inbox"
              selected={!selectedGoalId}
              onPress={() => onGoal(undefined)}
            />
            {goals.map((goal) => (
              <Chip
                key={goal.id}
                label={goal.name}
                selected={selectedGoalId === goal.id}
                onPress={() => onGoal(goal.id)}
              />
            ))}
          </ScrollView>
        )}
        <Pressable style={styles.primaryButton} onPress={onCapture}>
          <Text style={styles.primaryText}>Add {captureKind} to today</Text>
        </Pressable>
      </View>
      {items.length === 0 ? (
        <EmptyState />
      ) : (
        items.map((item) => (
          <TodayCard key={item.id} item={item} onAction={onAction} />
        ))
      )}
    </>
  );
}
function GoalsView({
  goals,
  goalName,
  lifeArea,
  baseline,
  target,
  unit,
  deadline,
  mode,
  editing,
  subgoalParent,
  progressGoal,
  progressValue,
  progressDate,
  progressNote,
  onGoalName,
  onLifeArea,
  onBaseline,
  onTarget,
  onUnit,
  onDeadline,
  onMode,
  onSave,
  onCancel,
  onEdit,
  onStartSubgoal,
  onLogGoal,
  onProgressValue,
  onProgressDate,
  onProgressNote,
  onLogProgress,
  onCancelProgress,
  entriesForGoal,
}: {
  goals: Goal[];
  goalName: string;
  lifeArea: string;
  baseline: string;
  target: string;
  unit: string;
  deadline: string;
  mode: ProgressMode;
  editing: boolean;
  subgoalParent?: Goal;
  progressGoal?: Goal;
  progressValue: string;
  progressDate: string;
  progressNote: string;
  onGoalName: (value: string) => void;
  onLifeArea: (value: string) => void;
  onBaseline: (value: string) => void;
  onTarget: (value: string) => void;
  onUnit: (value: string) => void;
  onDeadline: (value: string) => void;
  onMode: (mode: ProgressMode) => void;
  onSave: () => void;
  onCancel: () => void;
  onEdit: (goal: Goal) => void;
  onStartSubgoal: (goal: Goal) => void;
  onLogGoal: (goalId: string) => void;
  onProgressValue: (value: string) => void;
  onProgressDate: (value: string) => void;
  onProgressNote: (value: string) => void;
  onLogProgress: () => void;
  onCancelProgress: () => void;
  entriesForGoal: (goalId: string) => GoalProgressEntry[];
}) {
  return (
    <>
      <View style={styles.captureCard}>
        <Text style={styles.cardLabel}>
          {editing
            ? "EDIT GOAL MEASUREMENT"
            : subgoalParent
              ? `NEW CHILD OUTCOME · ${subgoalParent.name}`
              : "NEW MEASURABLE GOAL"}
        </Text>
        <TextInput
          value={goalName}
          onChangeText={onGoalName}
          placeholder="e.g. Build a consistent reading habit"
          placeholderTextColor={theme.colors.inkMuted}
          style={styles.input}
        />
        <View style={styles.formRow}>
          <Field
            label="Life area"
            value={lifeArea}
            onChange={onLifeArea}
            placeholder="Personal"
          />
          <Field
            label="Unit"
            value={unit}
            onChange={onUnit}
            placeholder="actions"
          />
        </View>
        <View style={styles.formRow}>
          <Field
            label="Baseline"
            value={baseline}
            onChange={onBaseline}
            placeholder="0"
            numeric
          />
          <Field
            label="Target"
            value={target}
            onChange={onTarget}
            placeholder="5"
            numeric
          />
        </View>
        <Field
          label="Deadline"
          value={deadline}
          onChange={onDeadline}
          placeholder="This week"
        />
        <Text style={styles.helper}>Progress source</Text>
        <View style={styles.modeRow}>
          {modes.map((item) => (
            <Chip
              key={item.value}
              label={item.label}
              selected={mode === item.value}
              onPress={() => onMode(item.value)}
            />
          ))}
        </View>
        <Pressable style={styles.primaryButton} onPress={onSave}>
          <Text style={styles.primaryText}>
            {editing ? "Save measurement" : "Create goal"}
          </Text>
        </Pressable>
        {editing && (
          <Pressable style={styles.secondaryButton} onPress={onCancel}>
            <Text style={styles.secondaryText}>Cancel edit</Text>
          </Pressable>
        )}
      </View>
      {progressGoal && (
        <View style={styles.captureCard}>
          <Text style={styles.cardLabel}>
            LOG PROGRESS · {progressGoal.name}
          </Text>
          <Text style={styles.helper}>
            Add a positive {progressGoal.unit} increment to this manual goal.
          </Text>
          <View style={styles.formRow}>
            <Field
              label="Value"
              value={progressValue}
              onChange={onProgressValue}
              placeholder="1"
              numeric
            />
            <Field
              label="Date"
              value={progressDate}
              onChange={onProgressDate}
              placeholder="YYYY-MM-DD"
            />
          </View>
          <Field
            label="Note (optional)"
            value={progressNote}
            onChange={onProgressNote}
            placeholder="What changed?"
          />
          <Pressable style={styles.primaryButton} onPress={onLogProgress}>
            <Text style={styles.primaryText}>Save progress entry</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={onCancelProgress}>
            <Text style={styles.secondaryText}>Cancel</Text>
          </Pressable>
        </View>
      )}
      <Text style={styles.sectionTitle}>ACTIVE GOALS</Text>
      {goals.length === 0 ? (
        <EmptyState text="Create a goal, then connect today's actions to it." />
      ) : (
        goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            childCount={
              goals.filter((child) => child.parentGoalId === goal.id).length
            }
            entries={entriesForGoal(goal.id)}
            onEdit={() => onEdit(goal)}
            onStartSubgoal={() => onStartSubgoal(goal)}
            onLog={() => onLogGoal(goal.id)}
          />
        ))
      )}
    </>
  );
}
function ReviewView({
  history,
  closures,
  onClosePeriods,
}: {
  history: TodayItem[];
  closures: HabitPeriodClosure[];
  onClosePeriods: () => void;
}) {
  const completed = history.filter((item) => item.state === "completed").length;
  const missed = history.filter(
    (item) => item.state === "skipped" || item.state === "failed",
  ).length;
  const moved = history.filter(
    (item) => item.scheduledFor !== new Date().toISOString().slice(0, 10),
  ).length;
  return (
    <>
      <Text style={styles.sectionTitle}>REVIEW & RESET</Text>
      <View style={styles.stats}>
        <Stat value={completed} label="completed" />
        <Stat value={missed} label="missed" />
        <Stat value={moved} label="rescheduled" />
      </View>
      <View style={styles.reviewCard}>
        <Text style={styles.cardLabel}>HABIT PERIODS</Text>
        <Text style={styles.reviewText}>
          Close elapsed periods to record the target result and schedule one
          next occurrence. Repeating this is safe.
        </Text>
        <Pressable style={styles.primaryButton} onPress={onClosePeriods}>
          <Text style={styles.primaryText}>Close elapsed periods</Text>
        </Pressable>
      </View>
      {closures.length > 0 && (
        <View style={styles.closureCard}>
          <Text style={styles.cardLabel}>CLOSED TARGETS</Text>
          {closures.map((closure) => (
            <Text key={closure.id} style={styles.closureText}>
              {closure.completedCount} / {closure.targetCount} completed ·{" "}
              {closure.completedCount >= closure.targetCount
                ? "target met"
                : "target missed"}
            </Text>
          ))}
        </View>
      )}
      <View style={styles.reviewCard}>
        <Text style={styles.cardLabel}>CLEANUP PROMPT</Text>
        <Text style={styles.reviewText}>
          {missed
            ? "Review the missed work and choose a fresh next action. Missed items are never silently counted as complete."
            : "No missed work yet. Choose the smallest action that keeps your goal moving."}
        </Text>
      </View>
    </>
  );
}
function TodayCard({
  item,
  onAction,
}: {
  item: TodayItem;
  onAction: (item: TodayItem, action: OccurrenceState | "reschedule") => void;
}) {
  const habit = item.contribution.habitTarget;
  return (
    <View style={styles.todayCard}>
      <View>
        <Text style={styles.taskTitle}>{item.contribution.title}</Text>
        <Text style={styles.goalLink}>
          {item.goal
            ? `For ${item.goal.name}`
            : item.contribution.kind === "habit"
              ? "Inbox habit"
              : "Inbox task"}
          {habit ? ` · ${habit.count}× / ${habit.period}` : ""}
        </Text>
      </View>
      <View style={styles.actionRow}>
        <Action
          label="Done"
          tone="good"
          onPress={() => onAction(item, "completed")}
        />
        <Action label="Skip" onPress={() => onAction(item, "skipped")} />
        <Action
          label="Fail"
          tone="bad"
          onPress={() => onAction(item, "failed")}
        />
        <Action label="Tomorrow" onPress={() => onAction(item, "reschedule")} />
      </View>
    </View>
  );
}
function GoalCard({
  goal,
  childCount,
  entries,
  onEdit,
  onStartSubgoal,
  onLog,
}: {
  goal: Goal;
  childCount: number;
  entries: GoalProgressEntry[];
  onEdit: () => void;
  onStartSubgoal: () => void;
  onLog: () => void;
}) {
  const percent =
    goal.target === goal.baseline
      ? 100
      : Math.round(
          ((goal.progress - goal.baseline) / (goal.target - goal.baseline)) *
            100,
        );
  return (
    <View style={styles.goalCard}>
      <Text style={styles.taskTitle}>{goal.name}</Text>
      <Text style={styles.goalLink}>
        {goal.lifeArea} · {goal.deadline} ·{" "}
        {goal.progressMode === "completedTasks"
          ? "task progress"
          : goal.progressMode}
      </Text>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.max(0, Math.min(100, percent))}%` },
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        {goal.progress} / {goal.target} {goal.unit}
      </Text>
      <Pressable style={styles.editButton} onPress={onEdit}>
        <Text style={styles.editText}>Edit measurement</Text>
      </Pressable>
      {goal.progressMode === "manual" && (
        <Pressable style={styles.editButton} onPress={onLog}>
          <Text style={styles.editText}>Log progress</Text>
        </Pressable>
      )}
      {goal.progressMode === "subgoals" && (
        <Pressable style={styles.editButton} onPress={onStartSubgoal}>
          <Text style={styles.editText}>
            Add child outcome{childCount ? ` · ${childCount}` : ""}
          </Text>
        </Pressable>
      )}
      {entries.length > 0 && (
        <Text style={styles.entryText}>
          Latest: +{entries[0].value} on {entries[0].date}
          {entries[0].note ? ` · ${entries[0].note}` : ""}
        </Text>
      )}
    </View>
  );
}
function EmptyState({
  text = "Your plan is clear. Add one small action to make progress today.",
}: {
  text?: string;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}
function Field({
  label,
  value,
  onChange,
  placeholder,
  numeric = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  numeric?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.helper}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.inkMuted}
        keyboardType={numeric ? "decimal-pad" : "default"}
        style={styles.input}
      />
    </View>
  );
}
function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text
        style={[styles.chipText, selected && styles.chipTextSelected]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}
function Action({
  label,
  tone,
  onPress,
}: {
  label: string;
  tone?: "good" | "bad";
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.action,
        tone === "good" && styles.actionGood,
        tone === "bad" && styles.actionBad,
      ]}
    >
      <Text
        style={[
          styles.actionText,
          tone === "good" && styles.actionGoodText,
          tone === "bad" && styles.actionBadText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
function TabButton({
  item,
  active,
  onPress,
}: {
  item: Tab;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.tab}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {item}
      </Text>
    </Pressable>
  );
}

const c = theme.colors;
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: c.canvas },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 18 },
  eyebrow: {
    color: c.primary,
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 1.4,
  },
  title: { color: c.ink, fontSize: 32, fontWeight: "800", marginTop: 6 },
  content: { padding: theme.spacing.screen, paddingBottom: 120, gap: 14 },
  sectionTitle: {
    color: c.inkMuted,
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 1.2,
    marginTop: 4,
  },
  captureCard: {
    backgroundColor: c.surfaceAccent,
    borderRadius: theme.radius.card,
    padding: theme.spacing.card,
    gap: 12,
  },
  input: {
    backgroundColor: c.surface,
    borderRadius: theme.radius.control,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: c.ink,
    fontSize: 16,
  },
  field: { flex: 1, gap: 5 },
  formRow: { flexDirection: "row", gap: 10 },
  targetInput: { width: 62, textAlign: "center" },
  habitTargetRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chips: { gap: 8 },
  modeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: c.surfaceMuted,
    maxWidth: 180,
  },
  chipSelected: { backgroundColor: c.primary },
  chipText: { color: c.inkMuted, fontSize: 12, fontWeight: "700" },
  chipTextSelected: { color: c.surface },
  primaryButton: {
    alignItems: "center",
    backgroundColor: c.primary,
    borderRadius: theme.radius.control,
    paddingVertical: 13,
  },
  primaryText: { color: c.surface, fontWeight: "800" },
  secondaryButton: {
    alignItems: "center",
    borderColor: c.border,
    borderRadius: theme.radius.control,
    borderWidth: 1,
    paddingVertical: 11,
  },
  secondaryText: { color: c.primary, fontWeight: "800" },
  helper: { color: c.inkMuted, fontSize: 12 },
  cardLabel: {
    color: c.primary,
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 1,
  },
  todayCard: {
    backgroundColor: c.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.card,
    gap: 14,
    shadowColor: c.ink,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  taskTitle: { color: c.ink, fontWeight: "800", fontSize: 16 },
  goalLink: { color: c.inkMuted, marginTop: 4, fontSize: 13 },
  actionRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  action: {
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 9,
    backgroundColor: c.surfaceMuted,
  },
  actionText: { color: c.inkMuted, fontSize: 11, fontWeight: "800" },
  actionGood: { backgroundColor: c.successSoft },
  actionGoodText: { color: c.success },
  actionBad: { backgroundColor: c.dangerSoft },
  actionBadText: { color: c.danger },
  empty: {
    borderColor: c.border,
    borderStyle: "dashed",
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
  },
  emptyText: {
    color: c.inkMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  goalCard: {
    backgroundColor: c.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.card,
  },
  editButton: {
    alignSelf: "flex-start",
    marginTop: 13,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: c.primarySoft,
  },
  editText: { color: c.primary, fontSize: 12, fontWeight: "800" },
  progressTrack: {
    backgroundColor: c.surfaceMuted,
    borderRadius: theme.radius.pill,
    height: 9,
    marginTop: 16,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: c.primary,
    height: "100%",
    borderRadius: theme.radius.pill,
  },
  progressText: {
    color: c.inkMuted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 7,
  },
  entryText: {
    color: c.inkMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },
  stats: { flexDirection: "row", gap: 10 },
  stat: { flex: 1, backgroundColor: c.surface, padding: 14, borderRadius: 16 },
  statValue: { color: c.ink, fontSize: 27, fontWeight: "800" },
  statLabel: { color: c.inkMuted, fontSize: 11, marginTop: 2 },
  reviewCard: {
    backgroundColor: c.warningSoft,
    padding: 18,
    borderRadius: theme.radius.card,
    gap: 9,
  },
  reviewText: { color: c.ink, fontSize: 16, lineHeight: 23 },
  closureCard: {
    backgroundColor: c.surface,
    padding: theme.spacing.card,
    borderRadius: theme.radius.card,
    gap: 8,
  },
  closureText: { color: c.ink, fontSize: 14, fontWeight: "700" },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: c.border,
    backgroundColor: c.surface,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tab: { alignItems: "center", flex: 1, paddingVertical: 7 },
  tabText: {
    color: c.inkMuted,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  tabTextActive: { color: c.primary },
});
