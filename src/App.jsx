import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { SCHEMA_VERSION, CATEGORIES, FREQUENCIES, CURRENCIES, DEFAULT_CURRENCY, ACCOUNT_TYPES } from "./lib/constants.js";
import { loadStored, saveStored, clearStored } from "./lib/storage.js";
import { toYr, convertBy, advanceDue, rollForwardDue, daysUntil } from "./lib/calc.js";
import { makeFmt } from "./lib/format.js";
import { parseCSV, detectColumns, rowsToTransactions } from "./lib/csv.js";
import { detectSubscriptions, detectRecurringIncome, guessCategoryFromDescription } from "./lib/subscriptions.js";
import { BANK_PRESETS } from "./lib/bankPresets.js";
import { computeCoach, generateInsights, scoreLabel } from "./lib/coach.js";
import { askGemini, buildFinancialContext, getStoredKey, storeKey } from "./lib/ai.js";
import { hashPin, getStoredPinHash, storePinHash } from "./lib/pin.js";

export default function BudgetApp() {
  const [items, setItems] = useState([]);
  const [goals, setGoals] = useState([]);
  const [view, setView] = useState("fortnightly");
  const [showForm, setShowForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [formData, setFormData] = useState({ name: "", amount: "", frequency: "monthly", category: "other", isIncome: false, dueDate: "" });
  const [goalFormData, setGoalFormData] = useState({ name: "", target: "", saved: "0", monthlySaving: "", deadline: "", color: "#16a34a" });
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteGoalConfirm, setDeleteGoalConfirm] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });
  const [darkModeAuto, setDarkModeAuto] = useState(true);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const showToast = (text, type = "ok", action = null) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ text, type, action, id: Date.now() });
    toastTimerRef.current = setTimeout(() => setToast(null), action ? 8000 : 3000);
  };
  const snapshotState = () => ({
    items: [...items],
    goals: [...goals],
    accounts: [...accounts],
    transactions: [...transactions],
    categoryBudgets: { ...categoryBudgets },
  });
  const restoreSnapshot = (s) => {
    setItems(s.items);
    setGoals(s.goals);
    setAccounts(s.accounts);
    setTransactions(s.transactions);
    setCategoryBudgets(s.categoryBudgets);
  };
  const [accounts, setAccounts] = useState([]);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [accountFormData, setAccountFormData] = useState({ name: "", type: "checking", balance: "", color: "#2563eb", includeInNetWorth: true });
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showTxnForm, setShowTxnForm] = useState(false);
  const [editingTxnId, setEditingTxnId] = useState(null);
  const [txnFormData, setTxnFormData] = useState({ accountId: "", amount: "", category: "other", date: new Date().toISOString().slice(0, 10), note: "", isIncome: false, isTransfer: false, fromAccountId: "", toAccountId: "", splits: [], tags: "" });
  const [deleteTxnConfirm, setDeleteTxnConfirm] = useState(null);
  const [txnFilterAccount, setTxnFilterAccount] = useState("all");
  const [txnFilterCategory, setTxnFilterCategory] = useState("all");
  const [csvState, setCsvState] = useState(null);
  const [detectedSubs, setDetectedSubs] = useState(null);
  const [selectedSubIds, setSelectedSubIds] = useState(new Set());
  const csvFileRef = useRef(null);
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [showBudgetEditor, setShowBudgetEditor] = useState(false);
  const [netWorthHistory, setNetWorthHistory] = useState([]);
  const [clearTxnsConfirm, setClearTxnsConfirm] = useState(false);
  const [collapsedMonths, setCollapsedMonths] = useState(new Set());
  const [txnSearch, setTxnSearch] = useState("");
  const [aiKey, setAiKey] = useState(() => getStoredKey());
  const [aiKeyDraft, setAiKeyDraft] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [pinHash, setPinHash] = useState(() => getStoredPinHash());
  const [unlocked, setUnlocked] = useState(() => !getStoredPinHash());
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinDraft, setPinDraft] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
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
      if (Array.isArray(d.transactions)) setTransactions(d.transactions);
      if (d.categoryBudgets && typeof d.categoryBudgets === "object") setCategoryBudgets(d.categoryBudgets);
      if (Array.isArray(d.netWorthHistory)) setNetWorthHistory(d.netWorthHistory);
      if (d.view) setView(d.view);
      if (d.darkModeAuto !== undefined) setDarkModeAuto(d.darkModeAuto);
      if (d.darkMode !== undefined && d.darkModeAuto === false) setDarkMode(d.darkMode);
      if (d.currency && CURRENCIES.some((c) => c.code === d.currency)) setCurrency(d.currency);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (accounts.length === 0) return;
    const nw = accounts.filter(a => a.includeInNetWorth !== false).reduce((s, a) => {
      const t = ACCOUNT_TYPES.find(t => t.id === a.type);
      const sign = t && t.isLiability ? -1 : 1;
      return s + (a.balance || 0) * sign;
    }, 0);
    const today = new Date().toISOString().slice(0, 10);
    setNetWorthHistory(prev => {
      const last = prev[prev.length - 1];
      if (last && last.date === today) {
        if (Math.abs(last.value - nw) < 0.005) return prev;
        return [...prev.slice(0, -1), { date: today, value: nw }];
      }
      const trimmed = prev.length > 365 ? prev.slice(-365) : prev;
      return [...trimmed, { date: today, value: nw }];
    });
  }, [loaded, accounts]);

  useEffect(() => {
    if (!darkModeAuto || typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setDarkMode(e.matches);
    setDarkMode(mq.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [darkModeAuto]);

  useEffect(() => {
    if (!loaded) return;
    const r = saveStored({ items, goals, accounts, transactions, categoryBudgets, netWorthHistory, view, darkMode, darkModeAuto, currency });
    setSaveError(r.ok ? null : r.error);
  }, [items, goals, accounts, transactions, categoryBudgets, netWorthHistory, view, darkMode, darkModeAuto, currency, loaded]);

  const handleExport = () => {
    const payload = { version: SCHEMA_VERSION, exportedAt: new Date().toISOString(), items, goals, accounts, transactions, categoryBudgets, view, darkMode, currency };
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
        if (!Array.isArray(d.items) && !Array.isArray(d.goals) && !Array.isArray(d.accounts) && !Array.isArray(d.transactions)) throw new Error("Not a valid backup file");
        if (Array.isArray(d.items)) setItems(d.items);
        if (Array.isArray(d.goals)) setGoals(d.goals);
        if (Array.isArray(d.accounts)) setAccounts(d.accounts);
        if (Array.isArray(d.transactions)) setTransactions(d.transactions);
        if (d.categoryBudgets && typeof d.categoryBudgets === "object") setCategoryBudgets(d.categoryBudgets);
      if (Array.isArray(d.netWorthHistory)) setNetWorthHistory(d.netWorthHistory);
        if (d.view) setView(d.view);
        if (d.darkMode !== undefined) setDarkMode(d.darkMode);
        if (d.currency && CURRENCIES.some((c) => c.code === d.currency)) setCurrency(d.currency);
        setImportMsg({ type: "ok", text: `Imported ${(d.items || []).length} items, ${(d.goals || []).length} goals, ${(d.accounts || []).length} accounts, ${(d.transactions || []).length} transactions` });
      } catch (err) {
        setImportMsg({ type: "err", text: `Import failed: ${err.message}` });
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setImportMsg(null), 4000);
    };
    reader.readAsText(file);
  };

  const convert = useCallback(convertBy(view), [view]);

  const incomeItems = items.filter(i => i.isIncome && !i.cancelled);
  const expenseItems = items.filter(i => !i.isIncome && !i.cancelled);
  const cancelledItems = items.filter(i => i.cancelled);
  const totalIncome = incomeItems.reduce((s, i) => s + convert(i.amount, i.frequency), 0);
  const totalExpenses = expenseItems.reduce((s, i) => s + convert(i.amount, i.frequency), 0);
  const leftover = totalIncome - totalExpenses;
  const categoryTotals = CATEGORIES.filter(c => c.id !== "income").map(cat => ({ ...cat, total: expenseItems.filter(i => i.category === cat.id).reduce((s, i) => s + convert(i.amount, i.frequency), 0) })).filter(c => c.total > 0);

  const resetForm = () => { setFormData({ name: "", amount: "", frequency: "monthly", category: "other", isIncome: false, dueDate: "" }); setEditingId(null); setShowForm(false); };
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

  const resetTxnForm = () => { setTxnFormData({ accountId: accounts[0]?.id || "", amount: "", category: "other", date: new Date().toISOString().slice(0, 10), note: "", isIncome: false, isTransfer: false, fromAccountId: accounts[0]?.id || "", toAccountId: accounts[1]?.id || "", splits: [], tags: "" }); setEditingTxnId(null); setShowTxnForm(false); };

  const handleCsvFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows = parseCSV(ev.target.result);
        if (rows.length < 2) throw new Error("CSV has no data rows");
        const preferred = "DMY";
        const map = detectColumns(rows, preferred);
        setCsvState({ rows, map, preferred, accountId: accounts[0]?.id || "", fileName: file.name });
      } catch (err) {
        setImportMsg({ type: "err", text: `CSV parse failed: ${err.message}` });
        setTimeout(() => setImportMsg(null), 4000);
      }
      if (csvFileRef.current) csvFileRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const csvImport = () => {
    if (!csvState) return;
    const txns = rowsToTransactions(csvState.rows, csvState.map, csvState.preferred).map((t) => ({
      ...t,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      accountId: csvState.accountId,
      category: t.isIncome ? "income" : guessCategoryFromDescription(t.note),
    }));
    if (txns.length === 0) {
      setImportMsg({ type: "err", text: "No valid rows found — check column mapping" });
      setTimeout(() => setImportMsg(null), 4000);
      return;
    }
    setTransactions((p) => [...p, ...txns]);
    setImportMsg({ type: "ok", text: `Imported ${txns.length} transactions` });
    setTimeout(() => setImportMsg(null), 4000);
    setCsvState(null);
    const all = [...transactions, ...txns];
    const subs = detectSubscriptions(all);
    if (subs.length > 0) {
      setDetectedSubs(subs);
      setSelectedSubIds(new Set(subs.map((s) => s.id)));
    }
  };

  const runDetectSubs = () => {
    const subs = detectSubscriptions(transactions);
    const incomes = detectRecurringIncome(transactions);
    const all = [...incomes, ...subs];
    setDetectedSubs(all);
    setSelectedSubIds(new Set(all.map((s) => s.id)));
  };

  const tryUnlock = async () => {
    if (pinInput.length < 4) return;
    const h = await hashPin(pinInput);
    if (h === pinHash) { setUnlocked(true); setPinInput(""); setPinError(""); }
    else { setPinError("Wrong PIN"); setPinInput(""); }
  };
  const savePin = async () => {
    if (!pinDraft || pinDraft.length < 4 || pinDraft !== pinConfirm) { showToast("PINs don't match or too short (4+ digits)", "err"); return; }
    const h = await hashPin(pinDraft);
    storePinHash(h);
    setPinHash(h);
    setPinDraft(""); setPinConfirm("");
    showToast("PIN set", "ok");
  };
  const removePin = () => {
    storePinHash("");
    setPinHash("");
    showToast("PIN removed", "ok");
  };

  const saveAiKey = () => {
    const k = aiKeyDraft.trim();
    storeKey(k);
    setAiKey(k);
    setAiKeyDraft("");
  };

  const sendChatMessage = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    if (!aiKey) { setChatError("Set your Gemini API key in Settings first."); return; }
    setChatError(null);
    const historyForApi = chatMessages.slice();
    const newUser = { role: "user", text: msg };
    setChatMessages((p) => [...p, newUser]);
    setChatInput("");
    setChatLoading(true);
    try {
      const coachData = computeCoach({ items, goals, accounts, transactions, categoryBudgets });
      const context = buildFinancialContext({ items, goals, accounts, transactions, categoryBudgets, currency }, coachData);
      const reply = await askGemini({ apiKey: aiKey, context, history: historyForApi, userMessage: msg });
      setChatMessages((p) => [...p, { role: "assistant", text: reply }]);
    } catch (e) {
      setChatError(e.message || "Something went wrong");
    } finally {
      setChatLoading(false);
    }
  };

  const updateDetectedSub = (id, patch) => {
    setDetectedSubs((p) => p ? p.map((s) => s.id === id ? { ...s, ...patch } : s) : p);
  };

  const addSelectedSubs = () => {
    if (!detectedSubs) return;
    const existing = new Set(items.map((i) => (i.name || "").toLowerCase()));
    const toAdd = detectedSubs
      .filter((s) => selectedSubIds.has(s.id))
      .filter((s) => !existing.has(s.displayName.toLowerCase()))
      .map((s) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: s.displayName,
        amount: s.amount,
        frequency: s.frequency,
        category: s.isIncome ? "income" : s.category,
        isIncome: !!s.isIncome,
        dueDate: s.isIncome ? "" : (s.lastDate || ""),
      }));
    if (toAdd.length > 0) setItems((p) => [...p, ...toAdd]);
    setImportMsg({ type: "ok", text: `Added ${toAdd.length} recurring items to Budget` });
    setTimeout(() => setImportMsg(null), 4000);
    setDetectedSubs(null);
    setSelectedSubIds(new Set());
  };

  const handleTxnSubmit = () => {
    if (!txnFormData.amount || !txnFormData.date) return;
    const amt = parseFloat(txnFormData.amount);
    if (!isFinite(amt) || amt < 0) return;
    if (txnFormData.isTransfer) {
      if (!txnFormData.fromAccountId || !txnFormData.toAccountId || txnFormData.fromAccountId === txnFormData.toAccountId) return;
    }
    const splits = (txnFormData.splits || []).filter(s => s.amount && parseFloat(s.amount) > 0);
    if (splits.length > 0) {
      const sum = splits.reduce((s, x) => s + parseFloat(x.amount || 0), 0);
      if (Math.abs(sum - amt) > 0.01) { showToast("Split amounts must total " + amt.toFixed(2), "err"); return; }
    }
    const tags = (txnFormData.tags || "").split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
    const clean = { ...txnFormData, amount: amt, note: txnFormData.note.trim(), tags, splits: splits.map(s => ({ category: s.category, amount: parseFloat(s.amount) })) };
    if (editingTxnId) setTransactions(p => p.map(t => t.id === editingTxnId ? { ...t, ...clean } : t));
    else setTransactions(p => [...p, { ...clean, id: Date.now().toString() }]);
    resetTxnForm();
  };

  const startEditTxn = (t) => {
    setTxnFormData({
      accountId: t.accountId || "",
      amount: t.amount.toString(),
      category: t.category || "other",
      date: t.date || new Date().toISOString().slice(0, 10),
      note: t.note || "",
      isIncome: !!t.isIncome,
      isTransfer: !!t.isTransfer,
      fromAccountId: t.fromAccountId || "",
      toAccountId: t.toAccountId || "",
      splits: (t.splits || []).map(s => ({ category: s.category, amount: s.amount.toString() })),
      tags: (t.tags || []).join(", "),
    });
    setEditingTxnId(t.id);
    setShowTxnForm(true);
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

  const startEdit = (item) => { setFormData({ name: item.name, amount: item.amount.toString(), frequency: item.frequency, category: item.category, isIncome: item.isIncome, dueDate: item.dueDate || "" }); setEditingId(item.id); setShowForm(true); setActiveTab("items"); };
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

  const fabAction = () => {
    if (activeTab === "transactions") { resetTxnForm(); setShowTxnForm(true); }
    else if (activeTab === "accounts") { resetAccountForm(); setShowAccountForm(true); }
    else if (activeTab === "goals") { resetGoalForm(); setShowGoalForm(true); }
    else { resetForm(); setShowForm(true); setActiveTab("items"); }
  };
  const fabVisible = ["dashboard", "items", "accounts", "transactions", "goals"].includes(activeTab) && !showForm && !showGoalForm && !showAccountForm && !showTxnForm && !csvState && !detectedSubs;

  if (pinHash && !unlocked) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
        <div style={{ textAlign: "center", maxWidth: "360px", width: "100%" }}>
          <p style={{ fontSize: "40px", margin: "0 0 10px", opacity: 0.5 }}>🔒</p>
          <h2 style={{ fontSize: "18px", fontWeight: "600", margin: "0 0 6px" }}>Budget Tracker</h2>
          <p style={{ fontSize: "13px", color: T.textMuted, margin: "0 0 24px" }}>Enter your PIN to unlock</p>
          <input type="password" inputMode="numeric" pattern="[0-9]*" value={pinInput} onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, "").slice(0, 8)); setPinError(""); }} onKeyDown={(e) => { if (e.key === "Enter") tryUnlock(); }} placeholder="••••" autoFocus style={{ ...S.input, textAlign: "center", fontSize: "24px", letterSpacing: "8px", padding: "16px", marginBottom: "10px" }} />
          {pinError && <p style={{ margin: "0 0 10px", fontSize: "12px", color: T.danger }}>{pinError}</p>}
          <button onClick={tryUnlock} style={{ ...S.greenBtn, width: "100%" }}>Unlock</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {toast && (
        <div className="toast" style={{ position: "fixed", top: "16px", left: "50%", transform: "translateX(-50%)", zIndex: 1000, padding: "10px 18px", background: toast.type === "err" ? T.danger : T.accent, color: "#fff", borderRadius: "999px", fontSize: "13px", fontWeight: "600", boxShadow: "0 4px 16px rgba(0,0,0,0.2)", maxWidth: "90vw", display: "flex", alignItems: "center", gap: "10px" }}>
          <span>{toast.text}</span>
          {toast.action && (
            <button onClick={() => { toast.action.fn(); setToast(null); }} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>{toast.action.label}</button>
          )}
        </div>
      )}

      {fabVisible && (
        <button className="fab" onClick={fabAction} title="Quick add" style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 900, width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff", border: "none", fontSize: "28px", fontWeight: "300", cursor: "pointer", boxShadow: "0 4px 20px rgba(22,163,74,0.4)", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>+</button>
      )}

      {/* HEADER */}
      <div style={{ padding: "24px 20px 16px", borderBottom: `1px solid ${T.tabBorder}`, background: T.headerBg }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "700", margin: 0, letterSpacing: "-0.5px", color: T.text }}>Budget Tracker</h1>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: T.textLight }}>{items.length === 0 ? "Add items to get started" : `${items.length} items · ${goals.length} goals`}</p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={() => setActiveTab(activeTab === "settings" ? "dashboard" : "settings")} style={{ background: activeTab === "settings" ? T.accentBg : T.toggleBg, border: `1px solid ${activeTab === "settings" ? T.accentBorder : T.inputBorder}`, color: activeTab === "settings" ? T.accent : T.textMuted, padding: "8px 10px", borderRadius: "10px", fontSize: "16px", cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }} title="Settings">⚙</button>
            <button onClick={() => { setDarkModeAuto(false); setDarkMode(!darkMode); }} style={{ background: T.toggleBg, border: `1px solid ${T.inputBorder}`, color: T.textMuted, padding: "8px 10px", borderRadius: "10px", fontSize: "16px", cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }} title={darkMode ? "Light mode" : "Dark mode"}>{darkMode ? "☀" : "☾"}</button>
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
          { id: "transactions", label: "Activity" },
          { id: "goals", label: "Goals" },
          { id: "coach", label: "Coach" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: "12px 6px", border: "none", borderBottom: activeTab === tab.id ? `2px solid ${T.accent}` : "2px solid transparent", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", background: "transparent", color: activeTab === tab.id ? T.accent : T.textLight }}>{tab.label}</button>
        ))}
      </div>

      <div style={{ padding: "16px 20px 120px" }}>

        {/* DASHBOARD */}
        {activeTab === "dashboard" && accounts.length > 0 && (() => {
          const liquidTypes = ["checking", "savings", "cash"];
          const liquid = accounts.filter(a => liquidTypes.includes(a.type)).reduce((s, a) => s + (a.balance || 0), 0);
          const windowDays = view === "fortnightly" ? 14 : view === "monthly" ? 30 : 365;
          const upcomingBills = items
            .filter(i => !i.isIncome && !i.cancelled && i.dueDate)
            .map(i => ({ ...i, dueDate: rollForwardDue(i.dueDate, i.frequency), days: 0 }))
            .map(i => ({ ...i, days: daysUntil(i.dueDate) }))
            .filter(i => i.days !== null && i.days >= 0 && i.days <= windowDays);
          const billsTotal = upcomingBills.reduce((s, b) => s + (b.amount || 0), 0);
          const safe = liquid - billsTotal;
          const perDay = windowDays > 0 ? safe / windowDays : 0;
          return (
            <>
              <div style={{ background: netWorth >= 0 ? T.accentBg : T.dangerBg, border: `1px solid ${netWorth >= 0 ? T.accentBorder : T.dangerBorder}`, borderRadius: "14px", padding: "16px", marginBottom: "10px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "11px", color: T.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>Net Worth</p>
                <p style={{ margin: "6px 0 0", fontSize: "26px", ...S.mono, color: netWorth >= 0 ? T.accent : T.danger }}>{fmt(netWorth)}</p>
                <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "6px", fontSize: "10px", color: T.textLight }}>
                  <span>Assets: <span style={{ ...S.mono, color: T.accent }}>{fmt(totalAssets)}</span></span>
                  <span>Debt: <span style={{ ...S.mono, color: T.danger }}>{fmt(totalLiabilities)}</span></span>
                </div>
              </div>
              {liquid > 0 && (
                <div style={{ background: safe >= 0 ? T.accentBg : T.dangerBg, border: `1px solid ${safe >= 0 ? T.accentBorder : T.dangerBorder}`, borderRadius: "14px", padding: "20px", marginBottom: "16px", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: "11px", color: T.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>Safe to Spend · next {windowDays} days</p>
                  <p style={{ margin: "8px 0 0", fontSize: "32px", ...S.mono, color: safe >= 0 ? T.accent : T.danger, letterSpacing: "-1px" }}>{fmt(safe)}</p>
                  <p style={{ margin: "4px 0 0", fontSize: "11px", color: T.textLight }}>{fmt(perDay)} per day</p>
                  {billsTotal > 0 && <p style={{ margin: "6px 0 0", fontSize: "10px", color: T.textLight }}>{fmt(liquid)} available − {fmt(billsTotal)} upcoming bills</p>}
                </div>
              )}
            </>
          );
        })()}

        {activeTab === "dashboard" && (items.length === 0 && accounts.length === 0 && transactions.length === 0 ? (
          <div style={{ padding: "20px 8px" }}>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <p style={{ fontSize: "36px", margin: "0 0 10px" }}>◆</p>
              <h2 style={{ fontSize: "20px", fontWeight: "700", margin: "0 0 6px", color: T.text }}>Welcome to Budget Tracker</h2>
              <p style={{ fontSize: "13px", color: T.textMuted, margin: 0 }}>Takes ~2 minutes to set up. Your data stays on this device.</p>
            </div>
            {[
              { num: "1", title: "Pick your currency", desc: `Currently ${currency}. Change in Settings.`, action: () => setActiveTab("settings"), cta: "Open Settings" },
              { num: "2", title: "Add your income", desc: "Your salary, side hustle, etc. — at least one income item.", action: () => { resetForm(); setFormData({ ...formData, isIncome: true, category: "income" }); setShowForm(true); setActiveTab("items"); }, cta: "+ Add income" },
              { num: "3", title: "Add recurring expenses", desc: "Rent, subscriptions, bills. Or skip and import a bank CSV later.", action: () => { resetForm(); setShowForm(true); setActiveTab("items"); }, cta: "+ Add expense" },
              { num: "4", title: "Track your accounts", desc: "Bank, savings, credit cards — unlocks net worth and safe-to-spend.", action: () => { resetAccountForm(); setShowAccountForm(true); setActiveTab("accounts"); }, cta: "+ Add account" },
              { num: "5", title: "Import bank statements", desc: "Drop a CSV — auto-categorizes and detects your subscriptions.", action: () => { setActiveTab("transactions"); }, cta: "Open Activity" },
            ].map((step) => (
              <div key={step.num} style={{ display: "flex", gap: "14px", padding: "14px", background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "12px", marginBottom: "10px", boxShadow: T.cardShadow }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: T.accentBg, border: `1px solid ${T.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent, fontSize: "14px", fontWeight: "700", flexShrink: 0 }}>{step.num}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: T.text }}>{step.title}</p>
                  <p style={{ margin: "2px 0 8px", fontSize: "12px", color: T.textLight }}>{step.desc}</p>
                  <button onClick={step.action} style={{ padding: "6px 12px", background: T.accentBg, border: `1px solid ${T.accentBorder}`, borderRadius: "8px", color: T.accent, fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>{step.cta} →</button>
                </div>
              </div>
            ))}
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

            {(() => {
              const billsWithDue = items
                .filter(i => !i.isIncome && !i.cancelled && i.dueDate)
                .map(i => ({ ...i, dueDate: rollForwardDue(i.dueDate, i.frequency) }))
                .map(i => ({ ...i, days: daysUntil(i.dueDate) }))
                .filter(i => i.days !== null && i.days <= 30)
                .sort((a, b) => a.days - b.days)
                .slice(0, 6);
              if (billsWithDue.length === 0) return null;
              const totalDue = billsWithDue.reduce((s, b) => s + (b.amount || 0), 0);
              return (
                <div style={S.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h3 style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Upcoming Bills</h3>
                    <span style={{ fontSize: "12px", ...S.mono, color: T.danger }}>{fmt(totalDue)}</span>
                  </div>
                  {billsWithDue.map(b => {
                    const cat = CATEGORIES.find(c => c.id === b.category) || { color: T.textMuted, icon: "•" };
                    const overdue = b.days < 0;
                    const soon = b.days >= 0 && b.days <= 3;
                    const label = overdue ? `${Math.abs(b.days)}d overdue` : b.days === 0 ? "Today" : b.days === 1 ? "Tomorrow" : `in ${b.days}d`;
                    return (
                      <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: overdue ? T.dangerBg : soon ? T.inputBg : "transparent", border: `1px solid ${overdue ? T.dangerBorder : T.inputBorder}`, borderRadius: "8px", marginBottom: "6px" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ color: cat.color, fontSize: "12px" }}>{cat.icon}</span>
                            <span style={{ fontSize: "13px", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</span>
                          </div>
                          <p style={{ margin: "2px 0 0 18px", fontSize: "10px", color: overdue ? T.danger : T.textLight }}>{b.dueDate} · {label}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "13px", ...S.mono, color: T.danger }}>{fmt(b.amount)}</span>
                          <button onClick={() => {
                            setItems(p => p.map(x => x.id === b.id ? { ...x, dueDate: advanceDue(b.dueDate, b.frequency) } : x));
                          }} style={{ padding: "4px 8px", background: T.accentBg, border: `1px solid ${T.accentBorder}`, borderRadius: "6px", color: T.accent, fontSize: "11px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>Paid</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {(() => {
              const now = new Date();
              const dayOfMonth = now.getDate();
              const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
              const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
              const monthTxns = transactions.filter(t => !t.isIncome && !t.isTransfer && (t.date || "").slice(0, 7) === ym);
              const alerts = [];
              for (const [catId, budget] of Object.entries(categoryBudgets)) {
                if (!budget || budget <= 0) continue;
                const spent = monthTxns.filter(t => t.category === catId).reduce((s, t) => s + (t.amount || 0), 0);
                if (spent === 0) continue;
                const pace = (spent / dayOfMonth) * daysInMonth;
                if (pace > budget * 1.1) {
                  const overBy = pace - budget;
                  const cat = CATEGORIES.find(c => c.id === catId) || { label: catId, icon: "•", color: T.danger };
                  const runoutDay = Math.ceil((budget / spent) * dayOfMonth);
                  alerts.push({ cat, budget, spent, pace, overBy, runoutDay, pct: (spent / budget) * 100 });
                }
              }
              if (alerts.length === 0) return null;
              return (
                <div style={S.card}>
                  <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: "600", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>⚠ Spending velocity</h3>
                  {alerts.map((a, i) => (
                    <div key={i} style={{ background: T.dangerBg, border: `1px solid ${T.dangerBorder}`, borderRadius: "10px", padding: "10px 12px", marginBottom: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <span style={{ color: a.cat.color, fontSize: "12px" }}>{a.cat.icon}</span>
                        <span style={{ fontSize: "13px", fontWeight: "600" }}>{a.cat.label}</span>
                      </div>
                      <p style={{ margin: "0 0 0 18px", fontSize: "11px", color: T.text, lineHeight: 1.5 }}>At current pace you'll spend <span style={{ ...S.mono, color: T.danger }}>{fmt(a.pace)}</span> — {fmt(a.overBy)} over budget. {a.runoutDay <= daysInMonth ? `Budget runs out on day ${a.runoutDay}.` : ""}</p>
                    </div>
                  ))}
                </div>
              );
            })()}

            {(() => {
              const now = new Date();
              const thisYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
              const lastYrYm = `${now.getFullYear() - 1}-${String(now.getMonth() + 1).padStart(2, "0")}`;
              const thisSpend = transactions.filter(t => !t.isIncome && !t.isTransfer && (t.date || "").slice(0, 7) === thisYm).reduce((s, t) => s + (t.amount || 0), 0);
              const lastSpend = transactions.filter(t => !t.isIncome && !t.isTransfer && (t.date || "").slice(0, 7) === lastYrYm).reduce((s, t) => s + (t.amount || 0), 0);
              if (lastSpend === 0) return null;
              const diff = thisSpend - lastSpend;
              const pct = (diff / lastSpend) * 100;
              const monthName = now.toLocaleDateString(undefined, { month: "long" });
              return (
                <div style={S.card}>
                  <h3 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: "600", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{monthName} · Year-over-Year</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <div style={{ background: T.inputBg, borderRadius: "10px", padding: "10px" }}>
                      <p style={{ margin: 0, fontSize: "10px", color: T.textLight, textTransform: "uppercase" }}>This {monthName}</p>
                      <p style={{ margin: "4px 0 0", fontSize: "15px", ...S.mono, color: T.text }}>{fmt(thisSpend)}</p>
                    </div>
                    <div style={{ background: T.inputBg, borderRadius: "10px", padding: "10px" }}>
                      <p style={{ margin: 0, fontSize: "10px", color: T.textLight, textTransform: "uppercase" }}>Last year</p>
                      <p style={{ margin: "4px 0 0", fontSize: "15px", ...S.mono, color: T.textMuted }}>{fmt(lastSpend)}</p>
                    </div>
                  </div>
                  <p style={{ margin: "10px 0 0", fontSize: "12px", color: diff > 0 ? T.danger : T.accent, textAlign: "center", ...S.mono }}>{diff >= 0 ? "↑" : "↓"} {fmt(Math.abs(diff))} ({pct >= 0 ? "+" : ""}{pct.toFixed(1)}%)</p>
                </div>
              );
            })()}

            {(() => {
              if (transactions.length < 5) return null;
              const now = new Date();
              const months = [];
              for (let i = 1; i <= 3; i++) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
              }
              const perMonth = months.map(ym => transactions.filter(t => !t.isIncome && !t.isTransfer && (t.date || "").slice(0, 7) === ym).reduce((s, t) => s + (t.amount || 0), 0)).filter(x => x > 0);
              if (perMonth.length < 1) return null;
              const avg = perMonth.reduce((s, x) => s + x, 0) / perMonth.length;
              const max = Math.max(...perMonth);
              const min = Math.min(...perMonth);
              return (
                <div style={S.card}>
                  <h3 style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: "600", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Forecast</h3>
                  <p style={{ margin: "0 0 10px", fontSize: "11px", color: T.textLight }}>Based on last {perMonth.length} month{perMonth.length > 1 ? "s" : ""} of activity</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <div style={{ background: T.inputBg, borderRadius: "10px", padding: "10px" }}>
                      <p style={{ margin: 0, fontSize: "10px", color: T.textLight, textTransform: "uppercase" }}>Expected next month</p>
                      <p style={{ margin: "4px 0 0", fontSize: "16px", ...S.mono, color: T.danger }}>{fmt(avg)}</p>
                    </div>
                    <div style={{ background: T.inputBg, borderRadius: "10px", padding: "10px" }}>
                      <p style={{ margin: 0, fontSize: "10px", color: T.textLight, textTransform: "uppercase" }}>Range</p>
                      <p style={{ margin: "4px 0 0", fontSize: "13px", ...S.mono, color: T.textMuted }}>{fmt(min)} – {fmt(max)}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {(() => {
              const budgetedCats = Object.keys(categoryBudgets).filter(k => (categoryBudgets[k] || 0) > 0);
              if (budgetedCats.length === 0) return null;
              const now = new Date();
              const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
              const monthTxns = transactions.filter(t => !t.isIncome && !t.isTransfer && (t.date || "").slice(0, 7) === ym);
              return (
                <div style={S.card}>
                  <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: "600", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>This Month's Budgets</h3>
                  {budgetedCats.map(cid => {
                    const cat = CATEGORIES.find(c => c.id === cid) || { label: cid, icon: "•", color: T.textMuted };
                    const budget = categoryBudgets[cid] || 0;
                    const spent = monthTxns.filter(t => t.category === cid).reduce((s, t) => s + (t.amount || 0), 0);
                    const pct = budget > 0 ? (spent / budget) * 100 : 0;
                    const over = spent > budget;
                    return (
                      <div key={cid} style={{ marginBottom: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ color: cat.color, fontSize: "13px" }}>{cat.icon}</span>
                            <span style={{ fontSize: "13px", fontWeight: "500" }}>{cat.label}</span>
                          </div>
                          <span style={{ fontSize: "12px", ...S.mono, color: over ? T.danger : T.textMuted }}>{fmt(spent)} / {fmt(budget)}</span>
                        </div>
                        <div style={{ height: "6px", background: T.inputBg, borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: over ? T.danger : cat.color, borderRadius: "3px", transition: "width 0.5s" }} />
                        </div>
                        {over && <p style={{ margin: "3px 0 0", fontSize: "10px", color: T.danger }}>{fmt(spent - budget)} over budget</p>}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {transactions.length > 0 && (
              <div style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Recent Activity</h3>
                  <button onClick={() => setActiveTab("transactions")} style={{ background: "none", border: "none", color: T.accent, fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>View All →</button>
                </div>
                {transactions.slice().sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 5).map(t => {
                  const c = CATEGORIES.find(c => c.id === t.category) || { label: t.category, icon: "•", color: T.textMuted };
                  return (
                    <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.inputBorder}` }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ color: c.color, fontSize: "11px" }}>{c.icon}</span>
                          <span style={{ fontSize: "13px", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.note || c.label}</span>
                        </div>
                        <p style={{ margin: "2px 0 0 17px", fontSize: "10px", color: T.textLight }}>{t.date}</p>
                      </div>
                      <span style={{ fontSize: "13px", ...S.mono, color: t.isIncome ? T.accent : T.danger }}>{t.isIncome ? "+" : "-"}{fmt(t.amount)}</span>
                    </div>
                  );
                })}
              </div>
            )}

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

        {activeTab === "settings" && (
          <>
            <div style={S.card}>
              <h3 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: "600", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Settings</h3>
              <div style={{ marginBottom: "14px" }}>
                <label style={S.label}>Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={S.input}>
                  {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label style={S.label}>PIN Lock (optional)</label>
                {pinHash ? (
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span style={{ flex: 1, padding: "8px 10px", background: T.accentBg, border: `1px solid ${T.accentBorder}`, borderRadius: "8px", fontSize: "11px", color: T.accent }}>🔒 PIN enabled</span>
                    <button onClick={removePin} style={{ padding: "8px 12px", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: "8px", color: T.textMuted, fontSize: "11px", cursor: "pointer", fontFamily: "inherit" }}>Remove PIN</button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "6px" }}>
                      <input type="password" inputMode="numeric" pattern="[0-9]*" value={pinDraft} onChange={(e) => setPinDraft(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="New PIN" style={S.input} />
                      <input type="password" inputMode="numeric" pattern="[0-9]*" value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="Confirm" style={S.input} />
                      <button onClick={savePin} disabled={pinDraft.length < 4 || pinDraft !== pinConfirm} style={{ padding: "10px 14px", background: T.accentBg, border: `1px solid ${T.accentBorder}`, borderRadius: "8px", color: T.accent, fontSize: "11px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", opacity: pinDraft.length < 4 || pinDraft !== pinConfirm ? 0.5 : 1 }}>Set</button>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: "10px", color: T.textLight }}>4+ digits. Required every time you open the app.</p>
                  </>
                )}
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={S.label}>AI Advisor (optional)</label>
                {aiKey ? (
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span style={{ flex: 1, padding: "8px 10px", background: T.accentBg, border: `1px solid ${T.accentBorder}`, borderRadius: "8px", fontSize: "11px", color: T.accent }}>✓ Gemini key saved · {aiKey.slice(0, 6)}…{aiKey.slice(-4)}</span>
                    <button onClick={() => { storeKey(""); setAiKey(""); }} style={{ padding: "8px 12px", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: "8px", color: T.textMuted, fontSize: "11px", cursor: "pointer", fontFamily: "inherit" }}>Remove</button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <input type={showApiKey ? "text" : "password"} value={aiKeyDraft} onChange={(e) => setAiKeyDraft(e.target.value)} placeholder="Paste Gemini API key..." style={{ ...S.input, flex: 1 }} />
                      <button onClick={() => setShowApiKey(!showApiKey)} type="button" style={{ padding: "10px 10px", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: "8px", color: T.textMuted, fontSize: "11px", cursor: "pointer", fontFamily: "inherit" }}>{showApiKey ? "Hide" : "Show"}</button>
                      <button onClick={saveAiKey} disabled={!aiKeyDraft.trim()} style={{ padding: "10px 14px", background: T.accentBg, border: `1px solid ${T.accentBorder}`, borderRadius: "8px", color: T.accent, fontSize: "11px", fontWeight: "600", cursor: aiKeyDraft.trim() ? "pointer" : "default", fontFamily: "inherit", opacity: aiKeyDraft.trim() ? 1 : 0.5 }}>Save</button>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: "10px", color: T.textLight }}>Free key: <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: T.accent }}>aistudio.google.com/apikey</a>. Stored only on this device.</p>
                  </>
                )}
              </div>

              <div style={{ marginBottom: "14px" }}>
                <button onClick={() => setShowBudgetEditor(!showBudgetEditor)} style={{ width: "100%", padding: "10px 12px", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: "8px", color: T.textMuted, fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                  {showBudgetEditor ? "▾" : "▸"} Monthly category budgets
                </button>
                {showBudgetEditor && (
                  <div style={{ marginTop: "8px" }}>
                    <p style={{ margin: "0 0 8px", fontSize: "10px", color: T.textLight }}>Set a monthly spending limit per category. Progress is tracked against logged transactions.</p>
                    {CATEGORIES.filter(c => c.id !== "income").map(c => (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <span style={{ color: c.color, fontSize: "12px", width: "18px" }}>{c.icon}</span>
                        <span style={{ fontSize: "12px", flex: 1 }}>{c.label}</span>
                        <input type="number" value={categoryBudgets[c.id] || ""} onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setCategoryBudgets(p => ({ ...p, [c.id]: isFinite(v) && v >= 0 ? v : 0 }));
                        }} placeholder="0" style={{ ...S.input, width: "90px", fontSize: "12px", padding: "6px 8px" }} />
                      </div>
                    ))}
                  </div>
                )}
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

            {(items.length > 0 || goals.length > 0 || accounts.length > 0 || transactions.length > 0) && (clearConfirm ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => {
                  const snap = snapshotState();
                  setItems([]); setGoals([]); setAccounts([]); setTransactions([]); setCategoryBudgets({});
                  clearStored();
                  setClearConfirm(false);
                  showToast("All data cleared", "ok", { label: "Undo", fn: () => restoreSnapshot(snap) });
                }} style={{ flex: 1, padding: "12px", background: T.dangerBg, border: `1px solid ${T.dangerBorder}`, borderRadius: "10px", color: T.danger, fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>Yes, erase everything</button>
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
                <div style={{ marginBottom: "14px" }}>
                  <label style={S.label}>Next due date (optional)</label>
                  <input type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} style={S.input} />
                  <p style={{ margin: "4px 0 0", fontSize: "10px", color: T.textLight }}>If set, this bill appears on your upcoming bills calendar</p>
                </div>
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
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "14px", ...S.mono, color: T.danger }}>-{fmt(convert(item.amount, item.frequency))}</span>
                        <button onClick={(e) => { e.stopPropagation(); setItems(p => p.map(x => x.id === item.id ? { ...x, cancelled: true, cancelledAt: new Date().toISOString().slice(0, 10) } : x)); showToast(`${item.name} cancelled`, "ok", { label: "Undo", fn: () => setItems(p => p.map(x => x.id === item.id ? { ...x, cancelled: false, cancelledAt: undefined } : x)) }); }} title="Mark as cancelled" style={{ padding: "4px 8px", background: "transparent", border: `1px solid ${T.inputBorder}`, borderRadius: "6px", color: T.textLight, fontSize: "10px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>CANCEL</button>
                        <DelBtn id={item.id} onDel={id => { setItems(p => p.filter(x => x.id !== id)); setDeleteConfirm(null); }} confirm={deleteConfirm} setConfirm={setDeleteConfirm} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {cancelledItems.length > 0 && (() => {
              const totalSavedMonthly = cancelledItems.reduce((s, i) => s + (i.isIncome ? 0 : 1) * (i.amount * (FREQUENCIES.find(f => f.id === i.frequency)?.multiplier || 0) / 12), 0);
              return (
                <div style={{ marginTop: "24px" }}>
                  <h3 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: "600", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Cancelled ({cancelledItems.length}) · Saving {fmt(totalSavedMonthly)}/mo</h3>
                  {cancelledItems.map(item => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: "10px", marginBottom: "4px", opacity: 0.65 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: "13px", fontWeight: "500", textDecoration: "line-through" }}>{item.name}</p>
                        <p style={{ margin: "2px 0 0", fontSize: "10px", color: T.textLight }}>{fmt(item.amount)}/{item.frequency} · cancelled {item.cancelledAt || ""}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <button onClick={() => setItems(p => p.map(x => x.id === item.id ? { ...x, cancelled: false, cancelledAt: undefined } : x))} style={{ padding: "4px 8px", background: T.accentBg, border: `1px solid ${T.accentBorder}`, borderRadius: "6px", color: T.accent, fontSize: "10px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>REACTIVATE</button>
                        <button onClick={() => setItems(p => p.filter(x => x.id !== item.id))} style={{ padding: "4px 8px", background: "transparent", border: "none", color: T.textLight, fontSize: "16px", cursor: "pointer", lineHeight: 1 }}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

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
                {netWorthHistory.length >= 2 && (() => {
                  const hist = netWorthHistory.slice(-90);
                  const values = hist.map(h => h.value);
                  const min = Math.min(...values);
                  const max = Math.max(...values);
                  const range = max - min || 1;
                  const w = 300, h = 60, pad = 4;
                  const pts = hist.map((p, i) => {
                    const x = pad + (i / (hist.length - 1)) * (w - pad * 2);
                    const y = pad + (1 - (p.value - min) / range) * (h - pad * 2);
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  }).join(" ");
                  const first = values[0];
                  const last = values[values.length - 1];
                  const change = last - first;
                  const pct = first !== 0 ? (change / Math.abs(first)) * 100 : 0;
                  const trendColor = change >= 0 ? T.accent : T.danger;
                  return (
                    <div style={{ marginTop: "10px" }}>
                      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" style={{ display: "block" }}>
                        <polyline points={pts} fill="none" stroke={trendColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p style={{ margin: "6px 0 0", fontSize: "10px", color: T.textLight }}>{hist.length}-day trend · <span style={{ color: trendColor, ...S.mono }}>{change >= 0 ? "+" : ""}{fmt(change)} ({pct.toFixed(1)}%)</span></p>
                    </div>
                  );
                })()}
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

        {/* ACTIVITY / TRANSACTIONS TAB */}
        {activeTab === "transactions" && (() => {
          const q = txnSearch.trim().toLowerCase();
          const filtered = transactions
            .filter(t => txnFilterAccount === "all" || t.accountId === txnFilterAccount)
            .filter(t => txnFilterCategory === "all" || t.category === txnFilterCategory)
            .filter(t => {
              if (!q) return true;
              const cat = CATEGORIES.find(c => c.id === t.category)?.label || "";
              const acct = accounts.find(a => a.id === t.accountId)?.name || "";
              const tagStr = (t.tags || []).join(" ");
              return [t.note, cat, acct, t.date, String(t.amount), tagStr].some(v => (v || "").toLowerCase().includes(q));
            })
            .slice()
            .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
          const grouped = filtered.reduce((acc, t) => {
            const k = (t.date || "").slice(0, 7) || "undated";
            (acc[k] ||= []).push(t);
            return acc;
          }, {});
          const monthLabel = (k) => {
            if (k === "undated") return "No date";
            const [y, m] = k.split("-");
            return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString(undefined, { year: "numeric", month: "long" });
          };
          const acctName = (id) => accounts.find(a => a.id === id)?.name || "—";
          const catInfo = (id) => CATEGORIES.find(c => c.id === id) || { label: id, icon: "•", color: T.textMuted };
          const monthTotal = (list) => list.reduce((s, t) => t.isTransfer ? s : s + (t.isIncome ? 1 : -1) * (t.amount || 0), 0);

          return (
            <>
              {showTxnForm && (
                <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "14px", padding: "16px", marginBottom: "16px", boxShadow: T.cardShadow }}>
                  <h3 style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: "600" }}>{editingTxnId ? "Edit Transaction" : "Add Transaction"}</h3>
                  <div style={{ display: "flex", gap: "4px", background: T.toggleBg, borderRadius: "8px", padding: "3px", marginBottom: "12px" }}>
                    <button onClick={() => setTxnFormData({ ...txnFormData, isIncome: false, isTransfer: false, category: txnFormData.category === "income" ? "other" : txnFormData.category })} style={{ flex: 1, padding: "8px", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", background: !txnFormData.isIncome && !txnFormData.isTransfer ? T.dangerBg : "transparent", color: !txnFormData.isIncome && !txnFormData.isTransfer ? T.danger : T.textLight }}>Expense</button>
                    <button onClick={() => setTxnFormData({ ...txnFormData, isIncome: true, isTransfer: false, category: "income" })} style={{ flex: 1, padding: "8px", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", background: txnFormData.isIncome ? T.accentBg : "transparent", color: txnFormData.isIncome ? T.accent : T.textLight }}>Income</button>
                    <button onClick={() => setTxnFormData({ ...txnFormData, isIncome: false, isTransfer: true })} style={{ flex: 1, padding: "8px", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", background: txnFormData.isTransfer ? T.inputBg : "transparent", color: txnFormData.isTransfer ? T.text : T.textLight }}>Transfer</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                    <div><label style={S.label}>Amount</label><input type="number" value={txnFormData.amount} onChange={e => setTxnFormData({ ...txnFormData, amount: e.target.value })} placeholder="0.00" style={S.input} /></div>
                    <div><label style={S.label}>Date</label><input type="date" value={txnFormData.date} onChange={e => setTxnFormData({ ...txnFormData, date: e.target.value })} style={S.input} /></div>
                  </div>
                  {txnFormData.isTransfer ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                      <div><label style={S.label}>From</label>
                        <select value={txnFormData.fromAccountId} onChange={e => setTxnFormData({ ...txnFormData, fromAccountId: e.target.value })} style={S.input}>
                          <option value="">— select —</option>
                          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      </div>
                      <div><label style={S.label}>To</label>
                        <select value={txnFormData.toAccountId} onChange={e => setTxnFormData({ ...txnFormData, toAccountId: e.target.value })} style={S.input}>
                          <option value="">— select —</option>
                          {accounts.filter(a => a.id !== txnFormData.fromAccountId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginBottom: "10px" }}>
                      <label style={S.label}>Account</label>
                      <select value={txnFormData.accountId} onChange={e => setTxnFormData({ ...txnFormData, accountId: e.target.value })} style={S.input}>
                        <option value="">— No account —</option>
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                  )}
                  {!txnFormData.isIncome && !txnFormData.isTransfer && (
                    <>
                      <div style={{ marginBottom: "10px" }}>
                        <label style={S.label}>Category</label>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                          {CATEGORIES.filter(c => c.id !== "income").map(c => (
                            <button key={c.id} onClick={() => setTxnFormData({ ...txnFormData, category: c.id })} style={{ padding: "8px 6px", border: txnFormData.category === c.id ? `2px solid ${c.color}` : `1px solid ${T.inputBorder}`, borderRadius: "8px", background: txnFormData.category === c.id ? `${c.color}10` : T.catBtnBg, color: txnFormData.category === c.id ? c.color : T.textMuted, fontSize: "11px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>{c.icon} {c.label}</button>
                          ))}
                        </div>
                      </div>
                      <div style={{ marginBottom: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <label style={{ ...S.label, margin: 0 }}>Split across categories (optional)</label>
                          <button onClick={() => setTxnFormData({ ...txnFormData, splits: [...(txnFormData.splits || []), { category: "other", amount: "" }] })} style={{ background: "none", border: "none", color: T.accent, fontSize: "11px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>+ Add split</button>
                        </div>
                        {(txnFormData.splits || []).map((s, i) => (
                          <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "4px" }}>
                            <select value={s.category} onChange={e => setTxnFormData({ ...txnFormData, splits: txnFormData.splits.map((x, j) => j === i ? { ...x, category: e.target.value } : x) })} style={{ ...S.input, flex: 1, fontSize: "12px", padding: "6px 8px" }}>
                              {CATEGORIES.filter(c => c.id !== "income").map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                            <input type="number" value={s.amount} onChange={e => setTxnFormData({ ...txnFormData, splits: txnFormData.splits.map((x, j) => j === i ? { ...x, amount: e.target.value } : x) })} placeholder="0.00" style={{ ...S.input, width: "90px", fontSize: "12px", padding: "6px 8px" }} />
                            <button onClick={() => setTxnFormData({ ...txnFormData, splits: txnFormData.splits.filter((_, j) => j !== i) })} style={{ background: "transparent", border: "none", color: T.textLight, fontSize: "18px", cursor: "pointer", padding: "0 6px" }}>×</button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  <div style={{ marginBottom: "10px" }}>
                    <label style={S.label}>Note (optional)</label>
                    <input type="text" value={txnFormData.note} onChange={e => setTxnFormData({ ...txnFormData, note: e.target.value })} placeholder="e.g. Coffee with Sam" style={S.input} />
                  </div>
                  <div style={{ marginBottom: "14px" }}>
                    <label style={S.label}>Tags (comma-separated, optional)</label>
                    <input type="text" value={txnFormData.tags} onChange={e => setTxnFormData({ ...txnFormData, tags: e.target.value })} placeholder="e.g. vacation, work, gift" style={S.input} />
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={handleTxnSubmit} style={S.greenBtn}>{editingTxnId ? "Update" : "Add"}</button>
                    <button onClick={resetTxnForm} style={S.ghostBtn}>Cancel</button>
                  </div>
                </div>
              )}
              {!showTxnForm && !csvState && !detectedSubs && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
                  <button onClick={() => { resetTxnForm(); setShowTxnForm(true); }} style={{ padding: "14px", background: T.accentBg, border: `1px dashed ${T.accentBorder}`, borderRadius: "12px", color: T.accent, fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>+ Add</button>
                  <button onClick={() => csvFileRef.current?.click()} style={{ padding: "14px", background: T.inputBg, border: `1px dashed ${T.inputBorder}`, borderRadius: "12px", color: T.textMuted, fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>↑ Import CSV</button>
                  <input ref={csvFileRef} type="file" accept=".csv,text/csv" onChange={handleCsvFile} style={{ display: "none" }} />
                </div>
              )}

              {transactions.length >= 3 && !csvState && !detectedSubs && !showTxnForm && (
                <button onClick={runDetectSubs} style={{ width: "100%", padding: "12px", marginBottom: "16px", background: "transparent", border: `1px solid ${T.inputBorder}`, borderRadius: "10px", color: T.textMuted, fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>✨ Detect subscriptions from activity</button>
              )}

              {csvState && (() => {
                const preview = rowsToTransactions(csvState.rows, csvState.map, csvState.preferred).slice(0, 10);
                const totalCount = rowsToTransactions(csvState.rows, csvState.map, csvState.preferred).length;
                const colOptions = csvState.rows[0].map((h, i) => ({ value: i, label: `${i + 1}: ${h || "(unnamed)"}` }));
                const setMap = (k, v) => setCsvState({ ...csvState, map: { ...csvState.map, [k]: v } });
                return (
                  <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "14px", padding: "16px", marginBottom: "16px", boxShadow: T.cardShadow }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>Import CSV</h3>
                      <button onClick={() => setCsvState(null)} style={{ background: "none", border: "none", color: T.textLight, fontSize: "18px", cursor: "pointer" }}>×</button>
                    </div>
                    <p style={{ margin: "0 0 10px", fontSize: "11px", color: T.textLight }}>File: {csvState.fileName} · {csvState.rows.length - 1} rows</p>
                    <label style={S.label}>Bank preset</label>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
                      {BANK_PRESETS.map((p) => (
                        <button key={p.id} onClick={() => setCsvState({ ...csvState, map: { ...p.map } })} title={p.desc} style={{ padding: "6px 10px", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: "6px", color: T.textMuted, fontSize: "11px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>{p.name}</button>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                      <div><label style={S.label}>Date column</label><select value={csvState.map.dateIdx} onChange={(e) => setMap("dateIdx", +e.target.value)} style={S.input}>{colOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                      <div><label style={S.label}>Description</label><select value={csvState.map.descIdx} onChange={(e) => setMap("descIdx", +e.target.value)} style={S.input}>{colOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <label style={S.label}>Amount column</label>
                      <select value={csvState.map.amountIdx} onChange={(e) => setMap("amountIdx", +e.target.value)} style={S.input}><option value={-1}>— none (use debit/credit) —</option>{colOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                    </div>
                    {csvState.map.amountIdx < 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                        <div><label style={S.label}>Debit (out)</label><select value={csvState.map.debitIdx} onChange={(e) => setMap("debitIdx", +e.target.value)} style={S.input}><option value={-1}>—</option>{colOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                        <div><label style={S.label}>Credit (in)</label><select value={csvState.map.creditIdx} onChange={(e) => setMap("creditIdx", +e.target.value)} style={S.input}><option value={-1}>—</option>{colOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                      </div>
                    )}
                    <div style={{ marginBottom: "12px" }}>
                      <label style={S.label}>Import to account</label>
                      <select value={csvState.accountId} onChange={(e) => setCsvState({ ...csvState, accountId: e.target.value })} style={S.input}>
                        <option value="">— No account —</option>
                        {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                    <p style={{ margin: "0 0 6px", fontSize: "11px", color: T.textLight, fontWeight: "600", textTransform: "uppercase" }}>Preview · {totalCount} parsed of {csvState.rows.length - (csvState.map.hasHeader ? 1 : 0)} rows{totalCount < csvState.rows.length - (csvState.map.hasHeader ? 1 : 0) ? ` (${csvState.rows.length - (csvState.map.hasHeader ? 1 : 0) - totalCount} skipped)` : ""}</p>
                    <div style={{ maxHeight: "200px", overflowY: "auto", border: `1px solid ${T.inputBorder}`, borderRadius: "8px", marginBottom: "12px" }}>
                      {preview.length === 0 ? (
                        <p style={{ padding: "10px", margin: 0, fontSize: "12px", color: T.danger }}>No rows parsed — try different columns or date format</p>
                      ) : preview.map((t, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderBottom: i < preview.length - 1 ? `1px solid ${T.inputBorder}` : "none", fontSize: "11px" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.note}</p>
                            <p style={{ margin: "1px 0 0", color: T.textLight, fontSize: "10px" }}>{t.date}</p>
                          </div>
                          <span style={{ ...S.mono, color: t.isIncome ? T.accent : T.danger }}>{t.isIncome ? "+" : "-"}{fmt(t.amount)}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={csvImport} disabled={totalCount === 0} style={{ ...S.greenBtn, opacity: totalCount === 0 ? 0.5 : 1 }}>Import {totalCount} transactions</button>
                      <button onClick={() => setCsvState(null)} style={S.ghostBtn}>Cancel</button>
                    </div>
                  </div>
                );
              })()}

              {detectedSubs && (
                <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "14px", padding: "16px", marginBottom: "16px", boxShadow: T.cardShadow }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>✨ Detected subscriptions</h3>
                    <button onClick={() => setDetectedSubs(null)} style={{ background: "none", border: "none", color: T.textLight, fontSize: "18px", cursor: "pointer" }}>×</button>
                  </div>
                  {detectedSubs.length === 0 ? (
                    <p style={{ margin: "0 0 12px", fontSize: "12px", color: T.textLight }}>No recurring patterns found. Need at least 2 occurrences of the same merchant. Try importing more transaction history.</p>
                  ) : (
                    <>
                      <p style={{ margin: "0 0 12px", fontSize: "11px", color: T.textLight }}>Check items to add. Edit frequency or category if needed. <span style={{ color: T.accent }}>●</span> high · <span style={{ color: "#d97706" }}>●</span> medium · <span style={{ color: T.danger }}>●</span> low confidence.</p>
                      {detectedSubs.map((s) => {
                        const checked = selectedSubIds.has(s.id);
                        const confColor = s.confidence === "high" ? T.accent : s.confidence === "medium" ? "#d97706" : T.danger;
                        return (
                          <div key={s.id} style={{ padding: "10px", background: checked ? T.accentBg : T.inputBg, border: `1px solid ${checked ? T.accentBorder : T.inputBorder}`, borderRadius: "10px", marginBottom: "6px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                              <input type="checkbox" checked={checked} onChange={() => {
                                const next = new Set(selectedSubIds);
                                if (checked) next.delete(s.id); else next.add(s.id);
                                setSelectedSubIds(next);
                              }} style={{ cursor: "pointer" }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ color: confColor, fontSize: "10px" }}>●</span>
                                  <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.displayName}</p>
                                </div>
                                <p style={{ margin: "2px 0 0 14px", fontSize: "10px", color: T.textLight }}>{s.occurrences}× · last {s.lastDate}</p>
                              </div>
                              <span style={{ fontSize: "13px", ...S.mono, color: T.danger }}>{fmt(s.amount)}</span>
                              <button onClick={() => {
                                setDetectedSubs((p) => p.filter((x) => x.id !== s.id));
                                setSelectedSubIds((p) => { const n = new Set(p); n.delete(s.id); return n; });
                              }} title="Remove from list" style={{ padding: "2px 6px", background: "transparent", border: "none", color: T.textLight, fontSize: "18px", cursor: "pointer", lineHeight: 1 }}>×</button>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                              <select value={s.frequency} onChange={(e) => updateDetectedSub(s.id, { frequency: e.target.value })} style={{ ...S.input, fontSize: "11px", padding: "6px 8px" }}>
                                {FREQUENCIES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                              </select>
                              <select value={s.category} onChange={(e) => updateDetectedSub(s.id, { category: e.target.value })} style={{ ...S.input, fontSize: "11px", padding: "6px 8px" }}>
                                {CATEGORIES.filter((c) => c.id !== "income").map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                        <button onClick={addSelectedSubs} disabled={selectedSubIds.size === 0} style={{ ...S.greenBtn, opacity: selectedSubIds.size === 0 ? 0.5 : 1 }}>Add {selectedSubIds.size} to Budget</button>
                        <button onClick={() => setDetectedSubs(null)} style={S.ghostBtn}>Dismiss</button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {transactions.length === 0 && !showTxnForm && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: T.textLight }}>
                  <p style={{ fontSize: "40px", margin: "0 0 12px", opacity: 0.3 }}>∿</p>
                  <p style={{ fontSize: "14px", fontWeight: "600", color: T.textMuted, margin: "0 0 8px" }}>No transactions yet</p>
                  <p style={{ fontSize: "13px" }}>Log real spending as it happens. Use the CSV import (coming soon) to bulk-add from bank statements.</p>
                </div>
              )}

              {transactions.length > 0 && (
                <>
                  <div style={{ position: "relative", marginBottom: "8px" }}>
                    <input type="text" value={txnSearch} onChange={e => setTxnSearch(e.target.value)} placeholder="Search by name, category, account, date..." style={{ ...S.input, paddingRight: txnSearch ? "30px" : "12px" }} />
                    {txnSearch && (
                      <button onClick={() => setTxnSearch("")} style={{ position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: T.textLight, fontSize: "18px", cursor: "pointer", lineHeight: 1, padding: "4px 8px" }}>×</button>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                    <select value={txnFilterAccount} onChange={e => setTxnFilterAccount(e.target.value)} style={{ ...S.input, fontSize: "12px" }}>
                      <option value="all">All accounts</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <select value={txnFilterCategory} onChange={e => setTxnFilterCategory(e.target.value)} style={{ ...S.input, fontSize: "12px" }}>
                      <option value="all">All categories</option>
                      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  {q && <p style={{ margin: "0 0 12px", fontSize: "11px", color: T.textLight }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{txnSearch}"</p>}
                </>
              )}

              {(() => {
                const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
                const currentYm = new Date().toISOString().slice(0, 7);
                return sortedKeys.map((k, idx) => {
                  const total = monthTotal(grouped[k]);
                  const autoCollapsed = idx > 0 && k !== currentYm;
                  const collapsed = q ? false : (collapsedMonths.has(`!${k}`) ? false : (collapsedMonths.has(k) || autoCollapsed));
                  const toggle = () => {
                    setCollapsedMonths((prev) => {
                      const next = new Set(prev);
                      next.delete(k); next.delete(`!${k}`);
                      if (!collapsed) next.add(k);
                      else next.add(`!${k}`);
                      return next;
                    });
                  };
                  return (
                    <div key={k} style={{ marginBottom: "10px" }}>
                      <button onClick={toggle} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: "10px", cursor: "pointer", fontFamily: "inherit", marginBottom: collapsed ? 0 : "6px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: "600", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          <span style={{ fontSize: "10px", color: T.textLight }}>{collapsed ? "▸" : "▾"}</span>
                          {monthLabel(k)}
                          <span style={{ fontSize: "10px", color: T.textLight, textTransform: "none", letterSpacing: 0 }}>· {grouped[k].length}</span>
                        </span>
                        <span style={{ fontSize: "12px", ...S.mono, color: total >= 0 ? T.accent : T.danger }}>{total >= 0 ? "+" : ""}{fmt(total)}</span>
                      </button>
                      {!collapsed && grouped[k].map(t => {
                        const c = catInfo(t.category);
                        if (t.isTransfer) {
                          return (
                            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "10px", marginBottom: "4px", boxShadow: T.cardShadow }}>
                              <div onClick={() => startEditTxn(t)} style={{ cursor: "pointer", flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ color: T.textMuted, fontSize: "12px" }}>⇄</span>
                                  <p style={{ margin: 0, fontSize: "13px", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.note || "Transfer"}</p>
                                </div>
                                <p style={{ margin: "2px 0 0 18px", fontSize: "10px", color: T.textLight }}>{t.date} · {acctName(t.fromAccountId)} → {acctName(t.toAccountId)}</p>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "13px", ...S.mono, color: T.textMuted }}>{fmt(t.amount)}</span>
                                <DelBtn id={t.id} onDel={id => { setTransactions(p => p.filter(x => x.id !== id)); setDeleteTxnConfirm(null); }} confirm={deleteTxnConfirm} setConfirm={setDeleteTxnConfirm} />
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "10px", marginBottom: "4px", boxShadow: T.cardShadow }}>
                            <div onClick={() => startEditTxn(t)} style={{ cursor: "pointer", flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: c.color, fontSize: "12px" }}>{c.icon}</span>
                                <p style={{ margin: 0, fontSize: "13px", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.note || c.label}</p>
                                {t.splits?.length > 0 && <span style={{ fontSize: "10px", color: T.textLight, background: T.inputBg, padding: "1px 6px", borderRadius: "4px" }}>split</span>}
                                {(t.tags || []).slice(0, 2).map(tag => <span key={tag} style={{ fontSize: "9px", color: T.textMuted, background: T.inputBg, padding: "1px 6px", borderRadius: "4px" }}>#{tag}</span>)}
                              </div>
                              <p style={{ margin: "2px 0 0 18px", fontSize: "10px", color: T.textLight }}>{t.date} {t.accountId && `· ${acctName(t.accountId)}`}</p>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "13px", ...S.mono, color: t.isIncome ? T.accent : T.danger }}>{t.isIncome ? "+" : "-"}{fmt(t.amount)}</span>
                              <DelBtn id={t.id} onDel={id => { setTransactions(p => p.filter(x => x.id !== id)); setDeleteTxnConfirm(null); }} confirm={deleteTxnConfirm} setConfirm={setDeleteTxnConfirm} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                });
              })()}

              {transactions.length > 0 && !csvState && !detectedSubs && !showTxnForm && (
                <div style={{ marginTop: "24px" }}>
                  {clearTxnsConfirm ? (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => {
                        const prev = [...transactions];
                        setTransactions([]);
                        setClearTxnsConfirm(false);
                        showToast(`${prev.length} transactions cleared`, "ok", { label: "Undo", fn: () => setTransactions(prev) });
                      }} style={{ flex: 1, padding: "12px", background: T.dangerBg, border: `1px solid ${T.dangerBorder}`, borderRadius: "10px", color: T.danger, fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>Yes, delete {transactions.length} transactions</button>
                      <button onClick={() => setClearTxnsConfirm(false)} style={{ flex: 1, padding: "12px", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: "10px", color: T.textMuted, fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setClearTxnsConfirm(true)} style={{ width: "100%", padding: "12px", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: "10px", color: T.textLight, fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>Clear all transactions</button>
                  )}
                </div>
              )}
            </>
          );
        })()}

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

        {/* COACH TAB */}
        {activeTab === "coach" && (() => {
          const data = computeCoach({ items, goals, accounts, transactions, categoryBudgets });
          const insights = generateInsights(data, { goals, accounts, items, categoriesLookup: CATEGORIES }, fmt);
          const { healthScore } = data;
          const sl = scoreLabel(healthScore);
          const scoreRow = (label, score) => {
            if (score === null) return null;
            const s = Math.round(score);
            return (
              <div key={label} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "12px", color: T.textMuted }}>{label}</span>
                  <span style={{ fontSize: "12px", ...S.mono, color: s >= 65 ? T.accent : s >= 40 ? "#d97706" : T.danger }}>{s}</span>
                </div>
                <div style={{ height: "5px", background: T.inputBg, borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${s}%`, background: s >= 65 ? T.accent : s >= 40 ? "#d97706" : T.danger, borderRadius: "3px" }} />
                </div>
              </div>
            );
          };
          const typeStyle = (type) => {
            if (type === "warn") return { bg: T.dangerBg, border: T.dangerBorder, color: T.danger, icon: "!" };
            if (type === "good") return { bg: T.accentBg, border: T.accentBorder, color: T.accent, icon: "✓" };
            if (type === "ok") return { bg: T.accentBg, border: T.accentBorder, color: T.accent, icon: "•" };
            return { bg: T.inputBg, border: T.inputBorder, color: T.textMuted, icon: "i" };
          };

          return (
            <>
              <div style={{ background: sl.color + "14", border: `1px solid ${sl.color}40`, borderRadius: "14px", padding: "20px", marginBottom: "16px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "11px", color: T.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>Financial Health</p>
                <p style={{ margin: "8px 0 0", fontSize: "44px", ...S.mono, color: sl.color, letterSpacing: "-1px", lineHeight: 1 }}>{healthScore}<span style={{ fontSize: "18px", color: T.textLight, marginLeft: "4px" }}>/100</span></p>
                <p style={{ margin: "6px 0 0", fontSize: "13px", fontWeight: "600", color: sl.color }}>{sl.label}</p>
              </div>

              <div style={S.card}>
                <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: "600", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Breakdown</h3>
                {scoreRow("Savings rate", data.scores.savings)}
                {scoreRow("Emergency fund", data.scores.emergency)}
                {scoreRow("Debt burden", data.scores.debt)}
                {scoreRow("Budget adherence", data.scores.budget)}
                {scoreRow("Goals progress", data.scores.goal)}
                {(data.scores.emergency === null || data.scores.debt === null) && <p style={{ margin: "8px 0 0", fontSize: "11px", color: T.textLight }}>Add accounts to unlock emergency fund &amp; debt metrics.</p>}
                {data.scores.budget === null && <p style={{ margin: "4px 0 0", fontSize: "11px", color: T.textLight }}>Set monthly category budgets in Settings to track adherence.</p>}
              </div>

              {insights.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <h3 style={{ margin: "0 0 10px 4px", fontSize: "13px", fontWeight: "600", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Insights &amp; Suggestions</h3>
                  {insights.map((ins, i) => {
                    const t = typeStyle(ins.type);
                    return (
                      <div key={i} style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "12px 14px", marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: t.color, color: "#fff", fontSize: "11px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: "700" }}>{t.icon}</span>
                          <span style={{ fontSize: "13px", fontWeight: "600", color: t.color }}>{ins.title}</span>
                        </div>
                        <p style={{ margin: "0 0 0 26px", fontSize: "12px", color: T.text, lineHeight: 1.5 }}>{ins.text}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <h3 style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>AI Advisor</h3>
                  {aiKey && chatMessages.length > 0 && <button onClick={() => { setChatMessages([]); setChatError(null); }} style={{ background: "none", border: "none", color: T.textLight, fontSize: "11px", cursor: "pointer", fontFamily: "inherit" }}>Clear chat</button>}
                </div>
                {!aiKey ? (
                  <div>
                    <p style={{ margin: "0 0 8px", fontSize: "12px", color: T.textMuted, lineHeight: 1.5 }}>Chat with an AI advisor about your budget. Uses Google Gemini (free tier) — your data is sent to Google only when you chat.</p>
                    <p style={{ margin: "0 0 10px", fontSize: "11px", color: T.textLight }}>Get a free key: <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: T.accent }}>aistudio.google.com/apikey</a></p>
                    <button onClick={() => setActiveTab("settings")} style={{ width: "100%", padding: "10px", background: T.accentBg, border: `1px solid ${T.accentBorder}`, borderRadius: "8px", color: T.accent, fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>⚙ Open Settings to paste key</button>
                  </div>
                ) : (
                  <>
                    <div style={{ maxHeight: "400px", overflowY: "auto", marginBottom: "10px" }}>
                      {chatMessages.length === 0 && (
                        <div>
                          <p style={{ margin: "0 0 10px", fontSize: "12px", color: T.textLight }}>Try asking:</p>
                          {["How much should I save each month?", "What subscriptions should I cancel?", "How long until I hit my emergency fund goal?", "Am I on track for my goals?"].map((q) => (
                            <button key={q} onClick={() => setChatInput(q)} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 12px", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: "8px", color: T.textMuted, fontSize: "12px", cursor: "pointer", fontFamily: "inherit", marginBottom: "6px" }}>{q}</button>
                          ))}
                        </div>
                      )}
                      {chatMessages.map((m, i) => (
                        <div key={i} style={{ marginBottom: "10px" }}>
                          <p style={{ margin: "0 0 4px", fontSize: "10px", color: T.textLight, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>{m.role === "user" ? "You" : "Coach"}</p>
                          <div style={{ padding: "10px 12px", background: m.role === "user" ? T.inputBg : T.accentBg, border: `1px solid ${m.role === "user" ? T.inputBorder : T.accentBorder}`, borderRadius: "10px", fontSize: "13px", color: T.text, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{m.text}</div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div style={{ padding: "10px 12px", background: T.accentBg, border: `1px solid ${T.accentBorder}`, borderRadius: "10px", fontSize: "12px", color: T.textLight, fontStyle: "italic" }}>thinking…</div>
                      )}
                    </div>
                    {chatError && (
                      <p style={{ margin: "0 0 8px", padding: "8px 10px", background: T.dangerBg, border: `1px solid ${T.dangerBorder}`, borderRadius: "8px", fontSize: "11px", color: T.danger }}>{chatError}</p>
                    )}
                    <div style={{ display: "flex", gap: "6px" }}>
                      <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }} placeholder="Ask about your budget…" disabled={chatLoading} style={{ ...S.input, flex: 1 }} />
                      <button onClick={sendChatMessage} disabled={chatLoading || !chatInput.trim()} style={{ padding: "10px 16px", background: "linear-gradient(135deg, #16a34a, #15803d)", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: "600", cursor: chatLoading || !chatInput.trim() ? "default" : "pointer", fontFamily: "inherit", opacity: chatLoading || !chatInput.trim() ? 0.5 : 1 }}>Send</button>
                    </div>
                  </>
                )}
              </div>

              <p style={{ fontSize: "10px", color: T.textLight, textAlign: "center", padding: "8px 16px", lineHeight: 1.5 }}>This is educational guidance, not professional financial advice. Consider consulting a financial advisor for major decisions.</p>
            </>
          );
        })()}
      </div>
    </div>
  );
}
