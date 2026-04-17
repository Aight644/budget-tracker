export function cleanMerchant(desc) {
  if (!desc) return "";
  let s = desc.toUpperCase();
  s = s.replace(/\b\d{6,}\b/g, " ");
  s = s.replace(/\b\d{1,2}[\/\-\.]\d{1,2}(?:[\/\-\.]\d{2,4})?\b/g, " ");
  s = s.replace(/\bX{3,}\d*\b/g, " ");
  s = s.replace(/\b(?:POS|EFTPOS|VISA|MC|MASTERCARD|AMEX|DIRECT\s+DEBIT|DIRECT\s+CREDIT|AUS|AUSTRALIA|PURCHASE|PAYMENT|TFR|TRANSFER|WITHDRAWAL|DEPOSIT|REF|ATM|CARD|INTERNET|ONLINE|MOBILE|PAYPAL\s+\*|SQ\s+\*|SQUARE\s+\*)\b/g, " ");
  s = s.replace(/[^A-Z0-9 &\-\.]/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s.slice(0, 40);
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

const FREQ_WINDOWS = [
  { id: "weekly", min: 5, max: 9 },
  { id: "fortnightly", min: 11, max: 17 },
  { id: "monthly", min: 24, max: 35 },
  { id: "quarterly", min: 80, max: 100 },
  { id: "yearly", min: 350, max: 380 },
];

export function detectSubscriptions(transactions, { minOccurrences = 2, amountTolerance = 0.15 } = {}) {
  const expenses = transactions.filter((t) => !t.isIncome && t.date && (t.note || "").trim());
  const groups = {};
  for (const t of expenses) {
    const key = cleanMerchant(t.note);
    if (key.length < 3) continue;
    (groups[key] ||= []).push(t);
  }

  const subs = [];
  for (const [key, listRaw] of Object.entries(groups)) {
    if (listRaw.length < minOccurrences) continue;
    const list = listRaw.slice().sort((a, b) => a.date.localeCompare(b.date));

    const intervals = [];
    for (let i = 1; i < list.length; i++) {
      intervals.push(daysBetween(list[i - 1].date, list[i].date));
    }
    const avgInterval = intervals.reduce((s, x) => s + x, 0) / Math.max(intervals.length, 1);

    const freq = FREQ_WINDOWS.find((w) => avgInterval >= w.min && avgInterval <= w.max);
    if (!freq) continue;

    const avgAmt = list.reduce((s, t) => s + t.amount, 0) / list.length;
    if (avgAmt <= 0) continue;
    const consistent = list.every((t) => Math.abs(t.amount - avgAmt) / avgAmt <= amountTolerance);
    if (!consistent) continue;

    subs.push({
      id: `sub-${key.replace(/\s+/g, "-")}`,
      merchant: key,
      displayName: titleCase(key),
      amount: Math.round(avgAmt * 100) / 100,
      frequency: freq.id,
      occurrences: list.length,
      lastDate: list[list.length - 1].date,
      firstDate: list[0].date,
      category: guessCategory(key),
    });
  }
  return subs.sort((a, b) => b.occurrences - a.occurrences || b.amount - a.amount);
}

function titleCase(s) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const CATEGORY_HINTS = {
  subscriptions: ["NETFLIX", "SPOTIFY", "DISNEY", "AMAZON PRIME", "YOUTUBE", "APPLE", "GOOGLE", "STAN", "BINGE", "ADOBE", "MICROSOFT", "DROPBOX", "ICLOUD", "GITHUB", "OPENAI", "CLAUDE", "ANTHROPIC"],
  utilities: ["TELSTRA", "OPTUS", "VODAFONE", "ENERGYAUSTRALIA", "AGL", "ORIGIN", "NBN", "INTERNET", "ELECTRIC", "GAS", "WATER"],
  housing: ["RENT", "MORTGAGE", "STRATA", "COUNCIL"],
  transport: ["UBER", "LYFT", "BOLT", "DIDI", "OPAL", "MYKI", "TRANSPORT", "FUEL", "PETROL", "SHELL", "BP", "7-ELEVEN", "CALTEX"],
  food: ["WOOLWORTHS", "COLES", "ALDI", "IGA", "UBER EATS", "MENULOG", "DOORDASH", "MCDONALDS", "KFC", "SUBWAY", "COFFEE"],
  personal: ["GYM", "FITNESS", "F45", "ANYTIME"],
};

function guessCategory(merchant) {
  for (const [cat, words] of Object.entries(CATEGORY_HINTS)) {
    if (words.some((w) => merchant.includes(w))) return cat;
  }
  return "subscriptions";
}
