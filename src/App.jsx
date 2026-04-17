import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { SCHEMA_VERSION, CATEGORIES, FREQUENCIES, CURRENCIES, DEFAULT_CURRENCY, ACCOUNT_TYPES } from "./lib/constants.js";
import { loadStored, saveStored, clearStored } from "./lib/storage.js";
import { toYr, convertBy } from "./lib/calc.js";
import { makeFmt } from "./lib/format.js";

export default function BudgetApp() {
  const [items, setItems] = useState([]);
  const [goals, setGoals] = useState([]);
  const [view, setView] = useState("fortnightly");
  const [showForm, setShowForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [formData, setFormData] = useState({ name: "", amount: "", frequency: "monthly", category: "other", isIncome: false });
  const [goalFormData, setGoalFormData] = useState({ name: "", target: "", saved: "0", monthlySaving: "", deadline: "", color: "#16a34a" });
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteGoalConfirm, setDeleteGoalConfirm] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [accountFormData, setAccountFormData] = useState({ name: "", type: "checking", balance: "", color: "#2563eb", includeInNetWorth: true });
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState(null);
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const fmt = useMemo(() => makeFmt(currency), [currency]);

  const [saveError, setSaveError] = useState(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const d = loadStored();
    if (d) {
      if (Array.isArray(d.items)) setItems(d.items);
      if (Array.isArray(d.goals)) setGoals(d.goals);
      if (Array.isArray(d.accounts)) setAccounts(d.accounts);
      if (d.view) setView(d.view);
      if (d.darkMode !== undefined) setDarkMode(d.darkMode);
      if (d.currency && CURRENCIES.some((c) => c.code === d.currency)) setCurrency(d.currency);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const r = saveStored({ items, goals, accounts, view, darkMode, currency });
    setSaveError(r.ok ? null : r.error);
  }, [items, goals, accounts, view, darkMode, currency, loaded]);

  const handleExport = () => {
    const payload = { version: SCHEMA_VERSION, exportedAt: new Date().toISOString(), items, goals, accounts, view, darkMode, currency };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        if (!Array.isArray(d.items) && !Array.isArray(d.goals) && !Array.isArray(d.accounts)) throw new Error("Not a valid backup file");
        if (Array.isArray(d.items)) setItems(d.items);
        if (Array.isArray(d.goals)) setGoals(d.goals);
        if (Array.isArray(d.accounts)) setAccounts(d.accounts);
        if (d.view) setView(d.view);
        if (d.darkMode !== undefined) setDarkMode(d.darkMode);
        if (d.currency && CURRENCIES.some((c) => c.code === d.currency)) setCurrency(d.currency);
        setImportMsg({ type: "ok", text: `Imported ${(d.items || []).length} items, ${(d.goals || []).length} goals, ${(d.accounts || []).length} accounts` });
      } catch (err) {
        setImportMsg({ type: "err", text: `Import failed: ${err.message}` });
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setImportMsg(null), 4000);
    };
    reader.readAsText(file);
  };

  const convert = useCallback(convertBy(view), [view]);

  const incomeItems = items.filter(i => i.isIncome);
  const expenseItems = items.filter(i => !i.isIncome);
  const totalIncome = incomeItems.reduce((s, i) => s + convert(i.amount, i.frequency), 0);
  const totalExpenses = expenseItems.reduce((s, i) => s + convert(i.amount, i.frequency), 0);
  const leftover = totalIncome - totalExpenses;
  const categoryTotals = CATEGORIES.filter(c => c.id !== "income").map(cat => ({ ...cat, total: expenseItems.filter(i => i.category === cat.id).reduce((s, i) => s + convert(i.amount, i.frequency), 0) })).filter(c => c.total > 0);

  const resetForm = () => { setFormData({ name: "", amount: "", frequency: "monthly", category: "other", isIncome: false }); setEditingId(null); setShowForm(false); };
  const resetGoalForm = () => { setGoalFormData({ name: "", target: "", saved: "0", monthlySaving: "", deadline: "", color: "#16a34a" }); setEditingGoalId(null); setShowGoalForm(false); };
  const resetAccountForm = () => { setAccountFormData({ name: "", type: "checking", balance: "", color: "#2563eb", includeInNetWorth: true }); setEditingAccountId(null); setShowAccountForm(false); };

  const handleAccountSubmit = () => {
    if (!accountFormData.name.trim()) return;
    const bal = parseFloat(accountFormData.balance);
    if (!isFinite(bal)) return;
    const clean = { ...accountFormData, name: accountFormData.name.trim(), balance: bal };
    if (editingAccountId) setAccounts(p => p.map(a => a.id === editingAccountId ? { ...a, ...clean } : a));
    else setAccounts(p => [...p, { ...clean, id: Date.now().toString() }]);
    resetAccountForm();
  };

  const startEditAccount = (a) => {
    setAccountFormData({ name: a.name, type: a.type, balance: a.balance.toString(), color: a.color || "#2563eb", includeInNetWorth: a.includeInNetWorth !== false });
    setEditingAccountId(a.id);
    setShowAccountForm(true);
  };

  const netWorth = accounts.filter(a => a.includeInNetWorth !== false).reduce((s, a) => {
    const t = ACCOUNT_TYPES.find(t => t.id === a.type);
    const sign = t && t.isLiability ? -1 : 1;
    return s + (a.balance || 0) * sign;
  }, 0);
  const totalAssets = accounts.filter(a => a.includeInNetWorth !== false).reduce((s, a) => {
    const t = ACCOUNT_TYPES.find(t => t.id === a.type);
    return s + (t && !t.isLiability ? (a.balance || 0) : 0);
  }, 0);
  const totalLiabilities = accounts.filter(a => a.includeInNetWorth !== false).reduce((s, a) => {
    const t = ACCOUNT_TYPES.find(t => t.id === a.type);
    return s + (t && t.isLiability ? (a.balance || 0) : 0);
  }, 0);

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.amount) return;
    const amt = parseFloat(formData.amount);
    if (!isFinite(amt) || amt < 0) return;
    const clean = { ...formData, name: formData.name.trim(), amount: amt };
    if (editingId) setItems(p => p.map(i => i.id === editingId ? { ...i, ...clean } : i));
    else setItems(p => [...p, { ...clean, id: Date.now().toString() }]);
    resetForm();
  };

  const handleGoalSubmit = () => {
    if (!goalFormData.name.trim() || !goalFormData.target) return;
    const target = parseFloat(goalFormData.target);
    const saved = parseFloat(goalFormData.saved);
    const monthly = parseFloat(goalFormData.monthlySaving);
    if (!isFinite(target) || target <= 0) return;
    const gd = {
      ...goalFormData,
      name: goalFormData.name.trim(),
      target,
      saved: isFinite(saved) && saved >= 0 ? saved : 0,
      monthlySaving: isFinite(monthly) && monthly >= 0 ? monthly : 0,
    };
    if (editingGoalId) setGoals(p => p.map(g => g.id === editingGoalId ? { ...g, ...gd } : g));
    else setGoals(p => [...p, { ...gd, id: Date.now().toString() }]);
    resetGoalForm();
  };

  const startEdit = (item) => { setFormData({ name: item.name, amount: item.amount.toString(), frequency: item.frequency, category: item.category, isIncome: item.isIncome }); setEditingId(item.id); setShowForm(true); setActiveTab("items"); };
  const startEditGoal = (g) => { setGoalFormData({ name: g.name, target: g.target.toString(), saved: g.saved.toString(), monthlySaving: g.monthlySaving.toString(), deadline: g.deadline || "", color: g.color || "#16a34a" }); setEditingGoalId(g.id); setShowGoalForm(true); };

  const viewLabel = view === "fortnightly" ? "/fn" : view === "monthly" ? "/mo" : "/yr";
  const barMax = Math.max(...categoryTotals.map(c => c.total), 1);

  const T = darkMode ? {
    bg: "#0a0a0f",
    headerBg: "#111118",
    card: "rgba(255,255,255,0.03)",
    cardBorder: "rgba(255,255,255,0.06)",
    cardShadow: "none",
    text: "#e4e4e7",
    textMuted: "#a1a1aa",
    textLight: "#71717a",
    inputBg: "rgba(0,0,0,0.3)",
    inputBorder: "rgba(255,255,255,0.1)",
    accent: "#22c55e",
    accentBg: "rgba(34,197,94,0.08)",
    accentBorder: "rgba(34,197,94,0.15)",
    dangerBg: "rgba(239,68,68,0.08)",
    dangerBorder: "rgba(239,68,68,0.15)",
    danger: "#ef4444",
    tabBorder: "rgba(255,255,255,0.06)",
    toggleBg: "rgba(255,255,255,0.05)",
    toggleActive: "rgba(255,255,255,0.12)",
    toggleActiveText: "#fff",
    toggleShadow: "none",
    catBtnBg: "rgba(0,0,0,0.2)",
  } : {
    bg: "#faf9f7",
    headerBg: "#ffffff",
    card: "#ffffff",
    cardBorder: "#e8e5e0",
    cardShadow: "0 1px 3px rgba(0,0,0,0.04)",
    text: "#1a1a1a",
    textMuted: "#6b6560",
    textLight: "#9c9690",
    inputBg: "#f5f3f0",
    inputBorder: "#ddd9d3",
    accent: "#16a34a",
    accentBg: "#f0fdf4",
    accentBorder: "#bbf7d0",
    dangerBg: "#fef2f2",
    dangerBorder: "#fecaca",
    danger: "#dc2626",
    tabBorder: "#ece9e4",
    toggleBg: "#f5f3f0",
    toggleActive: "#ffffff",
    toggleActiveText: "#1a1a1a",
    toggleShadow: "0 1px 3px rgba(0,0,0,0.08)",
    catBtnBg: "#f5f3f0",
  };

  const S = {
    input: { width: "100%", padding: "10px 12px", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: "8px", color: T.text, fontSize: "14px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" },
    label: { display: "block", fontSize: "11px", color: T.textMuted, marginBottom: "4px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.3px" },
    card: { background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "14px", padding: "16px", marginBottom: "16px", boxShadow: T.cardShadow },
    mono: { fontFamily: "'Space Mono', monospace", fontWeight: "700" },
    greenBtn: { flex: 1, padding: "12px", background: "linear-gradient(135deg, #16a34a, #15803d)", border: "none", borderRadius: "10px", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },
    ghostBtn: { padding: "12px 20px", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: "10px", color: T.textMuted, fontSize: "14px", fontWeight: "500", cursor: "pointer", fontFamily: "inherit" },
  };

  const DelBtn = ({ id, onDel, confirm, setConfirm }) => confirm === id ? (
    <div style={{ display: "flex", gap: "4px" }}>
      <button onClick={() => onDel(id)} style={{ padding: "4px 8px", background: T.dangerBg, border: `1px solid ${T.dangerBorder}`, borderRadius: "6px", color: T.danger, fontSize: "11px", cursor: "pointer", fontFamily: "inherit" }}>Yes</button>
      <button onClick={() => setConfirm(null)} style={{ padding: "4px 8px", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: "6px", color: T.textMuted, fontSize: "11px", cursor: "pointer", fontFamily: "inherit" }}>No</button>
    </div>
  ) : <button onClick={() => setConfirm(id)} style={{ padding: "4px 8px", background: "transparent", border: "none", color: T.textLight, fontSize: "16px", cursor: "pointer", lineHeight: 1 }}>×</button>;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ padding: "24px 20px 16px", borderBottom: `1px solid ${T.tabBorder}`, background: T.headerBg }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "700", margin: 0, letterSpacing: "-0.5px", color: T.text }}>Budget Tracker</h1>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: T.textLight }}>{items.length === 0 ? "Add items to get started" : `${items.length} items · ${goals.length} goals`}</p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={() => setDarkMode(!darkMode)} style={{ background: T.toggleBg, border: `1px solid ${T.inputBorder}`, color: T.textMuted, padding: "8px 10px", borderRadius: "10px", fontSize: "16px", cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }} title={darkMode ? "Light mode" : "Dark mode"}>{darkMode ? "☀" : "☾"}</button>
            <button onClick={() => { resetForm(); setShowForm(true); setActiveTab("items"); }} style={{ background: "linear-gradient(135deg, #16a34a, #15803d)", border: "none", color: "#fff", padding: "10px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(22,163,74,0.25)" }}>+ Add</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: "4px", background: T.toggleBg, borderRadius: "10px", padding: "3px" }}>
          {["fortnightly", "monthly", "yearly"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ flex: 1, padding: "8px", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", background: view === v ? T.toggleActive : "transparent", color: view === v ? T.toggleActiveText : T.textLight, boxShadow: view === v ? T.toggleShadow : "none" }}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.tabBorder}`, background: T.headerBg }}>
        {[
          { id: "dashboard", label: "Overview" },
          { id: "items", label: "Budget" },
          { id: "accounts", label: "Accounts" },
          { id: "goals", label: "Goals" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: "12px 6px", border: "none", borderBottom: activeTab === tab.id ? `2px solid ${T.accent}` : "2px solid transparent", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", background: "transparent", color: activeTab === tab.id ? T.accent : T.textLight }}>{tab.label}</button>
        ))}
      </div>

      <div style={{ padding: "16px 20px 120px" }}>

        {/* DASHBOARD */}
        {activeTab === "dashboard" && accounts.length > 0 && (
          <div style={{ background: netWorth >= 0 ? T.accentBg : T.dangerBg, border: `1px solid ${netWorth >= 0 ? T.accentBorder : T.dangerBorder}`, borderRadius: "14px", padding: "20px", marginBottom: "16px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "11px", color: T.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>Net Worth</p>
            <p style={{ margin: "8px 0 0", fontSize: "32px", ...S.mono, color: netWorth >= 0 ? T.accent : T.danger, letterSpacing: "-1px" }}>{fmt(netWorth)}</p>
            <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "10px", fontSize: "11px", color: T.textLight }}>
              <span>Assets: <span style={{ ...S.mono, color: T.accent }}>{fmt(totalAssets)}</span></span>
              <span>Debt: <span style={{ ...S.mono, color: T.danger }}>{fmt(totalLiabilities)}</span></span>
            </div>
          </div>
        )}

        {activeTab === "dashboard" && (items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: T.textLight }}>
            <p style={{ fontSize: "40px", margin: "0 0 12px", opacity: 0.4 }}>◆</p>
            <p style={{ fontSize: "16px", fontWeight: "600", color: T.textMuted, margin: "0 0 8px" }}>No items yet</p>
            <p style={{ fontSize: "13px", margin: "0 0 20px" }}>Add income and expenses to start tracking</p>
            <button onClick={() => { resetForm(); setShowForm(true); setActiveTab("items"); }} style={S.greenBtn}>+ Add First Item</button>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              <div style={{ background: T.accentBg, border: `1px solid ${T.accentBorder}`, borderRadius: "14px", padding: "16px" }}>
                <p style={{ margin: 0, fontSize: "11px", color: T.accent, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Income</p>
                <p style={{ margin: "6px 0 0", fontSize: "20px", ...S.mono, color: T.accent }}>{fmt(totalIncome)}</p>
                <p style={{ margin: "2px 0 0", fontSize: "10px", color: T.textLight }}>{viewLabel}</p>
              </div>
              <div style={{ background: T.dangerBg, border: `1px solid ${T.dangerBorder}`, borderRadius: "14px", padding: "16px" }}>
                <p style={{ margin: 0, fontSize: "11px", color: T.danger, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Expenses</p>
                <p style={{ margin: "6px 0 0", fontSize: "20px", ...S.mono, color: T.danger }}>{fmt(totalExpenses)}</p>
                <p style={{ margin: "2px 0 0", fontSize: "10px", color: T.textLight }}>{viewLabel}</p>
              </div>
            </div>

            <div style={{ background: leftover >= 0 ? T.accentBg : T.dangerBg, border: `1px solid ${leftover >= 0 ? T.accentBorder : T.dangerBorder}`, borderRadius: "14px", padding: "20px", marginBottom: "20px", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "11px", color: T.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>Remaining {viewLabel}</p>
              <p style={{ margin: "8px 0 0", fontSize: "32px", ...S.mono, color: leftover >= 0 ? T.accent : T.danger, letterSpacing: "-1px" }}>{fmt(leftover)}</p>
              {leftover > 0 && <p style={{ margin: "8px 0 0", fontSize: "12px", color: T.textLight }}>{fmt(toYr(leftover, view === "fortnightly" ? "fortnightly" : view === "monthly" ? "monthly" : "yearly"))} per year</p>}
            </div>

            {categoryTotals.length > 0 && (
              <div style={S.card}>
                <h3 style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: "600", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Expense Breakdown</h3>
                {categoryTotals.map(cat => (
                  <div key={cat.id} style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ fontSize: "14px" }}>{cat.icon}</span><span style={{ fontSize: "13px", fontWeight: "500" }}>{cat.label}</span></div>
                      <span style={{ fontSize: "13px", ...S.mono, color: cat.color }}>{fmt(cat.total)}</span>
                    </div>
                    <div style={{ height: "6px", background: T.inputBg, borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(cat.total / barMax) * 100}%`, background: `linear-gradient(90deg, ${cat.color}, ${cat.color}bb)`, borderRadius: "3px", transition: "width 0.5s" }} />
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: "10px", color: T.textLight }}>{totalExpenses > 0 ? ((cat.total / totalExpenses) * 100).toFixed(1) : 0}% of expenses</p>
                  </div>
                ))}
              </div>
            )}

            {leftover > 0 && (() => {
              const yr = toYr(leftover, view === "fortnightly" ? "fortnightly" : view === "monthly" ? "monthly" : "yearly");
              const mo = yr / 12; const rate = 0.045;
              const calc = (months) => { let t = 0; for (let m = 0; m < months; m++) t = (t + mo) * (1 + rate / 12); return t; };
              const proj = [{ l: "3 Months", m: 3 }, { l: "6 Months", m: 6 }, { l: "1 Year", m: 12 }, { l: "2 Years", m: 24 }, { l: "3 Years", m: 36 }, { l: "5 Years", m: 60 }];
              const mx = calc(60);
              return (
                <div style={S.card}>
                  <h3 style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: "600", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Savings If You Follow This Budget</h3>
                  <p style={{ margin: "0 0 14px", fontSize: "11px", color: T.textLight }}>Saving entire leftover at 4.5% p.a. compound interest</p>
                  {proj.map(p => { const s = calc(p.m); const c = mo * p.m; const int = s - c; return (
                    <div key={p.l} style={{ marginBottom: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "5px" }}>
                        <span style={{ fontSize: "13px", fontWeight: "500" }}>{p.l}</span>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "15px", ...S.mono, color: T.accent }}>{fmt(s)}</span>
                          {int > 1 && <span style={{ fontSize: "10px", color: "#059669", marginLeft: "6px" }}>+{fmt(int)}</span>}
                        </div>
                      </div>
                      <div style={{ height: "6px", background: T.inputBg, borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${mx > 0 ? (s / mx) * 100 : 0}%`, background: "linear-gradient(90deg, #16a34a, #059669)", borderRadius: "3px", transition: "width 0.5s" }} />
                      </div>
                    </div>
                  ); })}
                </div>
              );
            })()}

            {goals.length > 0 && (
              <div style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Goals Progress</h3>
                  <button onClick={() => setActiveTab("goals")} style={{ background: "none", border: "none", color: T.accent, fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>View All →</button>
                </div>
                {goals.map(g => { const pct = g.target > 0 ? (g.saved / g.target) * 100 : 0; return (
                  <div key={g.id} style={{ marginBottom: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "500" }}>{g.name}</span>
                      <span style={{ fontSize: "12px", ...S.mono, color: g.color }}>{fmt(g.saved)} / {fmt(g.target)}</span>
                    </div>
                    <div style={{ height: "8px", background: T.inputBg, borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg, ${g.color}, ${g.color}bb)`, borderRadius: "4px", transition: "width 0.5s" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                      <span style={{ fontSize: "10px", color: T.textLight }}>{pct.toFixed(1)}%</span>
                      <span style={{ fontSize: "10px", color: T.textLight }}>{fmt(g.target - g.saved)} to go</span>
                    </div>
                  </div>
                ); })}
              </div>
            )}

            <div style={S.card}>
              <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: "600", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Quick Stats</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  { l: "Savings Rate", v: (totalIncome > 0 ? ((leftover / totalIncome) * 100).toFixed(1) : "0") + "%", c: T.accent },
                  { l: "Daily Budget", v: fmt(toYr(leftover, view === "fortnightly" ? "fortnightly" : view === "monthly" ? "monthly" : "yearly") / 365), c: "#d97706" },
                  { l: "Yearly Income", v: fmt(incomeItems.reduce((s, i) => s + toYr(i.amount, i.frequency), 0)), c: "#2563eb" },
                  { l: "Yearly Expenses", v: fmt(expenseItems.reduce((s, i) => s + toYr(i.amount, i.frequency), 0)), c: T.danger },
                ].map(x => (
                  <div key={x.l} style={{ background: T.inputBg, borderRadius: "10px", padding: "12px" }}>
                    <p style={{ margin: 0, fontSize: "10px", color: T.textLight, textTransform: "uppercase" }}>{x.l}</p>
                    <p style={{ margin: "4px 0 0", fontSize: "18px", ...S.mono, color: x.c }}>{x.v}</p>
                  </div>
                ))}
              </div>
            </div>

          </>
        ))}

        {activeTab === "dashboard" && (
          <>
            <div style={S.card}>
              <h3 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: "600", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Settings</h3>
              <div style={{ marginBottom: "14px" }}>
                <label style={S.label}>Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={S.input}>
                  {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              </div>
              <p style={{ margin: "0 0 8px", fontSize: "11px", color: T.textLight, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.3px" }}>Backup</p>
              <p style={{ margin: "0 0 10px", fontSize: "11px", color: T.textLight }}>Your data is saved in this browser only. Export regularly.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <button onClick={handleExport} style={{ padding: "10px", background: T.accentBg, border: `1px solid ${T.accentBorder}`, borderRadius: "10px", color: T.accent, fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>↓ Export backup</button>
                <button onClick={() => fileInputRef.current?.click()} style={{ padding: "10px", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: "10px", color: T.textMuted, fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>↑ Import backup</button>
                <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleImport} style={{ display: "none" }} />
              </div>
              {importMsg && <p style={{ margin: "8px 0 0", fontSize: "11px", color: importMsg.type === "ok" ? T.accent : T.danger }}>{importMsg.text}</p>}
              {saveError && <p style={{ margin: "8px 0 0", fontSize: "11px", color: T.danger }}>⚠ Save failed: {saveError}. Export a backup now.</p>}
            </div>

            {(items.length > 0 || goals.length > 0) && (clearConfirm ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => { setItems([]); setGoals([]); clearStored(); setClearConfirm(false); }} style={{ flex: 1, padding: "12px", background: T.dangerBg, border: `1px solid ${T.dangerBorder}`, borderRadius: "10px", color: T.danger, fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>Yes, erase everything</button>
                <button onClick={() => setClearConfirm(false)} style={{ flex: 1, padding: "12px", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: "10px", color: T.textMuted, fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setClearConfirm(true)} style={{ width: "100%", padding: "12px", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: "10px", color: T.textLight, fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>Clear All Data</button>
            ))}
          </>
        )}

        {/* ITEMS TAB */}
        {activeTab === "items" && (
          <>
            {showForm && (
              <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "14px", padding: "16px", marginBottom: "16px", boxShadow: T.cardShadow }}>
                <h3 style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: "600" }}>{editingId ? "Edit Item" : "Add New Item"}</h3>
                <div style={{ display: "flex", gap: "4px", background: T.toggleBg, borderRadius: "8px", padding: "3px", marginBottom: "12px" }}>
                  <button onClick={() => setFormData({ ...formData, isIncome: false, category: formData.category === "income" ? "other" : formData.category })} style={{ flex: 1, padding: "8px", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", background: !formData.isIncome ? T.dangerBg : "transparent", color: !formData.isIncome ? T.danger : T.textLight }}>Expense</button>
                  <button onClick={() => setFormData({ ...formData, isIncome: true, category: "income" })} style={{ flex: 1, padding: "8px", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", background: formData.isIncome ? T.accentBg : "transparent", color: formData.isIncome ? T.accent : T.textLight }}>Income</button>
                </div>
                <div style={{ marginBottom: "10px" }}><label style={S.label}>Name</label><input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Groceries, Netflix..." style={S.input} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                  <div><label style={S.label}>Amount ($)</label><input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" style={S.input} /></div>
                  <div><label style={S.label}>Frequency</label><select value={formData.frequency} onChange={e => setFormData({ ...formData, frequency: e.target.value })} style={S.input}>{FREQUENCIES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select></div>
                </div>
                {!formData.isIncome && (
                  <div style={{ marginBottom: "14px" }}>
                    <label style={S.label}>Category</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                      {CATEGORIES.filter(c => c.id !== "income").map(c => (
                        <button key={c.id} onClick={() => setFormData({ ...formData, category: c.id })} style={{ padding: "8px 6px", border: formData.category === c.id ? `2px solid ${c.color}` : `1px solid ${T.inputBorder}`, borderRadius: "8px", background: formData.category === c.id ? `${c.color}10` : T.catBtnBg, color: formData.category === c.id ? c.color : T.textMuted, fontSize: "11px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>{c.icon} {c.label}</button>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleSubmit} style={S.greenBtn}>{editingId ? "Update" : "Add"}</button>
                  <button onClick={resetForm} style={S.ghostBtn}>Cancel</button>
                </div>
              </div>
            )}
            {!showForm && <button onClick={() => { resetForm(); setShowForm(true); }} style={{ width: "100%", padding: "14px", marginBottom: "16px", background: T.accentBg, border: `1px dashed ${T.accentBorder}`, borderRadius: "12px", color: T.accent, fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>+ Add New Item</button>}

            {expenseItems.length > 0 && <h3 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: "600", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Expenses ({expenseItems.length})</h3>}
            {CATEGORIES.filter(c => c.id !== "income").map(cat => {
              const ci = expenseItems.filter(i => i.category === cat.id);
              if (ci.length === 0) return null;
              return (
                <div key={cat.id} style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", padding: "6px 0" }}>
                    <span style={{ color: cat.color, fontSize: "12px" }}>{cat.icon}</span>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: cat.color }}>{cat.label}</span>
                    <span style={{ fontSize: "11px", color: T.textLight, marginLeft: "auto", ...S.mono }}>{fmt(ci.reduce((s, i) => s + convert(i.amount, i.frequency), 0))}</span>
                  </div>
                  {ci.map(item => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "10px", marginBottom: "6px", boxShadow: T.cardShadow }}>
                      <div onClick={() => startEdit(item)} style={{ cursor: "pointer", flex: 1 }}>
                        <p style={{ margin: 0, fontSize: "13px", fontWeight: "500" }}>{item.name}</p>
                        <p style={{ margin: "2px 0 0", fontSize: "11px", color: T.textLight }}>{fmt(item.amount)} / {item.frequency}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "14px", ...S.mono, color: T.danger }}>-{fmt(convert(item.amount, item.frequency))}</span>
                        <DelBtn id={item.id} onDel={id => { setItems(p => p.filter(x => x.id !== id)); setDeleteConfirm(null); }} confirm={deleteConfirm} setConfirm={setDeleteConfirm} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {incomeItems.length > 0 && <h3 style={{ margin: "20px 0 10px", fontSize: "13px", fontWeight: "600", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Income ({incomeItems.length})</h3>}
            {incomeItems.map(item => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: T.accentBg, border: `1px solid ${T.accentBorder}`, borderRadius: "10px", marginBottom: "6px" }}>
                <div onClick={() => startEdit(item)} style={{ cursor: "pointer", flex: 1 }}>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: "500" }}>{item.name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "11px", color: T.textLight }}>{fmt(item.amount)} / {item.frequency}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "14px", ...S.mono, color: T.accent }}>+{fmt(convert(item.amount, item.frequency))}</span>
                  <DelBtn id={item.id} onDel={id => { setItems(p => p.filter(x => x.id !== id)); setDeleteConfirm(null); }} confirm={deleteConfirm} setConfirm={setDeleteConfirm} />
                </div>
              </div>
            ))}
          </>
        )}

        {/* ACCOUNTS TAB */}
        {activeTab === "accounts" && (
          <>
            {showAccountForm && (
              <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "14px", padding: "16px", marginBottom: "16px", boxShadow: T.cardShadow }}>
                <h3 style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: "600" }}>{editingAccountId ? "Edit Account" : "Add Account"}</h3>
                <div style={{ marginBottom: "10px" }}>
                  <label style={S.label}>Name</label>
                  <input type="text" value={accountFormData.name} onChange={e => setAccountFormData({ ...accountFormData, name: e.target.value })} placeholder="e.g. Main Checking, Emergency Savings..." style={S.input} />
                </div>
                <div style={{ marginBottom: "10px" }}>
                  <label style={S.label}>Type</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                    {ACCOUNT_TYPES.map(t => (
                      <button key={t.id} onClick={() => setAccountFormData({ ...accountFormData, type: t.id, color: t.color })} style={{ padding: "10px 6px", border: accountFormData.type === t.id ? `2px solid ${t.color}` : `1px solid ${T.inputBorder}`, borderRadius: "8px", background: accountFormData.type === t.id ? `${t.color}10` : T.catBtnBg, color: accountFormData.type === t.id ? t.color : T.textMuted, fontSize: "11px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>{t.icon} {t.label}</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: "10px" }}>
                  <label style={S.label}>Current Balance</label>
                  <input type="number" value={accountFormData.balance} onChange={e => setAccountFormData({ ...accountFormData, balance: e.target.value })} placeholder="0.00" style={S.input} />
                  {ACCOUNT_TYPES.find(t => t.id === accountFormData.type)?.isLiability && <p style={{ margin: "4px 0 0", fontSize: "10px", color: T.textLight }}>Enter the amount owed as a positive number</p>}
                </div>
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: T.textMuted }}>
                    <input type="checkbox" checked={accountFormData.includeInNetWorth} onChange={e => setAccountFormData({ ...accountFormData, includeInNetWorth: e.target.checked })} />
                    Include in net worth
                  </label>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleAccountSubmit} style={S.greenBtn}>{editingAccountId ? "Update" : "Add"}</button>
                  <button onClick={resetAccountForm} style={S.ghostBtn}>Cancel</button>
                </div>
              </div>
            )}
            {!showAccountForm && <button onClick={() => { resetAccountForm(); setShowAccountForm(true); }} style={{ width: "100%", padding: "14px", marginBottom: "16px", background: T.accentBg, border: `1px dashed ${T.accentBorder}`, borderRadius: "12px", color: T.accent, fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>+ Add Account</button>}

            {accounts.length === 0 && !showAccountForm && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: T.textLight }}>
                <p style={{ fontSize: "40px", margin: "0 0 12px", opacity: 0.3 }}>◎</p>
                <p style={{ fontSize: "14px", fontWeight: "600", color: T.textMuted, margin: "0 0 8px" }}>No accounts yet</p>
                <p style={{ fontSize: "13px" }}>Track checking, savings, credit cards, loans — everything that affects your net worth</p>
              </div>
            )}

            {accounts.length > 0 && (
              <div style={{ background: netWorth >= 0 ? T.accentBg : T.dangerBg, border: `1px solid ${netWorth >= 0 ? T.accentBorder : T.dangerBorder}`, borderRadius: "14px", padding: "16px", marginBottom: "16px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "11px", color: T.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Net Worth</p>
                <p style={{ margin: "6px 0 0", fontSize: "26px", ...S.mono, color: netWorth >= 0 ? T.accent : T.danger }}>{fmt(netWorth)}</p>
                <p style={{ margin: "4px 0 0", fontSize: "10px", color: T.textLight }}>{fmt(totalAssets)} assets − {fmt(totalLiabilities)} debt</p>
              </div>
            )}

            {ACCOUNT_TYPES.map(type => {
              const list = accounts.filter(a => a.type === type.id);
              if (list.length === 0) return null;
              const subtotal = list.reduce((s, a) => s + (a.balance || 0), 0);
              return (
                <div key={type.id} style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", padding: "6px 0" }}>
                    <span style={{ color: type.color, fontSize: "12px" }}>{type.icon}</span>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: type.color }}>{type.label}</span>
                    <span style={{ fontSize: "11px", color: T.textLight, marginLeft: "auto", ...S.mono }}>{fmt(subtotal)}</span>
                  </div>
                  {list.map(a => (
                    <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "10px", marginBottom: "6px", boxShadow: T.cardShadow }}>
                      <div onClick={() => startEditAccount(a)} style={{ cursor: "pointer", flex: 1 }}>
                        <p style={{ margin: 0, fontSize: "13px", fontWeight: "500" }}>{a.name}</p>
                        {a.includeInNetWorth === false && <p style={{ margin: "2px 0 0", fontSize: "10px", color: T.textLight }}>Excluded from net worth</p>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "14px", ...S.mono, color: type.isLiability ? T.danger : T.accent }}>{type.isLiability ? "-" : ""}{fmt(a.balance || 0)}</span>
                        <DelBtn id={a.id} onDel={id => { setAccounts(p => p.filter(x => x.id !== id)); setDeleteAccountConfirm(null); }} confirm={deleteAccountConfirm} setConfirm={setDeleteAccountConfirm} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </>
        )}

        {/* GOALS TAB */}
        {activeTab === "goals" && (
          <>
            {showGoalForm && (
              <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "14px", padding: "16px", marginBottom: "16px", boxShadow: T.cardShadow }}>
                <h3 style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: "600" }}>{editingGoalId ? "Edit Goal" : "Add New Goal"}</h3>
                <div style={{ marginBottom: "10px" }}><label style={S.label}>Goal Name</label><input type="text" value={goalFormData.name} onChange={e => setGoalFormData({ ...goalFormData, name: e.target.value })} placeholder="e.g. Emergency Fund..." style={S.input} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                  <div><label style={S.label}>Target ($)</label><input type="number" value={goalFormData.target} onChange={e => setGoalFormData({ ...goalFormData, target: e.target.value })} placeholder="10000" style={S.input} /></div>
                  <div><label style={S.label}>Already Saved ($)</label><input type="number" value={goalFormData.saved} onChange={e => setGoalFormData({ ...goalFormData, saved: e.target.value })} placeholder="0" style={S.input} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                  <div><label style={S.label}>Monthly Saving ($)</label><input type="number" value={goalFormData.monthlySaving} onChange={e => setGoalFormData({ ...goalFormData, monthlySaving: e.target.value })} placeholder="200" style={S.input} /></div>
                  <div><label style={S.label}>Target Date</label><input type="date" value={goalFormData.deadline} onChange={e => setGoalFormData({ ...goalFormData, deadline: e.target.value })} style={S.input} /></div>
                </div>
                <div style={{ marginBottom: "14px" }}>
                  <label style={S.label}>Color</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {["#16a34a", "#2563eb", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#db2777", "#059669"].map(c => (
                      <button key={c} onClick={() => setGoalFormData({ ...goalFormData, color: c })} style={{ width: "32px", height: "32px", borderRadius: "8px", background: c, border: goalFormData.color === c ? `3px solid ${T.text}` : "3px solid transparent", cursor: "pointer" }} />
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleGoalSubmit} style={S.greenBtn}>{editingGoalId ? "Update" : "Add Goal"}</button>
                  <button onClick={resetGoalForm} style={S.ghostBtn}>Cancel</button>
                </div>
              </div>
            )}
            {!showGoalForm && <button onClick={() => { resetGoalForm(); setShowGoalForm(true); }} style={{ width: "100%", padding: "14px", marginBottom: "16px", background: T.accentBg, border: `1px dashed ${T.accentBorder}`, borderRadius: "12px", color: T.accent, fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>+ Add New Goal</button>}

            {goals.length === 0 && !showGoalForm && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: T.textLight }}>
                <p style={{ fontSize: "40px", margin: "0 0 12px", opacity: 0.3 }}>◆</p>
                <p style={{ fontSize: "14px", fontWeight: "600", color: T.textMuted, margin: "0 0 8px" }}>No goals yet</p>
                <p style={{ fontSize: "13px" }}>Set targets like emergency fund, car deposit, or holiday savings</p>
              </div>
            )}

            {goals.map(goal => {
              const pct = goal.target > 0 ? (goal.saved / goal.target) * 100 : 0;
              const remaining = goal.target - goal.saved;
              const rate = 0.045;
              const monthsToGoal = goal.monthlySaving > 0 ? (() => { let t = goal.saved; for (let m = 1; m <= 360; m++) { t = (t + goal.monthlySaving) * (1 + rate / 12); if (t >= goal.target) return m; } return null; })() : null;

              return (
                <div key={goal.id} style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "14px", padding: "16px", marginBottom: "12px", boxShadow: T.cardShadow }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "600" }}>{goal.name}</h4>
                      {goal.monthlySaving > 0 && <p style={{ margin: "4px 0 0", fontSize: "11px", color: T.textLight }}>Saving {fmt(goal.monthlySaving)}/month</p>}
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => startEditGoal(goal)} style={{ padding: "4px 10px", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: "6px", color: T.textMuted, fontSize: "11px", cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
                      <DelBtn id={goal.id} onDel={id => { setGoals(p => p.filter(x => x.id !== id)); setDeleteGoalConfirm(null); }} confirm={deleteGoalConfirm} setConfirm={setDeleteGoalConfirm} />
                    </div>
                  </div>

                  <div style={{ textAlign: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "28px", ...S.mono, color: goal.color }}>{fmt(goal.saved)}</span>
                    <span style={{ fontSize: "14px", color: T.textLight }}> / {fmt(goal.target)}</span>
                  </div>

                  <div style={{ height: "10px", background: T.inputBg, borderRadius: "5px", overflow: "hidden", marginBottom: "12px" }}>
                    <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg, ${goal.color}, ${goal.color}bb)`, borderRadius: "5px", transition: "width 0.5s" }} />
                  </div>

                  <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
                    {[50, 100, 200, 500].map(amt => (
                      <button key={amt} onClick={() => setGoals(p => p.map(g => g.id === goal.id ? { ...g, saved: Math.min(g.saved + amt, g.target) } : g))} disabled={goal.saved >= goal.target} style={{ padding: "6px 12px", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: "8px", color: goal.saved >= goal.target ? T.inputBorder : T.textMuted, fontSize: "12px", fontWeight: "600", cursor: goal.saved >= goal.target ? "default" : "pointer", fontFamily: "inherit" }}>+${amt}</button>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <div style={{ background: T.inputBg, borderRadius: "8px", padding: "10px" }}>
                      <p style={{ margin: 0, fontSize: "10px", color: T.textLight, textTransform: "uppercase" }}>{pct >= 100 ? "Status" : "Remaining"}</p>
                      <p style={{ margin: "4px 0 0", fontSize: "14px", ...S.mono, color: pct >= 100 ? T.accent : goal.color }}>{pct >= 100 ? "✓ Complete" : fmt(remaining)}</p>
                    </div>
                    <div style={{ background: T.inputBg, borderRadius: "8px", padding: "10px" }}>
                      <p style={{ margin: 0, fontSize: "10px", color: T.textLight, textTransform: "uppercase" }}>{monthsToGoal ? "ETA" : "Progress"}</p>
                      <p style={{ margin: "4px 0 0", fontSize: "14px", ...S.mono, color: goal.color }}>{monthsToGoal ? `${Math.floor(monthsToGoal / 12)}yr ${monthsToGoal % 12}mo` : `${pct.toFixed(1)}%`}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
