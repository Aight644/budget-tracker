import { FONT, cardStyle, ghostBtn, fmtShort } from "../lib/theme.js";
import { Glyph, Donut, ProgressBar, SectionHeader } from "./Primitives.jsx";
import { CATEGORIES, FREQUENCIES } from "../lib/constants.js";
import { toFn, toMo, toYr } from "../lib/calc.js";

const VIEWS = {
  fortnightly: { convert: toFn, days: 14, label: "fortnight", short: "fn" },
  monthly: { convert: toMo, days: 30, label: "month", short: "mo" },
  yearly: { convert: toYr, days: 365, label: "year", short: "yr" },
};

function MiniInline({ label, value, T, onDark }) {
  return (
    <div>
      <div style={{ fontSize: 10, opacity: onDark ? 0.7 : 0.8, color: onDark ? "#fff" : T.muted, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: FONT.serif, fontSize: 20, letterSpacing: -0.4, marginTop: 2, color: onDark ? "#fff" : T.ink }}>{value}</div>
    </div>
  );
}

function TabPill({ children, active, onClick, T }) {
  return (
    <button onClick={onClick} style={{
      background: active ? T.primary : "transparent",
      color: active ? "#fff" : T.muted,
      border: active ? "none" : `1px solid ${T.line}`,
      padding: "6px 14px", borderRadius: 8,
      fontSize: 12, fontWeight: 600, fontFamily: FONT.ui,
      cursor: "pointer",
    }}>{children}</button>
  );
}

