export function makeFmt({ locale = "en-AU", currency = "AUD" } = {}) {
  const nf = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  });
  return (n) => nf.format(Number.isFinite(n) ? n : 0);
}

export const fmt = makeFmt();
