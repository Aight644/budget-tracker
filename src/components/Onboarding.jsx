import { useState } from "react";
import { CURRENCIES } from "../lib/constants.js";

const L = {
  blue: "#0B2545",
  blueDeep: "#071A36",
  blueSoft: "#E8EEF7",
  ink: "#0F172A",
  muted: "#64748B",
  line: "#E4E8EF",
  orange: "#F07A2E",
  orangeSoft: "#FFE8D6",
  bg: "#FAF7F2",
  white: "#FFFFFF",
  green: "#2E9E6A",
};

const font = { ui: "Inter, system-ui, sans-serif", serif: '"Instrument Serif", Georgia, serif' };

function Logo({ size = 28, dark = false }) {
  const c = dark ? "#fff" : L.blue;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width={size} height={size} viewBox="0 0 28 28">
        <rect x="1" y="1" width="26" height="26" rx="8" fill={c} />
        <path d="M8 20V8h3.2c3.6 0 5.4 2 5.4 5.9 0 3.9-1.8 6.1-5.4 6.1H8z" fill={L.orange} />
        <circle cx="20" cy="9" r="2" fill={L.orange} />
      </svg>
      <span style={{ fontFamily: font.serif, fontSize: size * 0.9, color: c, letterSpacing: -0.5, fontWeight: 400 }}>budget</span>
    </div>
  );
}

function PrimaryBtn({ children, onClick, disabled, style = {}, ghost = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 56, borderRadius: 16, width: "100%",
        background: ghost ? "transparent" : disabled ? L.blueSoft : L.blue,
        color: ghost ? L.blue : disabled ? "#9AA7BB" : "#fff",
        border: ghost ? `1.5px solid ${L.line}` : "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 17, fontWeight: 600, letterSpacing: -0.2,
        fontFamily: font.ui, cursor: disabled ? "default" : "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 36, height: 36, borderRadius: 12,
      background: "#fff", border: `1px solid ${L.line}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", padding: 0,
    }}>
      <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
        <path d="M8 2L2 8l6 6" stroke={L.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function ProgressDots({ idx, total = 3 }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 4, width: i === idx ? 20 : 4,
          borderRadius: 4,
          background: i <= idx ? L.blue : L.line,
          transition: "all 0.3s",
        }} />
      ))}
    </div>
  );
}

function Label({ children }) {
  return (
    <div style={{
      fontSize: 12, color: L.muted, fontWeight: 500,
      textTransform: "uppercase", letterSpacing: 0.6,
      fontFamily: font.ui, marginBottom: 10,
    }}>{children}</div>
  );
}

function Sparkle({ top, left, right, c, r = 0, sm }) {
  const s = sm ? 10 : 16;
  return (
    <div style={{ position: "absolute", top, left, right, width: s, height: s, transform: `rotate(${r}deg)` }}>
      <svg viewBox="0 0 16 16" width={s} height={s}>
        <path d="M8 0l1.6 6.4L16 8l-6.4 1.6L8 16l-1.6-6.4L0 8l6.4-1.6z" fill={c} />
      </svg>
    </div>
  );
}

// ── Screen 1: Welcome ──────────────────────────────
function Welcome({ onNext }) {
  return (
    <div style={{
      minHeight: "100dvh", background: L.blue, color: "#fff",
      display: "flex", flexDirection: "column",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: -120, right: -80,
        width: 360, height: 360, borderRadius: "50%",
        background: `radial-gradient(circle at 30% 30%, ${L.orange}, transparent 65%)`,
        opacity: 0.9,
      }} />
      <div style={{
        position: "absolute", bottom: 120, left: -100,
        width: 280, height: 280, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(240,122,46,0.18), transparent 70%)`,
      }} />

      <div style={{ padding: "60px 32px 0", position: "relative", zIndex: 2 }}>
        <Logo dark />
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "flex-end", padding: "0 32px 40px", position: "relative", zIndex: 2 }}>
        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 12px", borderRadius: 99,
            background: "rgba(255,255,255,0.12)",
            fontSize: 13, fontWeight: 500, letterSpacing: 0.3,
            textTransform: "uppercase", marginBottom: 28,
            fontFamily: font.ui,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: L.orange }} />
            Private by default
          </div>
          <div style={{
            fontFamily: font.serif,
            fontSize: 56, lineHeight: 1.02, letterSpacing: -1.5,
            fontWeight: 400,
          }}>
            Money, held<br />
            <span style={{ fontStyle: "italic", color: L.orange }}>gently.</span>
          </div>
          <div style={{
            fontSize: 16, lineHeight: 1.45, marginTop: 20,
            color: "rgba(255,255,255,0.72)", maxWidth: 340,
            fontFamily: font.ui,
          }}>
            A quiet budget that learns your rhythms — not a nag that counts every coffee.
          </div>
        </div>
      </div>

      <div style={{ padding: "0 24px 40px", position: "relative", zIndex: 2 }}>
        <PrimaryBtn onClick={onNext} style={{ background: L.orange, color: L.blueDeep, marginBottom: 10 }}>
          Get started
        </PrimaryBtn>
      </div>
    </div>
  );
}

