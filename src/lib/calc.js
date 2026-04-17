import { FREQUENCIES } from "./constants.js";

const mult = (f) => {
  const x = FREQUENCIES.find((v) => v.id === f);
  return x ? x.multiplier : 0;
};

export const toFn = (a, f) => (a * mult(f)) / 26;
export const toMo = (a, f) => (a * mult(f)) / 12;
export const toYr = (a, f) => a * mult(f);

export const convertBy = (view) => (a, f) =>
  view === "fortnightly" ? toFn(a, f) : view === "monthly" ? toMo(a, f) : toYr(a, f);

export function advanceDue(isoDate, frequency) {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return null;
  switch (frequency) {
    case "weekly": d.setDate(d.getDate() + 7); break;
    case "fortnightly": d.setDate(d.getDate() + 14); break;
    case "monthly": d.setMonth(d.getMonth() + 1); break;
    case "quarterly": d.setMonth(d.getMonth() + 3); break;
    case "yearly": d.setFullYear(d.getFullYear() + 1); break;
    default: return null;
  }
  return d.toISOString().slice(0, 10);
}

export function rollForwardDue(isoDate, frequency, today = new Date()) {
  if (!isoDate) return null;
  let d = isoDate;
  const todayStr = today.toISOString().slice(0, 10);
  let guard = 0;
  while (d < todayStr && guard < 1000) {
    const next = advanceDue(d, frequency);
    if (!next) return d;
    d = next;
    guard++;
  }
  return d;
}

export function daysUntil(isoDate, today = new Date()) {
  if (!isoDate) return null;
  const target = new Date(isoDate);
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target - t) / 86400000);
}
