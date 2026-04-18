import { FONT, makeTheme } from "../lib/theme.js";

export function Logo({ size = 28, T }) {
  const t = T || makeTheme({});
  const disc = size * 1.1;
  const id = "zlg-" + Math.floor(Math.random() * 1e6);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width={disc} height={disc} viewBox="0 0 64 64" style={{ flexShrink: 0 }} aria-hidden>
        <defs>
          <radialGradient id={id + "a"} cx="38%" cy="35%" r="75%">
            <stop offset="0%" stopColor="#1fb56a" />
            <stop offset="45%" stopColor="#0e6b4a" />
            <stop offset="100%" stopColor="#063a2c" />
          </radialGradient>
          <radialGradient id={id + "b"} cx="25%" cy="90%" r="55%">
            <stop offset="0%" stopColor="#2ea3e6" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#1f7f9e" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#063a2c" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="64" height="64" rx="14" fill={`url(#${id}a)`} />
        <rect x="0" y="0" width="64" height="64" rx="14" fill={`url(#${id}b)`} />
        <circle cx="42" cy="26" r="26" fill="#0b5238" opacity="0.45" />
        <path d="M21 26h14c1.1 0 1.7 1.2 1.1 2.1L26 42h12v4H22c-1.1 0-1.7-1.2-1.1-2.1L31 30H21v-4z" fill="#fff" />
      </svg>
      <span style={{
        fontFamily: FONT.ui,
        fontSize: size * 0.92, color: t.ink,
        letterSpacing: -1, fontWeight: 600, lineHeight: 1,
      }}>Zerod</span>
    </div>
  );
}

export function Glyph({ ch, size = 44, bg, fg, radius = 12 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: bg, color: fg,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.46, fontWeight: 500, flexShrink: 0,
      fontFamily: FONT.ui,
    }}>{ch}</div>
  );
}

export function Sparkline({ data, width = 260, height = 56, stroke, fill }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const step = width / Math.max(data.length - 1, 1);
  const pts = data.map((v, i) => [i * step, height - (v / max) * (height - 6) - 2]);
  const d = pts.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(" ");
  const area = `${d} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      <path d={area} fill={fill} opacity={0.22} />
      <path d={d} stroke={stroke} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3.5} fill={stroke} />
    </svg>
  );
}

export function Donut({ segments, size = 160, thickness = 18, center }) {
  const r = size / 2 - thickness / 2;
  const c = size / 2;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const circum = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const frac = s.value / total;
          const dash = frac * circum;
          const gap = circum - dash;
          const off = -acc * circum;
          acc += frac;
          return (
            <circle key={i} cx={c} cy={c} r={r} fill="none"
              stroke={s.color} strokeWidth={thickness}
              strokeDasharray={`${Math.max(dash - 1, 0)} ${gap + 1}`}
              strokeDashoffset={off}
              transform={`rotate(-90 ${c} ${c})`}
              strokeLinecap="butt" />
          );
        })}
      </svg>
      {center && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          textAlign: "center",
        }}>{center}</div>
      )}
    </div>
  );
}

export function ProgressBar({ value, max = 100, color, bg, height = 6, radius = 3 }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ width: "100%", height, background: bg, borderRadius: radius, overflow: "hidden" }}>
      <div style={{ width: pct + "%", height: "100%", background: color, transition: "width .4s ease" }} />
    </div>
  );
}

export function Chip({ children, tone = "neutral", T, style = {} }) {
  const tones = {
    neutral: { bg: T.surfaceAlt, fg: T.muted, border: T.line },
    accent: { bg: T.accentSoft, fg: T.accent, border: "transparent" },
    primary: { bg: T.primarySoft, fg: T.primary, border: "transparent" },
    warning: { bg: T.warningSoft, fg: T.warning, border: "transparent" },
    danger: { bg: T.dangerSoft, fg: T.danger, border: "transparent" },
  };
  const p = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: 99,
      background: p.bg, color: p.fg,
      border: `1px solid ${p.border}`,
      fontSize: 11, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase",
      ...style,
    }}>{children}</span>
  );
}

export function SectionHeader({ T, title, hint, onMore }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <div>
        <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{title}</div>
        {hint && <div style={{ fontSize: 11, color: T.mutedSoft, marginTop: 2 }}>{hint}</div>}
      </div>
      {onMore && (
        <button onClick={onMore} style={{ background: "transparent", border: "none", color: T.primary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT.ui }}>See all →</button>
      )}
    </div>
  );
}

export function ViewHeader({ title, sub, action, T, eyebrow }) {
  return (
    <div className="view-header" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 4 }}>
      <div>
        {eyebrow && <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700 }}>{eyebrow}</div>}
        <h1 style={{ fontFamily: FONT.serif, fontSize: 36, letterSpacing: -1.2, lineHeight: 1.1, marginTop: 6, marginBottom: 0, fontWeight: 400 }}>{title}</h1>
        {sub && <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

export function SummaryCard({ label, value, hint, tone, T }) {
  const tones = {
    accent: { fg: T.accent },
    primary: { fg: T.primary },
    warning: { fg: T.warning },
    danger: { fg: T.danger },
  };
  const p = tones[tone];
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 16, padding: 20, boxShadow: T.shadow }}>
      <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: FONT.serif, fontSize: 32, letterSpacing: -1, marginTop: 8, color: p ? p.fg : T.ink, lineHeight: 1 }}>{value}</div>
      {hint && <div style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}
