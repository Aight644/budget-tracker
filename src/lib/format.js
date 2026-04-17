import { CURRENCIES, DEFAULT_CURRENCY } from "./constants.js";

export function currencyInfo(code) {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES.find((c) => c.code === DEFAULT_CURRENCY);
}

export function makeFmt(code = DEFAULT_CURRENCY) {
  const info = currencyInfo(code);
  const nf = new Intl.NumberFormat(info.locale, {
    style: "currency",
    currency: info.code,
  });
  return (n) => nf.format(Number.isFinite(n) ? n : 0);
}

export const fmt = makeFmt();
