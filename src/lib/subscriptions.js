export const KNOWN_SUBSCRIPTIONS = [
  { patterns: ["NETFLIX"], name: "Netflix", frequency: "monthly", category: "subscriptions" },
  { patterns: ["DISNEY+", "DISNEY PLUS", "DISNEYPLUS"], name: "Disney+", frequency: "monthly", category: "subscriptions" },
  { patterns: ["HULU"], name: "Hulu", frequency: "monthly", category: "subscriptions" },
  { patterns: ["HBO MAX", "HBOMAX"], name: "HBO Max", frequency: "monthly", category: "subscriptions" },
  { patterns: ["APPLE TV", "APPLETV"], name: "Apple TV+", frequency: "monthly", category: "subscriptions" },
  { patterns: ["APPLE MUSIC", "APPLEMUSIC"], name: "Apple Music", frequency: "monthly", category: "subscriptions" },
  { patterns: ["APPLE ARCADE", "APPLEARCADE"], name: "Apple Arcade", frequency: "monthly", category: "subscriptions" },
  { patterns: ["ICLOUD"], name: "iCloud+", frequency: "monthly", category: "subscriptions" },
  { patterns: ["PARAMOUNT"], name: "Paramount+", frequency: "monthly", category: "subscriptions" },
  { patterns: ["PEACOCK"], name: "Peacock", frequency: "monthly", category: "subscriptions" },
  { patterns: ["STAN.COM", "STAN ENTERTAINMENT"], name: "Stan", frequency: "monthly", category: "subscriptions" },
  { patterns: ["BINGE"], name: "Binge", frequency: "monthly", category: "subscriptions" },
  { patterns: ["KAYO"], name: "Kayo Sports", frequency: "monthly", category: "subscriptions" },
  { patterns: ["FOXTEL"], name: "Foxtel", frequency: "monthly", category: "subscriptions" },
  { patterns: ["CRUNCHYROLL"], name: "Crunchyroll", frequency: "monthly", category: "subscriptions" },
  { patterns: ["FUNIMATION"], name: "Funimation", frequency: "monthly", category: "subscriptions" },
  { patterns: ["VRV"], name: "VRV", frequency: "monthly", category: "subscriptions" },
  { patterns: ["YOUTUBE PREMIUM", "YOUTUBEPREMIUM", "YOUTUBE MUSIC"], name: "YouTube Premium", frequency: "monthly", category: "subscriptions" },
  { patterns: ["TWITCH"], name: "Twitch", frequency: "monthly", category: "subscriptions" },
  { patterns: ["SPOTIFY"], name: "Spotify", frequency: "monthly", category: "subscriptions" },
  { patterns: ["TIDAL"], name: "Tidal", frequency: "monthly", category: "subscriptions" },
  { patterns: ["DEEZER"], name: "Deezer", frequency: "monthly", category: "subscriptions" },
  { patterns: ["SOUNDCLOUD"], name: "SoundCloud", frequency: "monthly", category: "subscriptions" },
  { patterns: ["PANDORA"], name: "Pandora", frequency: "monthly", category: "subscriptions" },
  { patterns: ["XBOX GAME PASS", "XBOXGAMEPASS", "XBOX LIVE"], name: "Xbox Game Pass", frequency: "monthly", category: "subscriptions" },
  { patterns: ["PLAYSTATION PLUS", "PSN PLUS", "SONY PLAYSTATION"], name: "PlayStation Plus", frequency: "monthly", category: "subscriptions" },
  { patterns: ["NINTENDO"], name: "Nintendo Switch Online", frequency: "monthly", category: "subscriptions" },
  { patterns: ["DISCORD"], name: "Discord Nitro", frequency: "monthly", category: "subscriptions" },
  { patterns: ["EA PLAY", "EA.COM"], name: "EA Play", frequency: "monthly", category: "subscriptions" },
  { patterns: ["UBISOFT"], name: "Ubisoft+", frequency: "monthly", category: "subscriptions" },
  { patterns: ["ROBLOX"], name: "Roblox Premium", frequency: "monthly", category: "subscriptions" },
  { patterns: ["GOOGLE ONE", "GOOGLEONE"], name: "Google One", frequency: "monthly", category: "subscriptions" },
  { patterns: ["DROPBOX"], name: "Dropbox", frequency: "monthly", category: "subscriptions" },
  { patterns: ["ONEDRIVE"], name: "OneDrive", frequency: "monthly", category: "subscriptions" },
  { patterns: ["BACKBLAZE"], name: "Backblaze", frequency: "monthly", category: "subscriptions" },
  { patterns: ["MICROSOFT 365", "OFFICE 365", "MICROSOFT*365", "MSFT 365"], name: "Microsoft 365", frequency: "monthly", category: "subscriptions" },
  { patterns: ["ADOBE"], name: "Adobe Creative Cloud", frequency: "monthly", category: "subscriptions" },
  { patterns: ["NOTION"], name: "Notion", frequency: "monthly", category: "subscriptions" },
  { patterns: ["FIGMA"], name: "Figma", frequency: "monthly", category: "subscriptions" },
  { patterns: ["GITHUB"], name: "GitHub", frequency: "monthly", category: "subscriptions" },
  { patterns: ["GITLAB"], name: "GitLab", frequency: "monthly", category: "subscriptions" },
  { patterns: ["LINEAR.APP", "LINEAR INC"], name: "Linear", frequency: "monthly", category: "subscriptions" },
  { patterns: ["SLACK"], name: "Slack", frequency: "monthly", category: "subscriptions" },
  { patterns: ["ZOOM.US", "ZOOM COMMUNICATIONS", "ZOOM VIDEO"], name: "Zoom", frequency: "monthly", category: "subscriptions" },
  { patterns: ["CANVA"], name: "Canva Pro", frequency: "monthly", category: "subscriptions" },
  { patterns: ["GRAMMARLY"], name: "Grammarly", frequency: "monthly", category: "subscriptions" },
  { patterns: ["EVERNOTE"], name: "Evernote", frequency: "monthly", category: "subscriptions" },
  { patterns: ["TODOIST"], name: "Todoist", frequency: "monthly", category: "subscriptions" },
  { patterns: ["1PASSWORD"], name: "1Password", frequency: "monthly", category: "subscriptions" },
  { patterns: ["LASTPASS"], name: "LastPass", frequency: "monthly", category: "subscriptions" },
  { patterns: ["NORDVPN", "NORD VPN"], name: "NordVPN", frequency: "monthly", category: "subscriptions" },
  { patterns: ["EXPRESSVPN", "EXPRESS VPN"], name: "ExpressVPN", frequency: "monthly", category: "subscriptions" },
  { patterns: ["CHATGPT", "OPENAI"], name: "ChatGPT Plus", frequency: "monthly", category: "subscriptions" },
  { patterns: ["CLAUDE.AI", "ANTHROPIC"], name: "Claude", frequency: "monthly", category: "subscriptions" },
  { patterns: ["MIDJOURNEY"], name: "Midjourney", frequency: "monthly", category: "subscriptions" },
  { patterns: ["PERPLEXITY"], name: "Perplexity", frequency: "monthly", category: "subscriptions" },
  { patterns: ["GITHUB COPILOT", "COPILOT"], name: "GitHub Copilot", frequency: "monthly", category: "subscriptions" },
  { patterns: ["CURSOR"], name: "Cursor", frequency: "monthly", category: "subscriptions" },
  { patterns: ["AUDIBLE"], name: "Audible", frequency: "monthly", category: "subscriptions" },
  { patterns: ["KINDLE UNLIMITED"], name: "Kindle Unlimited", frequency: "monthly", category: "subscriptions" },
  { patterns: ["DUOLINGO"], name: "Duolingo", frequency: "monthly", category: "subscriptions" },
  { patterns: ["MASTERCLASS"], name: "Masterclass", frequency: "monthly", category: "subscriptions" },
  { patterns: ["SKILLSHARE"], name: "Skillshare", frequency: "monthly", category: "subscriptions" },
  { patterns: ["CODECADEMY"], name: "Codecademy", frequency: "monthly", category: "subscriptions" },
  { patterns: ["LINKEDIN PREMIUM", "LINKEDIN LEARN"], name: "LinkedIn Premium", frequency: "monthly", category: "subscriptions" },
  { patterns: ["CALM.COM", "CALM SUBSCRIPTION"], name: "Calm", frequency: "monthly", category: "personal" },
  { patterns: ["HEADSPACE"], name: "Headspace", frequency: "monthly", category: "personal" },
  { patterns: ["PELOTON"], name: "Peloton", frequency: "monthly", category: "personal" },
  { patterns: ["STRAVA"], name: "Strava", frequency: "monthly", category: "personal" },
  { patterns: ["MYFITNESSPAL"], name: "MyFitnessPal", frequency: "monthly", category: "personal" },
  { patterns: ["NIKE TRAINING", "NIKE RUN"], name: "Nike Training Club", frequency: "monthly", category: "personal" },
  { patterns: ["NEW YORK TIMES", " NYT ", "NYTIMES"], name: "NY Times", frequency: "monthly", category: "subscriptions" },
  { patterns: ["WALL STREET JOURNAL", " WSJ "], name: "WSJ", frequency: "monthly", category: "subscriptions" },
  { patterns: ["WASHINGTON POST"], name: "Washington Post", frequency: "monthly", category: "subscriptions" },
  { patterns: ["THE ECONOMIST"], name: "The Economist", frequency: "monthly", category: "subscriptions" },
  { patterns: ["MEDIUM.COM"], name: "Medium", frequency: "monthly", category: "subscriptions" },
  { patterns: ["SUBSTACK"], name: "Substack", frequency: "monthly", category: "subscriptions" },
  { patterns: ["PATREON"], name: "Patreon", frequency: "monthly", category: "subscriptions" },
  { patterns: ["AMAZON PRIME", "AMZNPRIME", "AMAZON.COM PRIME"], name: "Amazon Prime", frequency: "monthly", category: "subscriptions" },
  { patterns: ["COSTCO"], name: "Costco Membership", frequency: "yearly", category: "subscriptions" },
  { patterns: ["UBER ONE"], name: "Uber One", frequency: "monthly", category: "subscriptions" },
  { patterns: ["DASHPASS", "DOORDASH DASHPASS"], name: "DashPass", frequency: "monthly", category: "subscriptions" },
  { patterns: ["TINDER"], name: "Tinder", frequency: "monthly", category: "subscriptions" },
  { patterns: ["BUMBLE"], name: "Bumble Premium", frequency: "monthly", category: "subscriptions" },
  { patterns: ["HINGE"], name: "Hinge", frequency: "monthly", category: "subscriptions" },
  { patterns: ["HELLOFRESH", "HELLO FRESH"], name: "HelloFresh", frequency: "weekly", category: "food" },
  { patterns: ["GOODLIFE", "GOOD LIFE HEALTH"], name: "Goodlife Health Clubs", frequency: "fortnightly", category: "personal" },
  { patterns: ["ANYTIME FITNESS"], name: "Anytime Fitness", frequency: "fortnightly", category: "personal" },
  { patterns: ["FITNESS FIRST"], name: "Fitness First", frequency: "fortnightly", category: "personal" },
  { patterns: ["F45 TRAINING", " F45 "], name: "F45 Training", frequency: "weekly", category: "personal" },
  { patterns: ["SNAP FITNESS"], name: "Snap Fitness", frequency: "fortnightly", category: "personal" },
  { patterns: ["PLUS FITNESS"], name: "Plus Fitness", frequency: "fortnightly", category: "personal" },
  { patterns: ["JETTS FITNESS", "JETTS 24"], name: "Jetts Fitness", frequency: "fortnightly", category: "personal" },
  { patterns: ["CRUNCH FITNESS"], name: "Crunch Fitness", frequency: "fortnightly", category: "personal" },
  { patterns: ["VIRGIN ACTIVE"], name: "Virgin Active", frequency: "monthly", category: "personal" },
  { patterns: ["GENESIS FITNESS", "GENESIS HEALTH"], name: "Genesis Fitness", frequency: "fortnightly", category: "personal" },
  { patterns: ["12RND", "12 ROUND"], name: "12RND Fitness", frequency: "fortnightly", category: "personal" },
  { patterns: ["BODYFIT"], name: "BodyFit", frequency: "fortnightly", category: "personal" },
  { patterns: ["WORLD GYM"], name: "World Gym", frequency: "fortnightly", category: "personal" },
  { patterns: ["PLUS ONE FITNESS"], name: "Plus One Fitness", frequency: "fortnightly", category: "personal" },
  { patterns: ["PLANET FITNESS"], name: "Planet Fitness", frequency: "monthly", category: "personal" },
  { patterns: ["ORANGETHEORY"], name: "Orangetheory Fitness", frequency: "monthly", category: "personal" },
  { patterns: ["LES MILLS"], name: "Les Mills", frequency: "monthly", category: "personal" },
  { patterns: ["PUREGYM"], name: "PureGym", frequency: "monthly", category: "personal" },
  { patterns: ["EQUINOX"], name: "Equinox", frequency: "monthly", category: "personal" },
  { patterns: ["CLASSPASS"], name: "ClassPass", frequency: "monthly", category: "personal" },
  { patterns: ["TELSTRA"], name: "Telstra", frequency: "monthly", category: "utilities" },
  { patterns: ["OPTUS"], name: "Optus", frequency: "monthly", category: "utilities" },
  { patterns: ["VODAFONE"], name: "Vodafone", frequency: "monthly", category: "utilities" },
  { patterns: ["BELONG"], name: "Belong", frequency: "monthly", category: "utilities" },
  { patterns: ["AMAYSIM"], name: "Amaysim", frequency: "monthly", category: "utilities" },
  { patterns: ["BOOST MOBILE"], name: "Boost Mobile", frequency: "monthly", category: "utilities" },
  { patterns: ["AUSSIE BROADBAND"], name: "Aussie Broadband", frequency: "monthly", category: "utilities" },
  { patterns: ["TPG "], name: "TPG Internet", frequency: "monthly", category: "utilities" },
  { patterns: ["AGL "], name: "AGL", frequency: "quarterly", category: "utilities" },
  { patterns: ["ORIGIN ENERGY"], name: "Origin Energy", frequency: "quarterly", category: "utilities" },
  { patterns: ["ENERGYAUSTRALIA", "ENERGY AUSTRALIA"], name: "EnergyAustralia", frequency: "quarterly", category: "utilities" },
  { patterns: ["RED ENERGY"], name: "Red Energy", frequency: "quarterly", category: "utilities" },
  { patterns: ["ALINTA"], name: "Alinta Energy", frequency: "quarterly", category: "utilities" },
  { patterns: ["SYDNEY WATER"], name: "Sydney Water", frequency: "quarterly", category: "utilities" },
];