function InsightCard({ kind, title, body, action, onAction, T }) {
  const map = {
    warning: { bg: T.warningSoft, fg: T.warning, ic: "!" },
    info: { bg: T.primarySoft, fg: T.primary, ic: "ℹ" },
    good: { bg: T.accentSoft, fg: T.accent, ic: "✓" },
  };
  const m = map[kind] || map.info;
  return (
    <div style={{ ...cardStyle(T), display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Glyph ch={m.ic} size={26} bg={m.bg} fg={m.fg} radius={8} />
        <div style={{ fontSize: 11, color: m.fg, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>{kind === "warning" ? "Watch" : kind === "info" ? "Note" : "Great"}</div>
      </div>
      <div style={{ fontFamily: FONT.serif, fontSize: 18, letterSpacing: -0.3, lineHeight: 1.25, color: T.ink, fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.55 }}>{body}</div>
      {action && onAction && (
        <button onClick={onAction} style={{
          marginTop: "auto", alignSelf: "flex-start", background: "transparent",
          color: T.primary, border: "none", padding: "4px 0", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT.ui,
        }}>{action} →</button>
      )}
    </div>
  );
}

function CashflowChart({ income, expense, labels, T }) {
  const width = 560, height = 160;
  const barW = (width - 20) / Math.max(income.length, 1);
  const max = Math.max(...income, ...expense, 50);
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: "block" }}>
        <line x1="0" x2={width} y1={height - 20} y2={height - 20} stroke={T.line} />
        {income.map((v, i) => {
          const h = (v / max) * (height - 40);
          return v > 0 ? (
            <rect key={"i" + i} x={i * barW + 10} y={height - 20 - h} width={barW * 0.42} height={h} rx={2} fill={T.accent} />
          ) : null;
        })}
        {expense.map((v, i) => {
          const h = (v / max) * (height - 40);
          return v > 0 ? (
            <rect key={"e" + i} x={i * barW + 10 + barW * 0.46} y={height - 20 - h} width={barW * 0.42} height={h} rx={2} fill={T.primary} opacity={0.55} />
          ) : null;
        })}
        {labels.map((l, i) => (i % 3 === 0) && (
          <text key={i} x={i * barW + 10 + barW * 0.4} y={height - 6} fontSize="9" fill={T.muted} fontFamily="IBM Plex Mono">{l}</text>
        ))}
      </svg>
    </div>
  );
}

export default function DashboardView({ T, fmt, state, actions, user, view = "fortnightly", setView }) {
  const { items, accounts, transactions, goals, categoryBudgets } = state;
  const V = VIEWS[view] || VIEWS.fortnightly;
  const incomeItems = items.filter((i) => i.isIncome && !i.cancelled);
  const expenseItems = items.filter((i) => !i.isIncome && !i.cancelled);
  const incomePer = incomeItems.reduce((s, i) => s + V.convert(i.amount, i.frequency), 0);
  const expensePer = expenseItems.reduce((s, i) => s + V.convert(i.amount, i.frequency), 0);
  const leftover = incomePer - expensePer;

  const liquidTypes = ["checking", "savings", "cash"];
  const liquid = accounts.filter((a) => liquidTypes.includes(a.type) && a.includeInNetWorth !== false).reduce((s, a) => s + (a.balance || 0), 0);
  const monthlyExp = expenseItems.reduce((s, i) => s + toMo(i.amount, i.frequency), 0);
  const emergencyMo = monthlyExp > 0 ? liquid / monthlyExp : 0;
  const savingsRate = incomePer > 0 ? leftover / incomePer : 0;
  const healthScore = Math.round(Math.max(0, Math.min(100, savingsRate * 300 + Math.min(emergencyMo / 6, 1) * 40 + 10)));

  const catTotals = CATEGORIES.filter((c) => c.id !== "income").map((c) => {
    const v = expenseItems.filter((i) => i.category === c.id).reduce((s, i) => s + V.convert(i.amount, i.frequency), 0);
    return { id: c.id, label: c.label, value: Math.round(v), color: c.color, icon: c.icon };
  }).filter((c) => c.value > 0).sort((a, b) => b.value - a.value);
  const totalSpend = catTotals.reduce((s, x) => s + x.value, 0);

  // Build 14-day cashflow from actual transactions
  const now = new Date();
  const cashflowDays = Array.from({ length: 14 }, (_, k) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (13 - k));
    const iso = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const dayTxns = transactions.filter((t) => t.date === iso && !t.isTransfer);
    const inc = dayTxns.filter((t) => t.isIncome).reduce((s, t) => s + (t.amount || 0), 0);
    const out = dayTxns.filter((t) => !t.isIncome).reduce((s, t) => s + (t.amount || 0), 0);
    return { d: label, inc, out, iso };
  });
  const totalIn = cashflowDays.reduce((s, d) => s + d.inc, 0);
  const totalOut = cashflowDays.reduce((s, d) => s + d.out, 0);

  // Upcoming bills from items with dueDate
  const upcoming = expenseItems
    .filter((i) => i.dueDate)
    .map((i) => ({ ...i, daysUntil: Math.round((new Date(i.dueDate) - now) / 86400000) }))
    .filter((i) => i.daysUntil >= 0 && i.daysUntil <= 14)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5);

  // Recent transactions
  const recent = transactions.slice().sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 6);

  // Insights derivation
  const insights = [];
  const subsTotal = expenseItems.filter((i) => i.category === "subscriptions").reduce((s, i) => s + toMo(i.amount, i.frequency), 0);
  const monthlyIncome = incomeItems.reduce((s, i) => s + toMo(i.amount, i.frequency), 0);
  if (subsTotal > monthlyIncome * 0.05 && monthlyIncome > 0) {
    insights.push({ id: "subs", kind: "warning", title: "Subscriptions creep", body: `You're spending ${fmt(subsTotal)}/mo on subscriptions (${((subsTotal / monthlyIncome) * 100).toFixed(0)}% of income). Review for overlaps.`, action: "Review subs", tab: "subscriptions" });
  }
  if (emergencyMo < 3 && accounts.length > 0) {
    insights.push({ id: "ef", kind: "info", title: "Emergency fund below target", body: `${emergencyMo.toFixed(1)} months covered — target is 3–6 months (${fmt(monthlyExp * 3)}+).`, action: "See goals", tab: "goals" });
  }
  if (leftover > 0 && savingsRate > 0.2) {
    insights.push({ id: "save", kind: "good", title: "Strong savings rate", body: `You're saving ${(savingsRate * 100).toFixed(0)}% of income this period — wealth-building territory.`, action: "Adjust goal", tab: "goals" });
  }
  while (insights.length < 3) insights.push({ id: "_" + insights.length, kind: "info", title: "Add more data", body: "The more transactions and budget items you track, the sharper these insights get.", action: null });

  const greeting = (() => {
    const h = now.getHours();
    if (h < 12) return "Morning";
    if (h < 18) return "Afternoon";
    return "Evening";
  })();
  const name = (user?.email || "").split("@")[0].split(/[._]/)[0];
  const nameCap = name ? name[0].toUpperCase() + name.slice(1) : "there";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="view-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
        <div>
          <div style={{ fontSize: 12, color: T.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
            {now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <h1 style={{ fontFamily: FONT.serif, fontSize: 34, letterSpacing: -1, marginTop: 4, marginBottom: 0, fontWeight: 400 }}>{greeting}, {nameCap}.</h1>
        </div>
        <div className="dash-date-tabs" style={{ display: "flex", gap: 8 }}>
          {["fortnightly", "monthly", "yearly"].map((v) => (
            <TabPill key={v} active={view === v} onClick={() => setView && setView(v)} T={T}>
              {v[0].toUpperCase() + v.slice(1)}
            </TabPill>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 14 }} className="dash-hero-grid">
        <div style={{ background: T.primary, color: "#fff", borderRadius: 20, padding: 28, position: "relative", overflow: "hidden", minHeight: 220 }}>
          <div style={{ position: "absolute", top: -80, right: -60, width: 280, height: 280, borderRadius: "50%", background: `radial-gradient(circle at 30% 30%, ${T.accent}aa, transparent 65%)`, opacity: 0.9 }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 11, opacity: 0.8, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600 }}>Leftover · {V.label}</div>
              {leftover >= 0 && <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 99, background: "rgba(16,185,129,0.35)", color: "#d1fae5", fontWeight: 600 }}>on track</span>}
              {leftover < 0 && <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 99, background: "rgba(248,113,113,0.3)", color: "#fecaca", fontWeight: 600 }}>over</span>}
            </div>
            <div className="hero-leftover" style={{ fontFamily: FONT.serif, fontSize: 72, letterSpacing: -3, lineHeight: 1, marginTop: 10, fontWeight: 400 }}>
              {fmt(leftover)}
            </div>
            <div style={{ fontSize: 13, opacity: 0.76, marginTop: 8 }}>
              {leftover > 0 ? <>Safe to spend <b style={{ color: T.accent }}>{fmt(leftover / V.days)}/day</b> for next {V.days} days</> : <>Trim expenses or increase income to rebalance.</>}
            </div>
            <div style={{ marginTop: 20, display: "flex", gap: 24, flexWrap: "wrap" }}>
              <MiniInline label="Income" value={fmt(incomePer)} T={T} onDark />
              <MiniInline label="Expenses" value={fmt(expensePer)} T={T} onDark />
              <MiniInline label="Saved" value={fmt(Math.max(0, leftover))} T={T} onDark />
            </div>
          </div>
        </div>

        <div style={cardStyle(T)}>
          <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Health score</div>
          <div style={{ fontFamily: FONT.serif, fontSize: 44, letterSpacing: -1.4, lineHeight: 1, marginTop: 8 }}>{healthScore}<span style={{ color: T.muted, fontSize: 22 }}>/100</span></div>
          <div style={{ fontSize: 12, color: T.muted, fontWeight: 500, marginTop: 4 }}>savings + emergency</div>
          <div style={{ marginTop: 16 }}>
            <ProgressBar value={healthScore} color={T.accent} bg={T.surfaceAlt} height={6} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 8, fontWeight: 600 }}>
            <span>At risk</span><span>Thriving</span>
          </div>
        </div>

        <div style={cardStyle(T)}>
          <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Emergency fund</div>
          <div style={{ fontFamily: FONT.serif, fontSize: 28, letterSpacing: -0.6, lineHeight: 1.1, marginTop: 8 }}>{emergencyMo.toFixed(1)}<span style={{ color: T.muted, fontSize: 16 }}> mo</span></div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>target 6mo</div>
          <div style={{ marginTop: 16 }}>
            <ProgressBar value={(emergencyMo / 6) * 100} color={T.primary} bg={T.surfaceAlt} height={6} />
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 8 }}>{fmt(liquid)} of {fmt(monthlyExp * 6)}</div>
        </div>
      </div>

      <div className="dash-insights" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {insights.slice(0, 3).map((i) => (
          <InsightCard key={i.id} kind={i.kind} title={i.title} body={i.body} action={i.action} onAction={i.tab ? () => actions.setActiveTab(i.tab) : null} T={T} />
        ))}
      </div>

      <div className="dash-charts" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
        <div style={cardStyle(T)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Cashflow · last 14 days</div>
              <div style={{ fontFamily: FONT.serif, fontSize: 22, marginTop: 4, letterSpacing: -0.4 }}>{fmt(totalIn)} in · {fmt(totalOut)} out</div>
            </div>
            <div style={{ display: "flex", gap: 10, fontSize: 11, color: T.muted }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: T.accent }} />Income</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: T.primary, opacity: 0.5 }} />Spending</span>
            </div>
          </div>
          <CashflowChart income={cashflowDays.map((d) => d.inc)} expense={cashflowDays.map((d) => d.out)} labels={cashflowDays.map((d) => d.d.split(" ")[1])} T={T} />
        </div>

        <div style={cardStyle(T)}>
          <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 16 }}>Spending · by category</div>
          {catTotals.length === 0 ? (
            <div style={{ color: T.muted, fontSize: 13, padding: "20px 0" }}>Add recurring expenses to see breakdown.</div>
          ) : (
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <Donut size={140} thickness={16}
                segments={catTotals.map((c) => ({ value: c.value, color: c.color }))}
                center={<>
                  <div style={{ fontFamily: FONT.serif, fontSize: 22, letterSpacing: -0.5 }}>{fmtShort(totalSpend)}</div>
                  <div style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: 0.7, fontWeight: 600 }}>planned</div>
                </>} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                {catTotals.slice(0, 5).map((c) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
                    <span style={{ flex: 1, color: T.inkSoft }}>{c.label}</span>
                    <span style={{ fontFamily: FONT.serif, color: T.ink }}>{fmtShort(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="dash-bottom" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={cardStyle(T)}>
          <SectionHeader T={T} title="Upcoming bills" hint="Next 14 days" onMore={() => actions.setActiveTab("items")} />
          {upcoming.length === 0 ? (
            <div style={{ color: T.muted, fontSize: 13, padding: "8px 0" }}>No bills with due dates scheduled.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {upcoming.map((b, i) => {
                const c = CATEGORIES.find((x) => x.id === b.category) || CATEGORIES[0];
                const dateStr = b.daysUntil === 0 ? "Today" : b.daysUntil === 1 ? "Tomorrow" : new Date(b.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" });
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 4px", borderBottom: i < upcoming.length - 1 ? `1px solid ${T.line}` : "none" }}>
                    <div style={{ minWidth: 52, fontSize: 11, color: T.muted, fontFamily: FONT.mono, textTransform: "uppercase", letterSpacing: 0.5 }}>{dateStr}</div>
                    <Glyph ch={c.icon} size={30} bg={T.surfaceAlt} fg={c.color} radius={8} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: T.ink, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{b.frequency}</div>
                    </div>
                    <div style={{ fontFamily: FONT.serif, fontSize: 15, color: T.ink, letterSpacing: -0.3 }}>{fmt(b.amount)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={cardStyle(T)}>
          <SectionHeader T={T} title="Recent activity" hint="Last 6" onMore={() => actions.setActiveTab("transactions")} />
          {recent.length === 0 ? (
            <div style={{ color: T.muted, fontSize: 13, padding: "8px 0" }}>Log transactions or import a CSV to see activity here.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {recent.map((t, i) => {
                const c = CATEGORIES.find((x) => x.id === t.category) || CATEGORIES[0];
                return (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 4px", borderBottom: i < recent.length - 1 ? `1px solid ${T.line}` : "none" }}>
                    <Glyph ch={c.icon} size={30} bg={T.surfaceAlt} fg={c.color} radius={8} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: T.ink, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.note || c.label}</div>
                      <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{t.date} · {c.label}</div>
                    </div>
                    <div style={{ fontFamily: FONT.serif, fontSize: 15, color: t.isIncome ? T.accent : T.ink, letterSpacing: -0.3 }}>{t.isIncome ? "+" : "-"}{fmt(t.amount)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
