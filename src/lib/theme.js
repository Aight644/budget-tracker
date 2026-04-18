export const FONT = {
  ui: "'IBM Plex Sans', system-ui, -apple-system, sans-serif",
  serif: "'IBM Plex Serif', Georgia, serif",
  mono: "'IBM Plex Mono', ui-monospace, monospace",
};

export function makeTheme({ dark = false, accent = "#10b981", primary = "#1e40af" } = {}) {
  if (dark) {
    return {
      dark: true,
      bg: "#0b0f1c",
      bg2: "#0f1428",
      surface: "#121832",
      surfaceAlt: "#161d3a",
      ink: "#f1f5f9",
      inkSoft: "#cbd5e1",
      muted: "#94a3b8",
      mutedSoft: "#64748b",
      line: "#1f2747",
      lineSoft: "#161d3a",
      primary,
      primarySoft: "#1a2347",
      primarySofter: "rgba(30,64,175,0.12)",
      accent,
      accentSoft: "rgba(16,185,129,0.16)",
      accentSofter: "rgba(16,185,129,0.08)",
      danger: "#f87171",
      dangerSoft: "rgba(248,113,113,0.14)",
      warning: "#fbbf24",
      warningSoft: "rgba(251,191,36,0.14)",
      shadow: "0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.02)",
      shadowLg: "0 24px 60px -20px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.02)",
    };
  }
  return {
    dark: false,
    bg: "#fafaf7",
    bg2: "#f3f3ee",
    surface: "#ffffff",
    surfaceAlt: "#f7f7f3",
    ink: "#0f172a",
    inkSoft: "#1e293b",
    muted: "#64748b",
    mutedSoft: "#94a3b8",
    line: "#e5e7eb",
    lineSoft: "#eef0ee",
    primary,
    primarySoft: "#eef2ff",
    primarySofter: "rgba(30,64,175,0.06)",
    accent,
    accentSoft: "rgba(16,185,129,0.14)",
    accentSofter: "rgba(16,185,129,0.06)",
    danger: "#dc2626",
    dangerSoft: "#fef2f2",
    warning: "#d97706",
    warningSoft: "#fef3c7",
    shadow: "0 1px 2px rgba(15,23,42,0.04), 0 0 0 1px rgba(15,23,42,0.03)",
    shadowLg: "0 24px 60px -20px rgba(15,23,42,0.25), 0 0 0 1px rgba(15,23,42,0.03)",
  };
}

export function cardStyle(T) {
  return {
    background: T.surface,
    border: `1px solid ${T.line}`,
    borderRadius: 16,
    padding: 20,
    boxShadow: T.shadow,
  };
}

export function primaryBtn(T) {
  return {
    background: T.primary, color: "#fff", border: "none",
    padding: "10px 16px", borderRadius: 10,
    fontSize: 13, fontWeight: 600, cursor: "pointer",
    fontFamily: FONT.ui,
  };
}

export function ghostBtn(T) {
  return {
    background: "transparent", border: `1px solid ${T.line}`, color: T.muted,
    padding: "6px 14px", borderRadius: 8,
    fontSize: 12, fontWeight: 500, cursor: "pointer",
    fontFamily: FONT.ui,
  };
}

export function iconBtn(T) {
  return {
    width: 32, height: 32, borderRadius: 8,
    background: "transparent", border: `1px solid ${T.line}`,
    color: T.muted, cursor: "pointer",
    fontFamily: FONT.ui,
  };
}

export function fmtShort(n, currencyFmt) {
  const abs = Math.abs(n);
  if (abs >= 1000) return (n < 0 ? "−" : "") + "$" + (abs / 1000).toFixed(abs >= 10000 ? 0 : 1) + "k";
  return currencyFmt ? currencyFmt(n) : "$" + abs.toFixed(0);
}
