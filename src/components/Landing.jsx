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
};

const FONT = { ui: "'IBM Plex Sans', system-ui, sans-serif", serif: "'IBM Plex Serif', Georgia, serif" };

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width="26" height="26" viewBox="0 0 28 28">
        <rect x="1" y="1" width="26" height="26" rx="8" fill={C.primary} />
        <path d="M8 20V8h3.2c3.6 0 5.4 2 5.4 5.9 0 3.9-1.8 6.1-5.4 6.1H8z" fill={C.accent} />
        <circle cx="20" cy="9" r="2" fill={C.accent} />
      </svg>
      <span style={{ fontFamily: FONT.serif, fontSize: 22, color: C.ink, letterSpacing: -0.3, fontWeight: 500 }}>budget</span>
    </div>
  );
}

function HeroVisual() {
  return (
    <div style={{
      position: "relative", aspectRatio: "5/6",
      background: C.primary, borderRadius: 24, overflow: "hidden",
      padding: 32, color: "#fff",
    }}>
      <div style={{
        position: "absolute", top: -80, right: -60,
        width: 300, height: 300, borderRadius: "50%",
        background: `radial-gradient(circle at 30% 30%, ${C.accent}, transparent 65%)`,
        opacity: 0.9,
      }} />
      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{ fontFamily: FONT.ui, fontSize: 11, opacity: 0.6, textTransform: "uppercase", letterSpacing: 1 }}>Leftover · this fortnight</div>
        <div style={{ fontFamily: FONT.serif, fontSize: "clamp(48px, 7vw, 72px)", marginTop: 8, letterSpacing: -2, lineHeight: 1, fontWeight: 400 }}>
          $312<span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.54em" }}>.40</span>
        </div>
      </div>
      <div style={{
        position: "absolute", bottom: 32, left: 32, right: 32,
        background: "rgba(255,255,255,0.08)", borderRadius: 14,
        padding: 16, backdropFilter: "blur(10px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: `rgba(16,185,129,0.25)`, color: C.accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14,
          }}>✦</div>
          <div style={{ fontFamily: FONT.ui, fontSize: 11, opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.5 }}>Coach insight</div>
        </div>
        <div style={{ fontFamily: FONT.ui, fontSize: 14, lineHeight: 1.45 }}>
          Subscriptions are trending 18% above your 90-day average. Netflix + Disney+ overlap.
        </div>
      </div>
    </div>
  );
}

