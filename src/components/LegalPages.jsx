import { FONT } from "../lib/theme.js";
import { Logo } from "./Primitives.jsx";

const C = {
  bg: "#fafaf7", surface: "#ffffff", ink: "#0f172a", muted: "#64748b",
  line: "#e5e7eb", primary: "#1e40af", accent: "#10b981",
};

function PageShell({ title, lastUpdated, children, onBack }) {
  return (
    <div style={{ minHeight: "100dvh", background: C.bg, color: C.ink, fontFamily: FONT.ui }}>
      <div style={{
        borderBottom: `1px solid ${C.line}`,
        background: "rgba(250,250,247,0.88)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Logo size={24} T={{ ink: C.ink, primary: C.primary, accent: C.accent }} />
          <button onClick={onBack} style={{ background: "transparent", border: `1px solid ${C.line}`, color: C.muted, padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: FONT.ui }}>← Back</button>
        </div>
      </div>
      <article style={{ maxWidth: 720, margin: "0 auto", padding: "64px 24px 96px" }}>
        <div style={{ fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700, marginBottom: 10 }}>Legal</div>
        <h1 style={{ fontFamily: FONT.serif, fontSize: 44, margin: "0 0 8px", letterSpacing: -1.2, lineHeight: 1.1, fontWeight: 400 }}>{title}</h1>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 40 }}>Last updated · {lastUpdated}</div>
        <div style={{ fontSize: 15, color: C.ink, lineHeight: 1.7 }}>{children}</div>
      </article>
      <div style={{ borderTop: `1px solid ${C.line}`, padding: "32px 24px", textAlign: "center", fontSize: 13, color: C.muted }}>
        Budget · Local-first · Private by design
      </div>
    </div>
  );
}

function H2({ children }) {
  return <h2 style={{ fontFamily: FONT.serif, fontSize: 24, marginTop: 40, marginBottom: 12, letterSpacing: -0.4, fontWeight: 500 }}>{children}</h2>;
}

function P({ children }) {
  return <p style={{ margin: "0 0 14px" }}>{children}</p>;
}

export function PrivacyPage({ onBack }) {
  return (
    <PageShell title="Privacy Policy" lastUpdated="April 2026" onBack={onBack}>
      <P>Budget is a local-first personal finance app. This policy explains what data we collect, where it lives, and your control over it.</P>
      <H2>What we collect</H2>
      <P>By default, <b>nothing leaves your device</b>. All your financial data — accounts, transactions, goals, budgets — is stored in your browser's local storage on the device where you enter it.</P>
      <P>If you <b>choose</b> to enable cloud sync by signing in with email and password, your data is encrypted in transit (HTTPS) and stored under your user account on Supabase. Each user can only read and write their own data (enforced by row-level security).</P>
      <P>If you <b>choose</b> to enable the AI Coach by providing your own Gemini API key, conversations and a summary of your financial data are sent to Google's Gemini API when you send a message. Your API key is stored only in your browser's local storage.</P>
      <H2>What we don't collect</H2>
      <P>We don't run analytics trackers, advertising identifiers, or third-party scripts on the web version. We don't know who you are unless you sign up for sync.</P>
      <P>We never see your bank credentials, passwords, or account numbers — Budget reads from CSV files you explicitly upload.</P>
      <H2>Where data lives</H2>
      <P>Local-only mode: your device, in browser storage. Deletable anytime by clearing site data or using "Clear all data" in Settings.</P>
      <P>Sync-enabled: Supabase (PostgreSQL, encrypted at rest, hosted in the region you selected at project creation). Deletable by clicking "Delete account" in Settings (coming soon) or emailing us at the address below.</P>
      <H2>Ads (native app only)</H2>
      <P>If you use the free tier of the iOS or Android app, Google AdMob serves banner ads. AdMob may collect device-level advertising identifiers as described in Google's privacy policy. The web version has no ads.</P>
      <H2>Your rights</H2>
      <P>You can export a full JSON backup of your data at any time from Settings → Export backup. You can delete all data immediately with "Clear all data" in Settings. You can disconnect sync by signing out.</P>
      <H2>Contact</H2>
      <P>Questions or requests: reply to any email from the address you signed up with, or open an issue on our GitHub.</P>
    </PageShell>
  );
}

export function TermsPage({ onBack }) {
  return (
    <PageShell title="Terms of Service" lastUpdated="April 2026" onBack={onBack}>
      <P>By using Budget ("the app") you agree to these terms. They're short because Budget is a tool, not a financial institution.</P>
      <H2>What Budget is</H2>
      <P>Budget is a personal finance tracker. It helps you categorise transactions, set goals, and understand your spending patterns. It is <b>not</b> a bank, not a financial advisor, and not regulated as either.</P>
      <H2>Not financial advice</H2>
      <P>Nothing in the app — including AI Coach responses, health scores, or forecasts — constitutes professional financial advice. Decisions about your money remain yours. Consult a licensed advisor for major decisions.</P>
      <H2>Your responsibility</H2>
      <P>You are responsible for the accuracy of the data you enter. You are responsible for keeping your sign-in credentials and any API keys (e.g. Gemini) secure.</P>
      <H2>No warranty</H2>
      <P>Budget is provided "as is" without warranty of any kind. We try hard to be reliable but cannot guarantee the app is free of bugs or that sync will never fail. Always keep a recent JSON backup (Settings → Export).</P>
      <H2>Acceptable use</H2>
      <P>Don't abuse the service, reverse engineer it for competitive purposes, or attempt to access data that isn't yours.</P>
      <H2>Termination</H2>
      <P>You can stop using the app at any time and delete your data. We can terminate access for accounts that violate these terms.</P>
      <H2>Changes</H2>
      <P>If these terms change materially, we'll update the "last updated" date and notify signed-in users by email.</P>
    </PageShell>
  );
}

export function AboutPage({ onBack }) {
  return (
    <PageShell title="About" lastUpdated="April 2026" onBack={onBack}>
      <P>Budget is an independently-built personal finance app with one opinion: your money data should belong to you, and your tool should be quiet about it.</P>
      <H2>Why local-first</H2>
      <P>Most budgeting apps want your bank credentials, phone number, and continuous cloud sync as a precondition. That's fine for some people; it's anxiety for others. Budget works completely on-device by default. Cloud sync is optional, paid features are optional, tracking is absent.</P>
      <H2>How we make money</H2>
      <P>We plan to offer a small Pro tier for extras like multi-device sync, household budgets, and advanced AI features. The free tier on mobile shows a single banner ad. The web version is free of ads. Your data is never sold, anonymised or otherwise.</P>
      <H2>Built with</H2>
      <P>React, Vite, IBM Plex type family, Supabase for optional sync, Google Gemini for the optional AI Coach, Capacitor for the native apps.</P>
      <H2>Open source bits</H2>
      <P>The core app is <a href="https://github.com/Aight644/budget-tracker" style={{ color: C.primary }}>open on GitHub</a>. Issues and contributions welcome.</P>
    </PageShell>
  );
}
