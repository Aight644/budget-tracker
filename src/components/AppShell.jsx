import { Logo } from "./Primitives.jsx";
import { FONT } from "../lib/theme.js";

const NAV = [
  { id: "dashboard", label: "Overview", ic: "home" },
  { id: "items", label: "Budget", ic: "pie" },
  { id: "accounts", label: "Accounts", ic: "wallet" },
  { id: "transactions", label: "Transactions", ic: "list" },
  { id: "subscriptions", label: "Subscriptions", ic: "loop" },
  { id: "goals", label: "Goals", ic: "target" },
  { id: "coach", label: "Coach", ic: "spark" },
];

const MOBILE_TABS = [
  { id: "dashboard", ic: "home", label: "Home" },
  { id: "items", ic: "pie", label: "Budget" },
  { id: "transactions", ic: "list", label: "Txns" },
  { id: "goals", ic: "target", label: "Goals" },
  { id: "coach", ic: "spark", label: "Coach" },
];

function NavIcon({ kind, color, size = 17 }) {
  const s = { width: size, height: size, flexShrink: 0 };
  const p = { stroke: color, strokeWidth: 1.6, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  switch (kind) {
    case "home":
      return (<svg style={s} viewBox="0 0 24 24" {...p}><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></svg>);
    case "pie":
      return (<svg style={s} viewBox="0 0 24 24" {...p}><path d="M21 12a9 9 0 1 1-9-9v9z" /><path d="M13 3.1A9 9 0 0 1 20.9 11H13z" /></svg>);
    case "wallet":
      return (<svg style={s} viewBox="0 0 24 24" {...p}><path d="M3 7a2 2 0 0 1 2-2h12v4" /><rect x="3" y="7" width="18" height="13" rx="2" /><circle cx="17" cy="13.5" r="1.3" fill={color} stroke="none" /></svg>);
    case "list":
      return (<svg style={s} viewBox="0 0 24 24" {...p}><path d="M8 6h12" /><path d="M8 12h12" /><path d="M8 18h12" /><circle cx="4" cy="6" r="1.2" fill={color} stroke="none" /><circle cx="4" cy="12" r="1.2" fill={color} stroke="none" /><circle cx="4" cy="18" r="1.2" fill={color} stroke="none" /></svg>);
    case "loop":
      return (<svg style={s} viewBox="0 0 24 24" {...p}><path d="M4 12a8 8 0 0 1 13.7-5.6" /><path d="M20 4v4h-4" /><path d="M20 12a8 8 0 0 1-13.7 5.6" /><path d="M4 20v-4h4" /></svg>);
    case "target":
      return (<svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill={color} stroke="none" /></svg>);
    case "spark":
      return (<svg style={s} viewBox="0 0 24 24" {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></svg>);
    default: return null;
  }
}

export function Sidebar({ activeTab, setActiveTab, user, onSignOut, onOpenSettings, T, heroValue, heroLabel = "This fortnight", heroSubtext }) {
  return (
    <aside className="app-sidebar" style={{
      background: T.surface, borderRight: `1px solid ${T.line}`,
      padding: "28px 20px 22px", display: "flex", flexDirection: "column",
      position: "sticky", top: 0, height: "100dvh", overflowY: "auto",
    }}>
      <div style={{ padding: "0 6px 22px", borderBottom: `1px solid ${T.line}`, marginBottom: 20 }}>
        <Logo size={22} T={T} />
        <div style={{ fontSize: 10.5, color: T.muted, textTransform: "uppercase", letterSpacing: 1.4, fontWeight: 600, marginTop: 12, paddingLeft: 34, fontFamily: FONT.ui }}>
          on-device · v0.4
        </div>
      </div>

      <div style={{ fontSize: 10.5, color: T.muted, textTransform: "uppercase", letterSpacing: 1.4, fontWeight: 700, padding: "0 12px 10px", fontFamily: FONT.ui }}>
        Navigate
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {NAV.map((n) => {
          const on = activeTab === n.id;
          return (
            <button key={n.id} onClick={() => setActiveTab(n.id)} style={{
              position: "relative",
              padding: "10px 12px", borderRadius: 8,
              background: on ? T.primarySoft : "transparent",
              color: on ? T.primary : T.ink,
              border: "none", cursor: "pointer", textAlign: "left",
              display: "flex", alignItems: "center", gap: 11,
              fontSize: 14.5, fontWeight: on ? 600 : 500,
              letterSpacing: -0.15,
              fontFamily: FONT.ui,
            }}>
              {on && (
                <span style={{
                  position: "absolute", left: -20, top: "50%", transform: "translateY(-50%)",
                  width: 3, height: 18, borderRadius: "0 3px 3px 0", background: T.primary,
                }} />
              )}
              <NavIcon kind={n.ic} color={on ? T.primary : T.muted} />
              {n.label}
            </button>
          );
        })}
      </nav>

      {heroValue && (
        <div style={{ marginTop: 22, padding: "14px 16px", borderRadius: 14, background: T.primary, color: "#fff", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -18, right: -18, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
          <div style={{ fontSize: 10.5, opacity: 0.75, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600, fontFamily: FONT.ui }}>{heroLabel}</div>
          <div style={{ fontFamily: FONT.serif, fontSize: 28, marginTop: 2, letterSpacing: -1, fontWeight: 400 }}>{heroValue}</div>
          {heroSubtext && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 11, fontWeight: 500, fontFamily: FONT.ui }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, boxShadow: `0 0 0 3px ${T.accent}33` }} />
              {heroSubtext}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: "auto", paddingTop: 18, borderTop: `1px solid ${T.line}`, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.accentSoft, color: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.serif, fontSize: 16, fontStyle: "italic", fontWeight: 500 }}>
          {((user?.email || "g")[0] || "g").toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: -0.1 }}>{user?.email || "Local only"}</div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{user ? "synced" : "on-device"}</div>
        </div>
        <button onClick={onOpenSettings} title="Settings" style={{
          width: 30, height: 30, borderRadius: 8, background: "transparent",
          border: `1px solid ${T.line}`, color: T.muted, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontFamily: FONT.ui,
        }}>⚙</button>
      </div>
    </aside>
  );
}

export function MobileTopBar({ user, activeTab, T }) {
  const labels = {
    dashboard: "Overview", items: "Budget", accounts: "Accounts",
    transactions: "Transactions", subscriptions: "Subscriptions",
    goals: "Goals", coach: "Coach", settings: "Settings",
  };
  return (
    <div className="app-mobile-top" style={{
      display: "none",
      position: "sticky", top: 0, zIndex: 40,
      background: T.surface, borderBottom: `1px solid ${T.line}`,
      padding: "12px 16px", alignItems: "center", justifyContent: "space-between",
      backdropFilter: "blur(10px)",
    }}>
      <Logo size={20} T={T} />
      <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, fontFamily: FONT.ui }}>{labels[activeTab] || ""}</div>
      <div style={{ width: 34, height: 34, borderRadius: "50%", background: T.accentSoft, color: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.serif, fontSize: 14, fontStyle: "italic", fontWeight: 500 }}>
        {((user?.email || "g")[0] || "g").toUpperCase()}
      </div>
    </div>
  );
}

export function MobileTabBar({ activeTab, setActiveTab, T }) {
  return (
    <div className="app-mobile-tabs" style={{
      display: "none",
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
      background: T.surface, borderTop: `1px solid ${T.line}`,
      padding: "8px 8px calc(8px + env(safe-area-inset-bottom))",
      justifyContent: "space-around",
      boxShadow: "0 -4px 20px rgba(0,0,0,0.05)",
    }}>
      {MOBILE_TABS.map((t) => {
        const on = activeTab === t.id;
        return (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            flex: 1, padding: "8px 4px", background: "transparent", border: "none",
            color: on ? T.primary : T.muted, cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            fontSize: 10, fontWeight: on ? 700 : 500, letterSpacing: 0.3,
            fontFamily: FONT.ui,
          }}>
            <NavIcon kind={t.ic} color={on ? T.primary : T.muted} size={20} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