export default function Landing({ onGetStarted }) {
  const features = [
    { t: "Calm, not alarmist", d: "See what's safe to spend today — no red numbers, no guilt trips.", ic: "◐" },
    { t: "On-device only", d: "No cloud, no accounts on our servers. Your CSV, your PIN, your device.", ic: "◆" },
    { t: "Coach that speaks plainly", d: "Bring your Gemini key. Ask anything about your money in conversation.", ic: "✦" },
    { t: "Auto subscription radar", d: "Flags recurring charges from 180+ services and tracks their real cost.", ic: "♫" },
    { t: "Australian-first, global too", d: "CSV presets for CBA, ANZ, Westpac, NAB, Up, ING — or map any bank manually.", ic: "⌂" },
    { t: "Goals that move with you", d: "Set a target, see projected date, drag it earlier when you save faster.", ic: "◇" },
  ];

  return (
    <div style={{ background: C.bg, color: C.ink, fontFamily: FONT.ui, minHeight: "100vh" }}>
      {/* Nav */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(250,250,247,0.88)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.line}`,
        padding: "14px 0",
      }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto", padding: "0 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Logo />
          <nav className="landing-nav-links" style={{ display: "flex", gap: 28, alignItems: "center" }}>
            {["Private", "Coach", "Import", "Pricing"].map((l) => (
              <a key={l} href="#features" style={{ fontFamily: FONT.ui, fontSize: 14, color: C.muted, textDecoration: "none", fontWeight: 500 }}>{l}</a>
            ))}
          </nav>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={onGetStarted} className="landing-signin" style={{ background: "transparent", border: "none", fontFamily: FONT.ui, fontSize: 14, color: C.ink, cursor: "pointer", fontWeight: 500 }}>Sign in</button>
            <button onClick={onGetStarted} style={{
              background: C.primary, color: "#fff", border: "none",
              padding: "10px 18px", borderRadius: 10,
              fontFamily: FONT.ui, fontSize: 14, fontWeight: 600,
              cursor: "pointer",
            }}>Get started</button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="landing-hero" style={{
        maxWidth: 1280, margin: "0 auto", padding: "80px 24px 40px",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center",
      }}>
        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 12px", borderRadius: 99,
            background: C.accentSoft, color: C.accent,
            fontFamily: FONT.ui, fontSize: 12, fontWeight: 600,
            letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 24,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent }} />
            Private · on-device
          </div>
          <h1 style={{
            fontFamily: FONT.serif, fontSize: "clamp(44px, 6vw, 84px)",
            lineHeight: 1.02, color: C.ink, letterSpacing: -2,
            margin: 0, fontWeight: 400,
          }}>
            Money, held<br />
            <span style={{ fontStyle: "italic", color: C.accent }}>gently.</span>
          </h1>
          <p style={{
            fontFamily: FONT.ui, fontSize: 18, color: C.muted,
            lineHeight: 1.55, marginTop: 24, maxWidth: 480,
          }}>
            A quiet budget that learns your rhythms — not a nag that counts every coffee.
            No cloud, no tracking. Your data lives on your device, full stop.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
            <button onClick={onGetStarted} style={{
              background: C.primary, color: "#fff", border: "none",
              padding: "14px 24px", borderRadius: 12,
              fontFamily: FONT.ui, fontSize: 16, fontWeight: 600,
              cursor: "pointer",
            }}>Start free — no card</button>
            <a href="#features" style={{
              background: "transparent", color: C.ink, textDecoration: "none",
              border: `1px solid ${C.line}`,
              padding: "14px 24px", borderRadius: 12,
              fontFamily: FONT.ui, fontSize: 16, fontWeight: 500,
              cursor: "pointer", display: "inline-flex", alignItems: "center",
            }}>See how it works</a>
          </div>
          <div style={{
            marginTop: 40, display: "flex", gap: 32,
            fontFamily: FONT.ui, fontSize: 13, color: C.muted, flexWrap: "wrap",
          }}>
            <div><b style={{ color: C.ink, fontSize: 17, fontFamily: FONT.serif, fontWeight: 500, letterSpacing: -0.3 }}>$0</b><br />to start</div>
            <div><b style={{ color: C.ink, fontSize: 17, fontFamily: FONT.serif, fontWeight: 500, letterSpacing: -0.3 }}>On-device</b><br />no cloud required</div>
            <div><b style={{ color: C.ink, fontSize: 17, fontFamily: FONT.serif, fontWeight: 500, letterSpacing: -0.3 }}>0</b><br />trackers shipped</div>
          </div>
        </div>
        <HeroVisual />
      </section>

      {/* Features */}
      <section id="features" style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ marginBottom: 48, maxWidth: 560 }}>
          <div style={{ fontFamily: FONT.ui, fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600, marginBottom: 12 }}>What's inside</div>
          <div style={{ fontFamily: FONT.serif, fontSize: "clamp(32px, 4vw, 48px)", color: C.ink, letterSpacing: -1.2, lineHeight: 1.1, fontWeight: 400 }}>
            Everything a budget<br />should be, nothing it shouldn't.
          </div>
        </div>
        <div className="landing-features" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 1, background: C.line, border: `1px solid ${C.line}`,
          borderRadius: 16, overflow: "hidden",
        }}>
          {features.map((f) => (
            <div key={f.t} style={{ background: C.surface, padding: 32, minHeight: 200 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: C.primarySoft, color: C.primary,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, marginBottom: 20,
              }}>{f.ic}</div>
              <div style={{ fontFamily: FONT.serif, fontSize: 22, color: C.ink, marginBottom: 8, letterSpacing: -0.4, lineHeight: 1.2, fontWeight: 500 }}>{f.t}</div>
              <div style={{ fontFamily: FONT.ui, fontSize: 14, color: C.muted, lineHeight: 1.55 }}>{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{
          background: C.primary, color: "#fff", borderRadius: 24,
          padding: "60px 48px", position: "relative", overflow: "hidden",
          textAlign: "center",
        }}>
          <div style={{
            position: "absolute", top: -100, right: -80,
            width: 320, height: 320, borderRadius: "50%",
            background: `radial-gradient(circle, ${C.accent}44, transparent 70%)`,
          }} />
          <div style={{ position: "relative", zIndex: 2, maxWidth: 560, margin: "0 auto" }}>
            <div style={{ fontFamily: FONT.serif, fontSize: "clamp(32px, 4vw, 44px)", letterSpacing: -1.2, lineHeight: 1.1, fontWeight: 400 }}>
              Ready when<br /><span style={{ fontStyle: "italic", color: C.accent }}>you are.</span>
            </div>
            <p style={{ fontFamily: FONT.ui, fontSize: 16, color: "rgba(255,255,255,0.72)", marginTop: 16, lineHeight: 1.5 }}>
              Takes under two minutes to set up. No email required, no card, nothing to cancel.
            </p>
            <button onClick={onGetStarted} style={{
              marginTop: 28, background: "#fff", color: C.primary,
              border: "none", padding: "14px 28px", borderRadius: 12,
              fontFamily: FONT.ui, fontSize: 16, fontWeight: 600, cursor: "pointer",
            }}>Get started free →</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${C.line}`,
        padding: "40px 24px", textAlign: "center",
        fontFamily: FONT.ui, fontSize: 13, color: C.muted,
      }}>
        Budget · Local-first · Private by design
      </footer>
    </div>
  );
}
