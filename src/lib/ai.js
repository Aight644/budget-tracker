const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export function buildFinancialContext({ items, goals, accounts, transactions, categoryBudgets, currency }, coachData) {
  const lines = [];
  lines.push(`Currency: ${currency}`);
  if (coachData) {
    const m = coachData.metrics;
    lines.push(`Financial health score: ${coachData.healthScore}/100`);
    lines.push(`Monthly income: ${m.monthlyIncome.toFixed(2)}`);
    lines.push(`Monthly expenses: ${m.monthlyExpenses.toFixed(2)}`);
    lines.push(`Monthly leftover: ${m.leftover.toFixed(2)}`);
    lines.push(`Savings rate: ${(m.savingsRate * 100).toFixed(1)}%`);
    if (accounts.length > 0) {
      lines.push(`Liquid assets: ${m.liquidAssets.toFixed(2)}`);
      lines.push(`Credit card debt (high-interest, treat as bad debt): ${(m.creditDebt || 0).toFixed(2)}`);
      lines.push(`Personal/auto loan debt (neutral): ${(m.badLoanDebt || 0).toFixed(2)}`);
      lines.push(`Mortgage / student loan debt (low-interest, usually good debt): ${(m.goodLoanDebt || 0).toFixed(2)}`);
      lines.push(`Emergency fund covers: ${m.emergencyMonths.toFixed(1)} months of expenses`);
    }
    if (m.subscriptionsMonthly > 0) lines.push(`Subscriptions spend: ${m.subscriptionsMonthly.toFixed(2)}/mo`);
  }
  if (accounts.length > 0) {
    lines.push("Accounts:");
    for (const a of accounts) lines.push(`  - ${a.name} (${a.type}): ${(a.balance || 0).toFixed(2)}`);
  }
  if (items.length > 0) {
    const inc = items.filter(i => i.isIncome);
    const exp = items.filter(i => !i.isIncome);
    if (inc.length > 0) {
      lines.push("Recurring income:");
      for (const i of inc.slice(0, 20)) lines.push(`  - ${i.name}: ${i.amount} ${i.frequency}`);
    }
    if (exp.length > 0) {
      lines.push("Recurring expenses:");
      for (const i of exp.slice(0, 30)) lines.push(`  - ${i.name}: ${i.amount} ${i.frequency} [${i.category}]`);
    }
  }
  if (goals.length > 0) {
    lines.push("Goals:");
    for (const g of goals) {
      const pct = g.target > 0 ? Math.min(100, (g.saved / g.target) * 100).toFixed(0) : 0;
      lines.push(`  - ${g.name}: ${g.saved}/${g.target} (${pct}%), saving ${g.monthlySaving || 0}/mo${g.deadline ? `, deadline ${g.deadline}` : ""}`);
    }
  }
  if (categoryBudgets && Object.keys(categoryBudgets).length > 0) {
    lines.push("Monthly category budgets:");
    for (const [k, v] of Object.entries(categoryBudgets)) if (v > 0) lines.push(`  - ${k}: ${v}`);
  }
  if (transactions.length > 0) {
    lines.push(`Recent transactions logged: ${transactions.length} total`);
  }
  return lines.join("\n");
}

export const SYSTEM_PROMPT = `You are a friendly, no-nonsense personal finance coach embedded in a budget app.

Guidelines:
- Be concise and actionable. Aim for 2-5 sentences unless the user asks for detail.
- Use the user's currency and actual numbers when making suggestions.
- Prioritize: emergency fund, high-interest debt, then goals/investing — in that order.
- Acknowledge trade-offs; don't be preachy.
- If asked something you can't answer from their data, ask a clarifying question.
- Never recommend specific investment products, stocks, or crypto.
- If you suggest an amount, make it concrete (e.g., "save $250/fortnight") tied to their actual numbers.
- Remind them this is educational guidance, not professional advice, only if they ask a major life-decision question (buying house, retiring, etc).
- Format: plain prose. Use short paragraphs. Bullet lists only when listing ≥3 items.

The user's financial data follows. Answer their questions based on it.`;

export async function askGemini({ apiKey, context, history, userMessage }) {
  if (!apiKey) throw new Error("No API key set");
  const contents = [];
  for (const m of history) {
    contents.push({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.text }] });
  }
  contents.push({ role: "user", parts: [{ text: userMessage }] });

  const body = {
    systemInstruction: { parts: [{ text: `${SYSTEM_PROMPT}\n\n---\nUSER DATA:\n${context}` }] },
    contents,
    generationConfig: { temperature: 0.6, maxOutputTokens: 1024 },
  };

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      msg = err?.error?.message || msg;
    } catch {}
    if (res.status === 400 && /API key/i.test(msg)) throw new Error("Invalid API key. Check it in Settings.");
    if (res.status === 429) throw new Error("Rate limit reached. Wait a moment and try again.");
    throw new Error(msg);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "";
  if (!text) throw new Error("Empty response from AI.");
  return text;
}

const AI_KEY_STORAGE = "budget-app-ai-key";
export function getStoredKey() { try { return localStorage.getItem(AI_KEY_STORAGE) || ""; } catch { return ""; } }
export function storeKey(k) { try { if (k) localStorage.setItem(AI_KEY_STORAGE, k); else localStorage.removeItem(AI_KEY_STORAGE); } catch {} }
