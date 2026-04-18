import AuthPanel from "./AuthPanel.jsx";

const C = {
  bg: "#fafaf7",
  surface: "#ffffff",
  ink: "#0f172a",
  muted: "#64748b",
  line: "#e5e7eb",
  primary: "#1e40af",
  accent: "#10b981",
};

const FONT = { ui: "'IBM Plex Sans', system-ui, sans-serif", serif: "'IBM Plex Serif', Georgia, serif" };

export default function SignInScreen({ onSuccess, onSkip }) {
  return (
    <div style={{
      minHeight: "100dvh", background: C.bg, color: C.ink,
      fontFamily: FONT.ui, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28, justifyContent: "center" }}>
          <svg width="30" height="30" viewBox="0 0 28 28">
            <rect x="1" y="1" width="26" height="26" rx="8" fill={C.primary} />
            <path d="M8 20V8h3.2c3.6 0 5.4 2 5.4 5.9 0 3.9-1.8 6.1-5.4 6.1H8z" fill={C.accent} />
            <circle cx="20" cy="9" r="2" fill={C.accent} />
          </svg>
          <span style={{ fontFamily: FONT.serif, fontSize: 26, color: C.ink, letterSpacing: -0.3, fontWeight: 500 }}>budget</span>
        </div>
        <h1 style={{ fontFamily: FONT.serif, fontSize: 32, margin: "0 0 8px", letterSpacing: -0.8, fontWeight: 400, textAlign: "center" }}>
          Welcome back.
        </h1>
        <p style={{ fontSize: 14, color: C.muted, margin: "0 0 28px", textAlign: "center", lineHeight: 1.5 }}>
          Sign in to sync your data across devices.
        </p>
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20 }}>
          <AuthPanel compact onSuccess={onSuccess} />
        </div>
        {onSkip && (
          <div style={{ textAlign: "center", marginTop: 18 }}>
            <button onClick={onSkip} style={{
              background: "transparent", border: "none",
              color: C.muted, fontFamily: FONT.ui, fontSize: 13,
              cursor: "pointer", textDecoration: "underline",
            }}>Continue without signing in</button>
          </div>
        )}
      </div>
    </div>
  );
}
