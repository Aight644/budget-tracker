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