function normalizeForMatch(s) {
  return (s || "").toUpperCase().replace(/[^A-Z0-9 &\.]/g, " ").replace(/\s+/g, " ");
}

export function matchKnown(description) {
  const s = normalizeForMatch(description);
  for (const k of KNOWN_SUBSCRIPTIONS) {
    if (k.patterns.some((p) => s.includes(p))) return k;
  }
  return null;
}

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
      source: "pattern",
    });
  }

  // Known-brand pass: matches single-occurrence subs and upgrades detected ones
  const usedKnownNames = new Set();
  for (const t of expenses) {
    const known = matchKnown(t.note);
    if (!known) continue;
    const existing = subs.find((s) =>
      known.patterns.some((p) => s.merchant.includes(p) || p.includes(s.merchant.split(" ")[0])) ||
      s.displayName.toLowerCase() === known.name.toLowerCase()
    );
    if (existing) {
      existing.displayName = known.name;
      existing.category = known.category;
      existing.confidence = "high";
      if (existing.source === "pattern") existing.source = "known+pattern";
      usedKnownNames.add(known.name);
      continue;
    }
    if (usedKnownNames.has(known.name)) continue;
    const matches = expenses.filter((tx) => matchKnown(tx.note)?.name === known.name);
    if (matches.length === 0) continue;
    const sorted = matches.slice().sort((a, b) => a.date.localeCompare(b.date));
    const avgAmt = matches.reduce((s, tx) => s + tx.amount, 0) / matches.length;
    subs.push({
      id: `sub-known-${known.name.replace(/\s+/g, "-")}`,
      merchant: known.name.toUpperCase(),
      displayName: known.name,
      amount: Math.round(avgAmt * 100) / 100,
      frequency: known.frequency,
      occurrences: matches.length,
      lastDate: sorted[sorted.length - 1].date,
      firstDate: sorted[0].date,
      category: known.category,
      confidence: "high",
      source: "known",
    });
    usedKnownNames.add(known.name);
  }

  return subs.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    if (order[a.confidence] !== order[b.confidence]) return order[a.confidence] - order[b.confidence];
    return b.occurrences - a.occurrences || b.amount - a.amount;
  });
}
