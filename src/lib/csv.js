export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\r") { /* skip */ }
      else if (c === "\n") { row.push(field); field = ""; rows.push(row); row = []; }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => (v || "").trim() !== ""));
}

export function parseDate(s, preferred = "DMY") {
  if (!s) return null;
  const t = s.trim();
  let m;
  // ISO YYYY-MM-DD or YYYY/MM/DD
  m = t.match(/^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})$/);
  if (m) {
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    if (d.getFullYear() === +m[1]) return d;
  }
  // DD/MM/YYYY or MM/DD/YYYY
  m = t.match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{2,4})$/);
  if (m) {
    let a = +m[1], b = +m[2], y = +m[3];
    if (y < 100) y += y < 50 ? 2000 : 1900;
    let day, mon;
    if (preferred === "MDY") { mon = a; day = b; }
    else { day = a; mon = b; }
    if (mon > 12 && day <= 12) { [day, mon] = [mon, day]; }
    const d = new Date(y, mon - 1, day);
    if (d.getFullYear() === y) return d;
  }
  // Try Date.parse fallback (e.g. "15 Jan 2024")
  const d = new Date(t);
  if (!isNaN(d.getTime())) return d;
  return null;
}

export function parseAmount(s) {
  if (s == null) return NaN;
  let t = String(s).trim();
  if (!t) return NaN;
  const neg = /^\(.*\)$/.test(t) || /^-/.test(t) || /\bDR\b/i.test(t);
  t = t.replace(/[()$,€£¥₹\s]|AUD|USD|EUR|GBP|CR|DR/gi, "");
  const n = parseFloat(t);
  if (!isFinite(n)) return NaN;
  return neg && n > 0 ? -n : n;
}

export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function detectColumns(rows, preferred = "DMY") {
  if (rows.length < 2) return null;
  const headers = rows[0].map((h) => (h || "").toLowerCase().trim());
  const body = rows.slice(1);
  const ncol = rows[0].length;

  const scoreDate = Array(ncol).fill(0);
  const scoreAmount = Array(ncol).fill(0);
  const scoreText = Array(ncol).fill(0);
  for (const r of body) {
    for (let c = 0; c < ncol; c++) {
      const v = r[c] || "";
      if (parseDate(v, preferred)) scoreDate[c]++;
      const n = parseAmount(v);
      if (isFinite(n) && v.trim() !== "") scoreAmount[c]++;
      if (/[a-zA-Z]{3,}/.test(v)) scoreText[c]++;
    }
  }

  const headerHint = (needles) => headers.findIndex((h) => needles.some((n) => h.includes(n)));

  let dateIdx = headerHint(["date", "posted", "transaction date"]);
  if (dateIdx < 0) dateIdx = scoreDate.indexOf(Math.max(...scoreDate));

  let descIdx = headerHint(["description", "narrative", "details", "memo", "payee", "merchant", "reference"]);
  if (descIdx < 0) {
    let best = -1, bestScore = -1;
    for (let c = 0; c < ncol; c++) {
      if (c === dateIdx) continue;
      if (scoreText[c] > bestScore) { bestScore = scoreText[c]; best = c; }
    }
    descIdx = best;
  }

  let debitIdx = headerHint(["debit", "withdrawal", "withdraw", "paid out"]);
  let creditIdx = headerHint(["credit", "deposit", "paid in"]);
  let amountIdx = headerHint(["amount", "value"]);
  if (debitIdx < 0 && creditIdx < 0 && amountIdx < 0) {
    let best = -1, bestScore = -1;
    for (let c = 0; c < ncol; c++) {
      if (c === dateIdx || c === descIdx) continue;
      if (scoreAmount[c] > bestScore) { bestScore = scoreAmount[c]; best = c; }
    }
    amountIdx = best;
  }

  return { dateIdx, descIdx, amountIdx, debitIdx, creditIdx, hasHeader: true };
}

export function rowsToTransactions(rows, map, preferred = "DMY") {
  const body = map.hasHeader ? rows.slice(1) : rows;
  const out = [];
  for (const r of body) {
    const dateStr = r[map.dateIdx] || "";
    const d = parseDate(dateStr, preferred);
    if (!d) continue;
    const note = (r[map.descIdx] || "").trim();
    let amount;
    if (map.amountIdx >= 0 && map.amountIdx < r.length) {
      amount = parseAmount(r[map.amountIdx]);
    } else {
      const deb = map.debitIdx >= 0 ? parseAmount(r[map.debitIdx]) : NaN;
      const cr = map.creditIdx >= 0 ? parseAmount(r[map.creditIdx]) : NaN;
      if (isFinite(deb) && deb !== 0) amount = -Math.abs(deb);
      else if (isFinite(cr) && cr !== 0) amount = Math.abs(cr);
      else continue;
    }
    if (!isFinite(amount) || amount === 0) continue;
    out.push({
      date: toISODate(d),
      note,
      amount: Math.abs(amount),
      isIncome: amount > 0,
    });
  }
  return out;
}
