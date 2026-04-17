export function cleanMerchant(desc) {
  if (!desc) return "";
  let s = desc.toUpperCase();
  s = s.replace(/\b\d{1,2}[\/\-\.]\d{1,2}(?:[\/\-\.]\d{2,4})?\b/g, " ");
  s = s.replace(/\b\d{3,4}[-\s]?\d{3,4}[-\s]?\d{4,}\b/g, " ");
  s = s.replace(/\b\d{4,}\b/g, " ");
  s = s.replace(/X{3,}\d*/g, " ");
  s = s.replace(/\b(?:POS|EFTPOS|VISA|MC|MASTERCARD|AMEX|DIRECT\s+DEBIT|DIRECT\s+CREDIT|AUS|AUSTRALIA|USA|PURCHASE|PAYMENT|TFR|TRANSFER|WITHDRAWAL|DEPOSIT|REF|ATM|CARD|INTERNET|ONLINE|MOBILE|PAYPAL\s+\*|SQ\s+\*|SQUARE\s+\*|RECURRING|AUTHORISATION|AUTH)\b/g, " ");
  s = s.replace(/\s+[A-Z]{2}\s*$/, " ");
  s = s.replace(/[^A-Z0-9 &\.]/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s.slice(0, 30);
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

const FREQ_WINDOWS = [
  { id: "weekly", min: 5, max: 10 },
  { id: "fortnightly", min: 11, max: 18 },
  { id: "monthly", min: 22, max: 42 },
  { id: "quarterly", min: 75, max: 110 },
  { id: "yearly", min: 340, max: 400 },
];

function sameDayOfMonth(dates) {
  if (dates.length < 2) return false;
  const days = dates.map((d) => new Date(d).getDate());
  const min = Math.min(...days);
  const max = Math.max(...days);
  const spread = max - min;
  return spread <= 4 || spread >= 26;
}

export function detectSubscriptions(transactions, { minOccurrences = 2, amountTolerance = 0.40 } = {}) {
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
    const sortedInt = intervals.slice().sort((a, b) => a - b);
    const median = sortedInt[Math.floor(sortedInt.length / 2)] ?? 0;

    let freq = FREQ_WINDOWS.find((w) => median >= w.min && median <= w.max);
    if (!freq && sameDayOfMonth(list.map((t) => t.date)) && median >= 15 && median <= 50) {
      freq = FREQ_WINDOWS.find((w) => w.id === "monthly");
    }
    if (!freq) {
      const best = FREQ_WINDOWS.find((w) => intervals.some((i) => i >= w.min && i <= w.max));
      if (best) freq = best;
    }
    if (!freq) continue;

    const avgAmt = list.reduce((s, t) => s + t.amount, 0) / list.length;
    if (avgAmt <= 0) continue;
    const maxDev = Math.max(...list.map((t) => Math.abs(t.amount - avgAmt) / avgAmt));
    const confidence = maxDev <= 0.10 ? "high" : maxDev <= amountTolerance ? "medium" : "low";

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
      confidence,
      maxDeviation: maxDev,
    });
  }
  return subs.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    if (order[a.confidence] !== order[b.confidence]) return order[a.confidence] - order[b.confidence];
    return b.occurrences - a.occurrences || b.amount - a.amount;
  });
}

function titleCase(s) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const CATEGORY_HINTS = {
  subscriptions: ["NETFLIX", "SPOTIFY", "DISNEY", "AMAZON PRIME", "PRIME VIDEO", "YOUTUBE", "APPLE", "GOOGLE", "STAN", "BINGE", "KAYO", "PARAMOUNT", "ADOBE", "MICROSOFT", "DROPBOX", "ICLOUD", "GITHUB", "OPENAI", "CLAUDE", "ANTHROPIC", "NOTION", "LINEAR", "FIGMA", "CANVA", "AUDIBLE", "DUOLINGO", "CHATGPT", "LINKEDIN"],
  utilities: ["TELSTRA", "OPTUS", "VODAFONE", "BELONG", "AMAYSIM", "ENERGYAUSTRALIA", "AGL", "ORIGIN", "ALINTA", "RED ENERGY", "NBN", "INTERNET", "ELECTRIC", "GAS", "WATER", "SYDNEY WATER"],
  housing: ["RENT", "MORTGAGE", "STRATA", "COUNCIL", "LANDLORD", "REAL ESTATE"],
  transport: ["UBER", "LYFT", "BOLT", "DIDI", "OPAL", "MYKI", "TRANSPORT", "FUEL", "PETROL", "SHELL", "BP", "7-ELEVEN", "CALTEX", "AMPOL", "LINKT", "E-TOLL"],
  food: ["WOOLWORTHS", "COLES", "ALDI", "IGA", "HARRIS FARM", "UBER EATS", "MENULOG", "DOORDASH", "DELIVEROO", "MCDONALDS", "KFC", "SUBWAY", "COFFEE", "CAFE", "PIZZA"],
  personal: ["GYM", "FITNESS", "F45", "ANYTIME", "GOODLIFE", "CROSSFIT", "PILATES", "YOGA"],
};

function guessCategory(merchant) {
  for (const [cat, words] of Object.entries(CATEGORY_HINTS)) {
    if (words.some((w) => merchant.includes(w))) return cat;
  }
  return "subscriptions";
}
