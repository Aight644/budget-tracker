import { toYr, toMo } from "./calc.js";

const LIQUID_TYPES = ["checking", "savings", "cash"];

// Classify a loan account by name. Mortgages and student loans are
// "good debt" — low interest, backed by an appreciating asset or earning power.
// Personal / auto / other loans are neutral-to-bad.
export function classifyLoan(account) {
  const name = (account?.name || "").toLowerCase();
  if (/(mortgage|home\s*loan|property\s*loan|investment\s*loan)/i.test(name)) return "mortgage";
  if (/(student|hecs|help\s*loan|college|uni(versity)?\s*loan)/i.test(name)) return "student";
  if (/(car|vehicle|auto(motive)?|motor)\s*(loan|finance)?/i.test(name)) return "auto";
  return "personal";
}

export function computeCoach({ items, goals, accounts, transactions, categoryBudgets }) {
  const incomeItems = items.filter((i) => i.isIncome && !i.cancelled);
  const expenseItems = items.filter((i) => !i.isIncome && !i.cancelled);
  const yearlyIncome = incomeItems.reduce((s, i) => s + toYr(i.amount, i.frequency), 0);
  const yearlyExpenses = expenseItems.reduce((s, i) => s + toYr(i.amount, i.frequency), 0);
  const monthlyIncome = yearlyIncome / 12;
  const monthlyExpenses = yearlyExpenses / 12;
  const leftover = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? leftover / monthlyIncome : 0;

  const liquidAssets = accounts
    .filter((a) => LIQUID_TYPES.includes(a.type) && a.includeInNetWorth !== false)
    .reduce((s, a) => s + (a.balance || 0), 0);

  // Separate "bad" debt (credit cards, personal/auto loans) from "good" debt (mortgages, student).
  const creditDebt = accounts.filter((a) => a.type === "credit").reduce((s, a) => s + Math.abs(a.balance || 0), 0);
  const loans = accounts.filter((a) => a.type === "loan");
  const goodLoanDebt = loans.filter((l) => ["mortgage", "student"].includes(classifyLoan(l))).reduce((s, a) => s + Math.abs(a.balance || 0), 0);
  const badLoanDebt = loans.filter((l) => !["mortgage", "student"].includes(classifyLoan(l))).reduce((s, a) => s + Math.abs(a.balance || 0), 0);
  const badDebt = creditDebt + badLoanDebt;
  const totalDebt = badDebt + goodLoanDebt;

  const emergencyMonths = monthlyExpenses > 0 ? liquidAssets / monthlyExpenses : 0;
  // Health score penalty only considers bad debt — a 4x-income mortgage shouldn't tank the score.
  const badDebtToIncome = yearlyIncome > 0 ? badDebt / yearlyIncome : 0;
  const debtToIncome = yearlyIncome > 0 ? totalDebt / yearlyIncome : 0;

  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentMonthTxns = transactions.filter((t) => !t.isIncome && !t.isTransfer && (t.date || "").slice(0, 7) === ym);

  const categoriesOverBudget = [];
  for (const [catId, budget] of Object.entries(categoryBudgets || {})) {
    if (!budget || budget <= 0) continue;
    const spent = currentMonthTxns.filter((t) => t.category === catId).reduce((s, t) => s + (t.amount || 0), 0);
    if (spent > budget) categoriesOverBudget.push({ catId, budget, spent, over: spent - budget });
  }

  const subscriptionsMonthly = expenseItems
    .filter((i) => i.category === "subscriptions")
    .reduce((s, i) => s + toMo(i.amount, i.frequency), 0);

  let savingsScore = Math.max(0, Math.min(100, savingsRate * 500));
  let emergencyScore = accounts.length === 0 ? null : Math.max(0, Math.min(100, (emergencyMonths / 6) * 100));
  let debtScore = accounts.length === 0 ? null : Math.max(0, Math.min(100, 100 - badDebtToIncome * 200));
  let budgetScore = Object.keys(categoryBudgets || {}).length === 0
    ? null
    : (categoriesOverBudget.length === 0 ? 100 : Math.max(0, 100 - categoriesOverBudget.length * 20));
  let goalScore = goals.length === 0
    ? null
    : (goals.reduce((s, g) => s + (g.target > 0 ? Math.min(1, g.saved / g.target) : 0), 0) / goals.length) * 100;

  const weights = { savings: 0.30, emergency: 0.25, debt: 0.15, budget: 0.15, goal: 0.15 };
  let totalWeight = 0;
  let totalScore = 0;
  const addScore = (score, weight) => {
    if (score === null) return;
    totalScore += score * weight;
    totalWeight += weight;
  };
  addScore(savingsScore, weights.savings);
  addScore(emergencyScore, weights.emergency);
  addScore(debtScore, weights.debt);
  addScore(budgetScore, weights.budget);
  addScore(goalScore, weights.goal);
  const healthScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;

  return {
    healthScore,
    scores: { savings: savingsScore, emergency: emergencyScore, debt: debtScore, budget: budgetScore, goal: goalScore },
    metrics: { monthlyIncome, monthlyExpenses, leftover, savingsRate, liquidAssets, totalDebt, badDebt, creditDebt, goodLoanDebt, badLoanDebt, emergencyMonths, debtToIncome, badDebtToIncome, subscriptionsMonthly, yearlyIncome, yearlyExpenses },
    categoriesOverBudget,
  };
}