// ── Screen 2: Profile (currency + payday) ──────────
function Profile({ state, setState, onNext, onBack }) {
  const picked = CURRENCIES.find((c) => c.code === state.currency) || CURRENCIES[0];
  const [showCurrency, setShowCurrency] = useState(false);
  const paydays = ["1st", "15th", "Fortnightly", "Weekly"];
  return (
    <div style={{ minHeight: "100dvh", background: L.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "60px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <BackBtn onClick={onBack} />
        <ProgressDots idx={0} />
        <div style={{ width: 36 }} />
      </div>

      <div style={{ padding: "40px 24px 0", flex: 1 }}>
        <div style={{ fontFamily: font.serif, fontSize: 34, lineHeight: 1.1, color: L.ink, letterSpacing: -0.8 }}>
          Let's shape your setup.
        </div>
        <div style={{ fontSize: 15, color: L.muted, marginTop: 10, fontFamily: font.ui }}>
          Currency formats your numbers. Payday helps align your budget periods.
        </div>

        <div style={{ marginTop: 36 }}>
          <Label>Currency</Label>
          <button onClick={() => setShowCurrency(!showCurrency)} style={{
            width: "100%", height: 60, background: "#fff", borderRadius: 16,
            border: `1px solid ${showCurrency ? L.blue : L.line}`,
            padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
            fontFamily: font.ui, fontSize: 17, color: L.ink, cursor: "pointer",
            boxShadow: showCurrency ? `0 0 0 4px rgba(11,37,69,0.08)` : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: L.blueSoft, color: L.blue,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 15,
              }}>{picked.code[0]}</div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{picked.label.split(" (")[0]}</div>
                <div style={{ fontSize: 12, color: L.muted }}>{picked.code}</div>
              </div>
            </div>
            <svg width="12" height="8" viewBox="0 0 12 8" style={{ transform: showCurrency ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
              <path d="M1 1l5 5 5-5" stroke={L.muted} strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          </button>
          {showCurrency && (
            <div style={{
              marginTop: 6, maxHeight: 280, overflowY: "auto",
              background: "#fff", borderRadius: 16, border: `1px solid ${L.line}`,
            }}>
              {CURRENCIES.map((c) => (
                <button key={c.code} onClick={() => { setState({ ...state, currency: c.code }); setShowCurrency(false); }} style={{
                  width: "100%", padding: "12px 18px", background: c.code === state.currency ? L.blueSoft : "transparent",
                  border: "none", borderBottom: `1px solid ${L.line}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  fontFamily: font.ui, fontSize: 14, cursor: "pointer", textAlign: "left",
                }}>
                  <span style={{ color: L.ink }}>{c.label}</span>
                  <span style={{ color: L.muted, fontSize: 12 }}>{c.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 20 }}>
          <Label>Pay cycle</Label>
          <div style={{ display: "flex", gap: 8 }}>
            {paydays.map((p) => (
              <button key={p} onClick={() => setState({ ...state, payday: p })} style={{
                flex: 1, height: 48, borderRadius: 12,
                background: state.payday === p ? L.blue : "#fff",
                border: `1px solid ${state.payday === p ? L.blue : L.line}`,
                color: state.payday === p ? "#fff" : L.ink,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: font.ui, fontSize: 14, fontWeight: 500, cursor: "pointer",
              }}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 24px 40px" }}>
        <PrimaryBtn onClick={onNext}>Continue</PrimaryBtn>
      </div>
    </div>
  );
}

// ── Screen 3: Goals ─────────────────────────────────
function Goals({ state, setState, onNext, onBack, onSkip }) {
  const goals = [
    { id: "spend", t: "Spend with less guilt", s: "Know what's safe to spend", ic: "◐" },
    { id: "emergency", t: "Build a rainy-day fund", s: "3 months of essentials", ic: "◉" },
    { id: "debt", t: "Pay off a card or loan", s: "Chip away, month by month", ic: "○" },
    { id: "save", t: "Save for something big", s: "A trip, a ring, a move", ic: "◇" },
    { id: "observe", t: "Just watch my money", s: "No goals — observe first", ic: "◌" },
  ];
  const selected = state.goals || new Set();
  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setState({ ...state, goals: next });
  };
  return (
    <div style={{ minHeight: "100dvh", background: L.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "60px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <BackBtn onClick={onBack} />
        <ProgressDots idx={1} />
        <button onClick={onSkip} style={{ fontFamily: font.ui, fontSize: 14, color: L.muted, width: 36, textAlign: "right", background: "none", border: "none", cursor: "pointer" }}>Skip</button>
      </div>

      <div style={{ padding: "40px 24px 0", flex: 1 }}>
        <div style={{ fontFamily: font.serif, fontSize: 34, lineHeight: 1.1, color: L.ink, letterSpacing: -0.8 }}>
          What brings<br />you here?
        </div>
        <div style={{ fontSize: 15, color: L.muted, marginTop: 10, fontFamily: font.ui }}>
          Pick as many as fit. We'll shape your home around these.
        </div>

        <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
          {goals.map((g) => {
            const on = selected.has(g.id);
            return (
              <button key={g.id} onClick={() => toggle(g.id)} style={{
                padding: "16px 18px", borderRadius: 16, width: "100%",
                background: "#fff",
                border: `1.5px solid ${on ? L.blue : L.line}`,
                display: "flex", alignItems: "center", gap: 14,
                boxShadow: on ? `0 0 0 3px rgba(11,37,69,0.06)` : "none",
                cursor: "pointer", fontFamily: font.ui, textAlign: "left",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: on ? L.orangeSoft : L.blueSoft,
                  color: on ? L.orange : L.blue,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, flexShrink: 0,
                }}>{g.ic}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: L.ink }}>{g.t}</div>
                  <div style={{ fontSize: 13, color: L.muted, marginTop: 2 }}>{g.s}</div>
                </div>
                <div style={{
                  width: 24, height: 24, borderRadius: 8,
                  background: on ? L.blue : "transparent",
                  border: `1.5px solid ${on ? L.blue : L.line}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {on && (
                    <svg width="12" height="10" viewBox="0 0 12 10"><path d="M1 5l3.5 3.5L11 1.5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "16px 24px 40px" }}>
        <PrimaryBtn onClick={onNext}>Continue{selected.size > 0 ? ` · ${selected.size} selected` : ""}</PrimaryBtn>
      </div>
    </div>
  );
}

// ── Screen 4: Connect ───────────────────────────────
function Connect({ onNext, onBack, onSkip }) {
  return (
    <div style={{ minHeight: "100dvh", background: L.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "60px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <BackBtn onClick={onBack} />
        <ProgressDots idx={2} />
        <button onClick={onSkip} style={{ fontFamily: font.ui, fontSize: 14, color: L.muted, width: 36, textAlign: "right", background: "none", border: "none", cursor: "pointer" }}>Skip</button>
      </div>

      <div style={{ padding: "40px 24px 0", flex: 1 }}>
        <div style={{ fontFamily: font.serif, fontSize: 34, lineHeight: 1.1, color: L.ink, letterSpacing: -0.8 }}>
          Bring in your<br />
          <span style={{ fontStyle: "italic", color: L.orange }}>first data.</span>
        </div>
        <div style={{ fontSize: 15, color: L.muted, marginTop: 10, lineHeight: 1.5, fontFamily: font.ui }}>
          Your data stays on this device. Import a bank CSV or add things manually — whatever's quicker.
        </div>

        <div style={{
          marginTop: 32, height: 168, position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            position: "absolute", width: 240, height: 148,
            borderRadius: 16, background: L.blueSoft,
            transform: "rotate(-8deg) translateX(-20px)",
            border: `1px solid ${L.line}`,
          }} />
          <div style={{
            position: "absolute", width: 240, height: 148,
            borderRadius: 16, background: L.orangeSoft,
            transform: "rotate(4deg) translateX(15px)",
            border: `1px solid rgba(240,122,46,0.2)`,
          }} />
          <div style={{
            position: "relative", width: 240, height: 148,
            borderRadius: 16, background: L.blue,
            padding: 18, color: "#fff",
            boxShadow: "0 12px 32px rgba(11,37,69,0.25)",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontFamily: font.serif, fontSize: 18, letterSpacing: -0.3 }}>budget</div>
              <div style={{ width: 28, height: 20, borderRadius: 4, background: `linear-gradient(135deg, ${L.orange}, #FFB07A)` }} />
            </div>
            <div>
              <div style={{ fontFamily: font.ui, fontSize: 11, opacity: 0.6, marginBottom: 4 }}>LOCAL · ENCRYPTED</div>
              <div style={{ fontFamily: font.ui, fontSize: 15, letterSpacing: 2, fontWeight: 500 }}>•••• •••• •••• 4429</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 24px 40px" }}>
        <PrimaryBtn onClick={() => onNext("csv")} style={{ marginBottom: 10 }}>Import a bank CSV</PrimaryBtn>
        <PrimaryBtn onClick={() => onNext("manual")} ghost>I'll track manually for now</PrimaryBtn>
      </div>
    </div>
  );
}

// ── Screen 5: Done ──────────────────────────────────
function Done({ state, onFinish }) {
  return (
    <div style={{
      minHeight: "100dvh", background: L.bg,
      display: "flex", flexDirection: "column",
      position: "relative", overflow: "hidden",
    }}>
      <Sparkle top={120} left={40} c={L.orange} r={-15} />
      <Sparkle top={180} right={60} c={L.blue} r={20} />
      <Sparkle top={300} left={80} c={L.blue} r={40} />
      <Sparkle top={90} right={120} c={L.orange} r={10} sm />

      <div style={{ flex: 1, padding: "60px 32px 0", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{
          width: 96, height: 96, borderRadius: 32,
          background: L.blue,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 32,
          boxShadow: "0 20px 40px rgba(11,37,69,0.25)",
        }}>
          <svg width="44" height="34" viewBox="0 0 44 34"><path d="M4 18l12 12L40 4" stroke={L.orange} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div style={{ fontFamily: font.serif, fontSize: 44, lineHeight: 1.02, color: L.ink, letterSpacing: -1.2 }}>
          You're all set{state.firstName ? ", " : ""}
          {state.firstName ? <span style={{ fontStyle: "italic", color: L.orange }}>{state.firstName}.</span> : <span style={{ fontStyle: "italic", color: L.orange }}>.</span>}
        </div>
        <div style={{ fontSize: 16, color: L.muted, marginTop: 16, lineHeight: 1.5, fontFamily: font.ui, maxWidth: 340 }}>
          We've shaped a starter plan based on your goals. You can reshape it anytime from the app.
        </div>

        <div style={{
          marginTop: 28, padding: 18, background: "#fff",
          borderRadius: 18, border: `1px solid ${L.line}`,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: L.orangeSoft, color: L.orange,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 700,
          }}>✦</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: font.ui, fontSize: 14, fontWeight: 600, color: L.ink }}>Private by default</div>
            <div style={{ fontFamily: font.ui, fontSize: 12, color: L.muted, marginTop: 2 }}>Your data lives on this device only.</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 24px 40px" }}>
        <PrimaryBtn onClick={onFinish}>Open my dashboard</PrimaryBtn>
      </div>
    </div>
  );
}

// ── Container ───────────────────────────────────────
export default function Onboarding({ initialCurrency, onComplete }) {
  const [step, setStep] = useState(0);
  const [state, setState] = useState({ currency: initialCurrency || "AUD", payday: "Fortnightly", goals: new Set() });

  const finish = (extra = {}) => {
    onComplete({
      currency: state.currency,
      goals: Array.from(state.goals),
      ...extra,
    });
  };

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  if (step === 0) return <Welcome onNext={next} />;
  if (step === 1) return <Profile state={state} setState={setState} onNext={next} onBack={back} />;
  if (step === 2) return <Goals state={state} setState={setState} onNext={next} onBack={back} onSkip={next} />;
  if (step === 3) return <Connect onBack={back} onNext={(choice) => { setState({ ...state, choice }); setStep(4); }} onSkip={() => setStep(4)} />;
  return <Done state={state} onFinish={() => finish({ action: state.choice })} />;
}
