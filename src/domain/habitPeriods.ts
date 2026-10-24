import { HabitPeriod } from "./models";

const pad = (value: number) => String(value).padStart(2, "0");

export const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const periodAnchorFor = (date: Date, period: HabitPeriod): string => {
  const anchor = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (period === "week")
    anchor.setDate(anchor.getDate() - ((anchor.getDay() + 6) % 7));
  if (period === "month") anchor.setDate(1);
  if (period === "year") anchor.setMonth(0, 1);
  return toDateKey(anchor);
};

export const nextPeriodAnchor = (
  anchor: string,
  period: HabitPeriod,
): string => {
  const next = new Date(`${anchor}T00:00:00`);
  if (period === "week") next.setDate(next.getDate() + 7);
  if (period === "month") next.setMonth(next.getMonth() + 1, 1);
  if (period === "year") next.setFullYear(next.getFullYear() + 1, 0, 1);
  return toDateKey(next);
};
