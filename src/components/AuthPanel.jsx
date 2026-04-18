import { useState } from "react";
import { signUp, signIn } from "../lib/sync.js";

const C = {
  primary: "#1e40af",
  primarySoft: "#eef2ff",
  accent: "#10b981",
  accentSoft: "rgba(16,185,129,0.14)",
  line: "#e5e7eb",
  ink: "#0f172a",
  muted: "#64748b",
  bg: "#fafaf7",
  surface: "#ffffff",
  danger: "#dc2626",
  dangerBg: "#fef2f2",
  dangerBorder: "#fecaca",
};

const FONT = { ui: "'IBM Plex Sans', system-ui, sans-serif", serif: "'IBM Plex Serif', Georgia, serif" };

export default function AuthPanel({ onSuccess, compact = false }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const submit = async (e) => {
    e?.preventDefault?.();
    setError(""); setInfo("");
    if (!email.trim() || password.length < 6) {
      setError("Email required and password must be 6+ characters");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        await signUp(email.trim(), password);
        setInfo("Check your email for a confirmation link, then sign in.");
        setMode("signin");
      } else {
        const { user } = await signIn(email.trim(), password);
        if (user) onSuccess?.(user);
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: FONT.ui }}>
      <div style={{ display: "flex", gap: 4, background: C.bg, borderRadius: 10, padding: 3, marginBottom: 14 }}>
        {["signin", "signup"].map((m) => (
          <button key={m} onClick={() => { setMode(m); setError(""); setInfo(""); }} style={{
            flex: 1, padding: "8px", border: "none", borderRadius: 8,
            fontSize: 13, fontWeight: 600,
            background: mode === m ? C.surface : "transparent",
            color: mode === m ? C.ink : C.muted,
            cursor: "pointer", fontFamily: FONT.ui,
            boxShadow: mode === m ? "0 1px 3px rgba(15,23,42,0.08)" : "none",
          }}>{m === "signin" ? "Sign in" : "Create account"}</button>
        ))}
      </div>

      <form onSubmit={submit}>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "block", fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" style={{
            width: "100%", padding: "12px 14px", fontSize: 14,
            border: `1px solid ${C.line}`, borderRadius: 10,
            background: C.surface, color: C.ink, fontFamily: FONT.ui,
            outline: "none", boxSizing: "border-box",
          }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6+ characters" autoComplete={mode === "signup" ? "new-password" : "current-password"} style={{
            width: "100%", padding: "12px 14px", fontSize: 14,
            border: `1px solid ${C.line}`, borderRadius: 10,
            background: C.surface, color: C.ink, fontFamily: FONT.ui,
            outline: "none", boxSizing: "border-box",
          }} />
        </div>

        {error && <p style={{ margin: "0 0 10px", padding: "8px 10px", background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, borderRadius: 8, fontSize: 12, color: C.danger }}>{error}</p>}
        {info && <p style={{ margin: "0 0 10px", padding: "8px 10px", background: C.accentSoft, border: `1px solid ${C.accent}`, borderRadius: 8, fontSize: 12, color: C.accent }}>{info}</p>}

        <button type="submit" disabled={loading} style={{
          width: "100%", padding: "12px", background: C.primary, color: "#fff",
          border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600,
          cursor: loading ? "default" : "pointer", fontFamily: FONT.ui,
          opacity: loading ? 0.6 : 1,
        }}>
          {loading ? "…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>

      {!compact && (
        <p style={{ marginTop: 14, fontSize: 11, color: C.muted, lineHeight: 1.5, textAlign: "center" }}>
          Signing in enables cross-device sync. Your data is stored under your user ID.
          You can use the app without signing in — data just stays on this device.
        </p>
      )}
    </div>
  );
}
