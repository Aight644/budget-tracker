import { Logo } from "./Primitives.jsx";
import { FONT } from "../lib/theme.js";

const NAV = [
  { id: "dashboard", label: "Overview", ic: "◉" },
  { id: "items", label: "Budget", ic: "◐" },
  { id: "accounts", label: "Accounts", ic: "▤" },
  { id: "transactions", label: "Transactions", ic: "↕" },
  { id: "subscriptions", label: "Subscriptions", ic: "♫" },
  { id: "goals", label: "Goals", ic: "◆" },
  { id: "coach", label: "Coach", ic: "✦" },
];

const MOBILE_TABS = [
  { id: "dashboard", ic: "◉", label: "Home" },
  { id: "items", ic: "◐", label: "Budget" },
  { id: "transactions", ic: "↕", label: "Txns" },
  { id: "goals", ic: "◆", label: "Goals" },
  { id: "coach", ic: "✦", label: "Coach" },
];

export function Sidebar({ activeTab, setActiveTab, user, onSignOut, onOpenSettings, T, heroValue, heroLabel = "This fortnight", heroSubtext }) {
  return (
    <aside className="app-sidebar" style={{
      background: T.surface, borderRight: `1px solid ${T.line}`,
      padding: "24px 18px", display: "flex", flexDirection: "column",
      position: "sticky", top: 0, height: "100dvh", overflowY: "auto",
    }}>
      <div style={{ padding: "4px 8px 20px" }}>
        <Logo size={24} T={T} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map((n) => {
          const on = activeTab === n.id;
          return (
            <button key={n.id} onClick={() => setActiveTab(n.id)} style={{
              padding: "10px 12px", borderRadius: 10,
              background: on ? T.primarySoft : "transparent",
              color: on ? T.primary : T.muted,
              border: "none", cursor: "pointer", textAlign: "left",
              display: "flex", alignItems: "center", gap: 12,
              fontSize: 14, fontWeight: on ? 600 : 500, fontFamily: FONT.ui,
            }}>
              <span style={{ fontSize: 16, width: 20, textAlign: "center", color: on ? T.primary : T.mutedSoft }}>{n.ic}</span>
              {n.label}
            </button>
          );
        })}
      </div>

      {heroValue && (
        <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: T.primarySofter, border: `1px solid ${T.line}` }}>
          <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: 0.7, fontWeight: 600 }}>{heroLabel}</div>
          <div style={{ fontFamily: FONT.serif, fontSize: 22, color: T.ink, marginTop: 4, letterSpacing: -0.5 }}>{heroValue}</div>
          {heroSubtext && <div style={{ fontSize: 11, color: T.accent, marginTop: 4, fontWeight: 600 }}>{heroSubtext}</div>}
        </div>
      )}

      <div style={{ marginTop: "auto", paddingTop: 16, borderTop: `1px solid ${T.line}`, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: T.accentSoft, color: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.serif, fontSize: 16, fontWeight: 500 }}>
          {((user?.email || "g")[0] || "g").toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email || "Local only"}</div>
          <div style={{ fontSize: 11, color: T.muted }}>{user ? "synced" : "on-device"}</div>
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
      <Logo size={22} T={T} />
      <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, fontFamily: FONT.ui }}>{labels[activeTab] || ""}</div>
      <div style={{ width: 34, height: 34, borderRadius: "50%", background: T.accentSoft, color: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.serif, fontSize: 14, fontWeight: 500 }}>
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
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            fontSize: 10, fontWeight: on ? 700 : 500, letterSpacing: 0.3,
            fontFamily: FONT.ui,
          }}>
            <span style={{ fontSize: 18 }}>{t.ic}</span>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
