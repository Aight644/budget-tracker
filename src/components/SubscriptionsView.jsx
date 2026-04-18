import { FONT, cardStyle, primaryBtn, ghostBtn, iconBtn } from "../lib/theme.js";
import { ViewHeader, SummaryCard, Chip, Glyph, SectionHeader } from "./Primitives.jsx";
import { toMo, toYr } from "../lib/calc.js";

export default function SubscriptionsView({ T, fmt, items, transactions, onDetect, onAddItem, onEditItem, onDeleteItem, onToggleCancel }) {
  const subs = items.filter((i) => !i.isIncome && i.category === "subscriptions" && !i.cancelled);
  const cancelled = items.filter((i) => !i.isIncome && i.category === "subscriptions" && i.cancelled);
  const monthly = subs.reduce((s, x) => s + toMo(x.amount, x.frequency), 0);
  const yearly = monthly * 12;

  // Cheap overlap guess: any two subs with "stream" keywords
  const streamWords = ["netflix", "disney", "stan", "binge", "kayo", "paramount", "hulu", "hbo", "prime"];
  const streams = subs.filter((s) => streamWords.some((w) => (s.name || "").toLowerCase().includes(w)));
  const overlapTotal = streams.length >= 2 ? streams.reduce((t, x) => t + toMo(x.amount, x.frequency), 0) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <ViewHeader T={T} eyebrow="Insights" title="Subscriptions" sub={`${subs.length} active · ${fmt(monthly)}/mo`} action={
        <div style={{ display: "flex", gap: 8 }}>
          {onDetect && <button onClick={onDetect} style={ghostBtn(T)}>Scan again</button>}
          {onAddItem && <button onClick={onAddItem} style={primaryBtn(T)}>+ Add</button>}
        </div>
      } />

      <div className="subs-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <SummaryCard T={T} label="Monthly" value={fmt(monthly)} hint="est. all subs" tone="primary" />
        <SummaryCard T={T} label="Yearly" value={fmt(yearly)} hint="true cost" />
        <SummaryCard T={T} label="Overlap" value={overlapTotal > 0 ? fmt(overlapTotal) : fmt(0)} hint={streams.length >= 2 ? `${streams.length} streaming services` : "no overlaps spotted"} tone={overlapTotal > 0 ? "warning" : undefined} />
      </div>

      <div style={cardStyle(T)}>
        {streams.length >= 2 && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: 14, borderRadius: 12, background: T.warningSoft, border: `1px solid ${T.dark ? "transparent" : "#fde68a"}`, marginBottom: 16 }}>
            <Glyph ch="!" size={32} bg="rgba(217,119,6,0.22)" fg={T.warning} radius={9} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>You may be paying for overlapping streaming services</div>
              <div style={{ fontSize: 13, color: T.muted, marginTop: 4, lineHeight: 1.5 }}>
                {streams.map((s) => s.name).join(" + ")} cost <b style={{ color: T.warning }}>{fmt(overlapTotal)}/mo</b> combined. Review whether you actively use both.
              </div>
            </div>
          </div>
        )}

        {subs.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: T.muted, fontSize: 14 }}>
            No subscriptions yet. Add recurring items categorised as "Subscriptions", or import a CSV and detect them automatically.
          </div>
        ) : subs.map((s, i) => {
          const m = toMo(s.amount, s.frequency);
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 4px", borderBottom: i < subs.length - 1 ? `1px solid ${T.lineSoft}` : "none" }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: T.accentSoft, color: T.accent,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: FONT.serif, fontSize: 20, fontWeight: 600,
              }}>{(s.name || "?")[0].toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: T.ink }}>{s.name}</div>
                  {streams.includes(s) && streams.length >= 2 && <Chip tone="warning" T={T}>overlap</Chip>}
                </div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{s.frequency}{s.dueDate ? ` · next ${s.dueDate}` : ""}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: FONT.serif, fontSize: 18, letterSpacing: -0.3 }}>{fmt(s.amount)}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{fmt(m)}/mo equiv</div>
              </div>
              {onToggleCancel && (
                <button onClick={() => onToggleCancel(s.id, true)} title="Cancel subscription" style={iconBtn(T)}>×</button>
              )}
            </div>
          );
        })}

        {cancelled.length > 0 && (
          <>
            <div style={{ height: 1, background: T.line, margin: "16px 0" }} />
            <SectionHeader T={T} title={`Cancelled (${cancelled.length})`} hint={`saving ${fmt(cancelled.reduce((s, x) => s + toMo(x.amount, x.frequency), 0))}/mo`} />
            {cancelled.map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 4px", opacity: 0.6 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: T.surfaceAlt, color: T.muted, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.serif, fontSize: 20, fontWeight: 600 }}>{(s.name || "?")[0].toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: T.ink, textDecoration: "line-through" }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>cancelled {s.cancelledAt || ""}</div>
                </div>
                {onToggleCancel && <button onClick={() => onToggleCancel(s.id, false)} style={ghostBtn(T)}>Reactivate</button>}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