export function generateInsights(data, { goals, accounts, items, categoriesLookup }, fmt) {
  const out = [];
  const m = data.metrics;

  if (m.monthlyIncome === 0) {
    out.push({ type: "info", title: "Get started", text: "Add your income and recurring expenses in the Budget tab. I need these to give you personalized advice." });
  } else if (m.savingsRate < 0) {
    out.push({ type: "warn", title: "Overspending", text: `You're spending ${fmt(-m.leftover)}/month more than you earn. Urgent — trim expenses or increase income before it compounds.` });
  } else if (m.savingsRate < 0.10) {
    out.push({ type: "warn", title: "Low savings rate", text: `You're saving ${(m.savingsRate * 100).toFixed(1)}% of income. Target 10% minimum. Bumping to 10% means ${fmt(m.monthlyIncome * 0.10 - m.leftover)}/month more into savings.` });
  } else if (m.savingsRate < 0.20) {
    out.push({ type: "ok", title: "Decent savings rate", text: `Saving ${(m.savingsRate * 100).toFixed(1)}% — solid. Push to 20% (${fmt(m.monthlyIncome * 0.20)}/mo) to build wealth faster.` });
  } else {
    out.push({ type: "good", title: "Great savings rate", text: `You're saving ${(m.savingsRate * 100).toFixed(1)}%. Above 20% is wealth-building territory — keep it up.` });
  }

  if (accounts.length === 0) {
    out.push({ type: "info", title: "Add accounts", text: "Track your bank accounts in the Accounts tab to unlock emergency-fund and net-worth guidance." });
  } else if (m.monthlyExpenses > 0) {
    if (m.emergencyMonths < 1) {
      out.push({ type: "warn", title: "Build emergency fund", text: `Your cash covers ${m.emergencyMonths.toFixed(1)} months of expenses. First milestone: ${fmt(m.monthlyExpenses)} (1 month). Then build to ${fmt(m.monthlyExpenses * 3)} (3 months).` });
    } else if (m.emergencyMonths < 3) {
      out.push({ type: "warn", title: "Keep building emergency fund", text: `${m.emergencyMonths.toFixed(1)} months saved. Target 3 months (${fmt(m.monthlyExpenses * 3)}). At ${fmt(m.leftover)}/mo you'll get there in ~${Math.max(1, Math.ceil((m.monthlyExpenses * 3 - m.liquidAssets) / Math.max(m.leftover, 1)))} months.` });
    } else if (m.emergencyMonths < 6) {
      out.push({ type: "ok", title: "Emergency fund healthy", text: `${m.emergencyMonths.toFixed(1)} months covered. You're past the danger zone — consider pushing to 6 months for extra security.` });
    } else {
      out.push({ type: "good", title: "Emergency fund complete", text: `${m.emergencyMonths.toFixed(1)} months covered. Excess cash could work harder — look into high-yield savings or index funds.` });
    }
  }

  // Credit card debt (almost always bad debt — high interest, compounds fast)
  if (m.creditDebt > 500) {
    if (m.creditDebt > m.monthlyIncome * 2 && m.monthlyIncome > 0) {
      out.push({ type: "warn", title: "High credit card debt", text: `${fmt(m.creditDebt)} on cards — roughly ${(m.creditDebt / m.monthlyIncome).toFixed(1)}× your monthly income. Prioritize paying this down before saving extra — card interest typically beats investment returns.` });
    } else if (m.creditDebt > 0) {
      out.push({ type: "ok", title: "Credit card balance", text: `${fmt(m.creditDebt)} on cards. Manageable if paid in full monthly; destructive if carried — check the interest rate.` });
    }
  }

  // Non-mortgage, non-student loans (personal, auto) — medium concern
  if (m.badLoanDebt > 0) {
    if (m.badLoanDebt > m.yearlyIncome * 0.5 && m.yearlyIncome > 0) {
      out.push({ type: "warn", title: "Personal/auto loan balance", text: `${fmt(m.badLoanDebt)} in personal or auto loans — usually higher-interest than mortgages. Plan a payoff timeline; refinance if your credit has improved.` });
    } else {
      out.push({ type: "info", title: "Personal loans", text: `${fmt(m.badLoanDebt)} in non-mortgage loans. Pay on schedule; watch the rate.` });
    }
  }

  // Mortgages + student loans are structurally different — "good debt"
  if (m.goodLoanDebt > 0) {
    out.push({ type: "info", title: "Long-term loans", text: `${fmt(m.goodLoanDebt)} in mortgages or student loans — typically low-interest and backed by an appreciating asset or earning power. Pay on schedule; focus extra capital on higher-interest debt or your emergency fund first.` });
  }

  if (m.subscriptionsMonthly > 0 && m.monthlyIncome > 0) {
    const pct = (m.subscriptionsMonthly / m.monthlyIncome) * 100;
    if (pct > 5) {
      out.push({ type: "warn", title: "Subscription creep", text: `Subscriptions eat ${pct.toFixed(1)}% of income (${fmt(m.subscriptionsMonthly)}/mo, ${fmt(m.subscriptionsMonthly * 12)}/year). Review and cancel what you don't actively use.` });
    } else if (pct > 2) {
      out.push({ type: "info", title: "Subscription check", text: `You spend ${fmt(m.subscriptionsMonthly)}/mo on subscriptions. Worth a periodic review — easy wins here.` });
    }
  }

  if (data.categoriesOverBudget.length > 0) {
    const label = (id) => (categoriesLookup || []).find((c) => c.id === id)?.label || id;
    const list = data.categoriesOverBudget.slice(0, 3).map((c) => `${label(c.catId)} (${fmt(c.over)} over)`).join(", ");
    out.push({ type: "warn", title: "Over budget this month", text: `${list}. Reset limits or tighten spending in these categories.` });
  }

  if (goals.length > 0) {
    if (m.leftover > 0) {
      const totalMonthly = goals.reduce((s, g) => s + (g.monthlySaving || 0), 0);
      const unallocated = m.leftover - totalMonthly;
      if (unallocated > 50 && totalMonthly < m.leftover) {
        out.push({ type: "info", title: "Automate savings", text: `You have ${fmt(unallocated)}/mo unallocated. Assign monthly contributions to goals so money gets "jobs" instead of drifting.` });
      }
    }
    for (const g of goals.slice(0, 2)) {
      if (g.saved >= g.target) continue;
      const remaining = g.target - g.saved;
      if (g.monthlySaving > 0) {
        const rate = 0.045;
        let t = g.saved;
        let months = 0;
        while (t < g.target && months < 600) {
          t = (t + g.monthlySaving) * (1 + rate / 12);
          months++;
        }
        out.push({ type: "info", title: `Goal: ${g.name}`, text: `At ${fmt(g.monthlySaving)}/mo + 4.5% interest, you'll reach ${fmt(g.target)} in ${Math.floor(months / 12)}y ${months % 12}mo. Remaining: ${fmt(remaining)}.` });
      } else {
        out.push({ type: "info", title: `Goal: ${g.name}`, text: `No monthly contribution set. Edit the goal to add one — e.g., ${fmt(remaining / 24)}/mo hits ${fmt(g.target)} in 2 years.` });
      }
    }
  }

  return out;
}

export function scoreLabel(score) {
  if (score >= 80) return { label: "Excellent", color: "#059669" };
  if (score >= 65) return { label: "Good", color: "#16a34a" };
  if (score >= 50) return { label: "Fair", color: "#d97706" };
  if (score >= 30) return { label: "Needs work", color: "#ea580c" };
  return { label: "Critical", color: "#dc2626" };
}
