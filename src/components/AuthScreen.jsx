import { useState } from "react";
import { signUp, signIn } from "../lib/sync.js";

const C = {
  bg: "#fafaf7",
  surface: "#ffffff",
  ink: "#0f172a",
  muted: "#64748b",
  line: "#e5e7eb",
  primary: "#1e40af",
  primarySoft: "#eef2ff",
  accent: "#10b981",
  accentSoft: "rgba(16,185,129,0.14)",
  danger: "#dc2626",
  dangerBg: "#fef2f2",
  dangerBorder: "#fecaca",
};

const FONT = { ui: "'IBM Plex Sans', system-ui, sans-serif", serif: "'IBM Plex Serif', Georgia, serif" };

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width="28" height="28" viewBox="0 0 28 28">
        <rect x="1" y="1" width="26" height="26" rx="8" fill={C.primary} />
        <path d="M8 20V8h3.2c3.6 0 5.4 2 5.4 5.9 0 3.9-1.8 6.1-5.4 6.1H8z" fill={C.accent} />
        <circle cx="20" cy="9" r="2" fill={C.accent} />
      </svg>
      <span style={{ fontFamily: FONT.serif, fontSize: 24, color: C.ink, letterSpacing: -0.3, fontWeight: 500 }}>budget</span>
    </div>
  );
}

export default function AuthScreen({ initialMode = "signup", onSuccess, onBack }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const submit = async (e) => {
    e?.preventDefault?.();
    setError(""); setInfo("");
    if (!email.trim() || password.length < 6) {
      setError("Enter a valid email and a password of 6+ characters.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { user, session } = await signUp(email.trim(), password);
        if (session?.user) {
          onSuccess?.(session.user, { isNew: true });
        } else if (user && !session) {
          setInfo("Account created. Check your email to confirm, then sign in.");
          setMode("signin");
        } else {
          onSuccess?.(user, { isNew: true });
        }
      } else {
        const { user } = await signIn(email.trim(), password);
        if (user) onSuccess?.(user, { isNew: false });
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const isSignUp = mode === "signup";

  return (
    <div style={{ minHeight: "100dvh", background: C.bg, color: C.ink, fontFamily: FONT.ui }}>
      <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.line}`, background: "rgba(250,250,247,0.88)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", padding: "6px 10px", color: C.muted, fontFamily: FONT.ui, fontSize: 14, cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="8" height="12" viewBox="0 0 8 12" fill="none"><path d="M6 2L2 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Back
        </button>
        <Logo />
        <div style={{ width: 60 }} />
      </div>

      <div style={{ maxWidth: 440, margin: "0 auto", padding: "64px 24px 40px" }}>
        <h1 style={{ fontFamily: FONT.serif, fontSize: 40, lineHeight: 1.05, margin: "0 0 10px", letterSpacing: -1.2, fontWeight: 400, textAlign: "center" }}>
          {isSignUp ? "Create your account" : "Sign in"}
        </h1>
        <p style={{ fontSize: 15, color: C.muted, margin: "0 0 36px", textAlign: "center", lineHeight: 1.55 }}>
          {isSignUp ? "Syncs your budget across every device you use." : "Welcome back — your budget is waiting."}
        </p>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" autoFocus style={{
              width: "100%", height: 52, padding: "0 16px", fontSize: 15,
              border: `1.5px solid ${email ? C.primary : C.line}`,
              borderRadius: 12, background: C.surface, color: C.ink,
              fontFamily: FONT.ui, outline: "none", boxSizing: "border-box",
              boxShadow: email ? `0 0 0 4px rgba(30,64,175,0.08)` : "none",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={isSignUp ? "new-password" : "current-password"} placeholder={isSignUp ? "6+ characters" : "your password"} style={{
              width: "100%", height: 52, padding: "0 16px", fontSize: 15,
              border: `1.5px solid ${password ? C.primary : C.line}`,
              borderRadius: 12, background: C.surface, color: C.ink,
              fontFamily: FONT.ui, outline: "none", boxSizing: "border-box",
              boxShadow: password ? `0 0 0 4px rgba(30,64,175,0.08)` : "none",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }} />
          </div>

          {error && <p style={{ margin: 0, padding: "10px 12px", background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, borderRadius: 10, fontSize: 13, color: C.danger }}>{error}</p>}
          {info && <p style={{ margin: 0, padding: "10px 12px", background: C.accentSoft, border: `1px solid ${C.accent}`, borderRadius: 10, fontSize: 13, color: C.accent }}>{info}</p>}

          <button type="submit" disabled={loading} style={{
            height: 52, background: C.primary, color: "#fff",
            border: "none", borderRadius: 12, fontSize: 16, fontWeight: 600,
            cursor: loading ? "default" : "pointer", fontFamily: FONT.ui,
            opacity: loading ? 0.6 : 1, marginTop: 8,
          }}>
            {loading ? "…" : isSignUp ? "Create account" : "Sign in"}
          </button>

          {isSignUp && (
            <p style={{ fontSize: 11, color: C.muted, textAlign: "center", margin: "4px 0 0", lineHeight: 1.5 }}>
              By creating an account you agree to our{" "}
              <a href="#" style={{ color: C.primary, textDecoration: "underline" }}>Terms</a> and{" "}
              <a href="#" style={{ color: C.primary, textDecoration: "underline" }}>Privacy Policy</a>.
            </p>
          )}
        </form>

        <div style={{ textAlign: "center", marginTop: 28, fontSize: 14, color: C.muted }}>
          {isSignUp ? (
            <>Already have an account? <button onClick={() => { setMode("signin"); setError(""); setInfo(""); }} style={{ background: "transparent", border: "none", color: C.primary, fontWeight: 600, cursor: "pointer", fontFamily: FONT.ui, fontSize: 14 }}>Sign in</button></>
          ) : (
            <>New here? <button onClick={() => { setMode("signup"); setError(""); setInfo(""); }} style={{ background: "transparent", border: "none", color: C.primary, fontWeight: 600, cursor: "pointer", fontFamily: FONT.ui, fontSize: 14 }}>Create an account</button></>
          )}
        </div>
      </div>
    </div>
  );
}
