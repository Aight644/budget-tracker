export const SCHEMA_VERSION = 4;
export const STORAGE_KEY = "budget-app-v4";
export const LEGACY_KEY = "budget-app-v3";
export const BACKUP_KEY = "budget-app-v4-prev";

export const CATEGORIES = [
  { id: "income", label: "Income", icon: "↑", color: "#16a34a" },
  { id: "housing", label: "Housing", icon: "⌂", color: "#d97706" },
  { id: "transport", label: "Transport", icon: "⚡", color: "#2563eb" },
  { id: "subscriptions", label: "Subscriptions", icon: "♫", color: "#7c3aed" },
  { id: "utilities", label: "Utilities", icon: "◎", color: "#0891b2" },
  { id: "food", label: "Food & Groceries", icon: "✦", color: "#ea580c" },
  { id: "savings", label: "Savings", icon: "◆", color: "#059669" },
  { id: "personal", label: "Personal", icon: "★", color: "#db2777" },
  { id: "other", label: "Other", icon: "●", color: "#dc2626" },
];

export const CURRENCIES = [
  { code: "AUD", label: "Australian Dollar (A$)", locale: "en-AU" },
  { code: "USD", label: "US Dollar ($)", locale: "en-US" },
  { code: "EUR", label: "Euro (€)", locale: "en-IE" },
  { code: "GBP", label: "British Pound (£)", locale: "en-GB" },
  { code: "CAD", label: "Canadian Dollar (C$)", locale: "en-CA" },
  { code: "NZD", label: "New Zealand Dollar (NZ$)", locale: "en-NZ" },
  { code: "JPY", label: "Japanese Yen (¥)", locale: "ja-JP" },
  { code: "INR", label: "Indian Rupee (₹)", locale: "en-IN" },
  { code: "CHF", label: "Swiss Franc (CHF)", locale: "de-CH" },
  { code: "SGD", label: "Singapore Dollar (S$)", locale: "en-SG" },
  { code: "ZAR", label: "South African Rand (R)", locale: "en-ZA" },
  { code: "HKD", label: "Hong Kong Dollar (HK$)", locale: "en-HK" },
  { code: "CNY", label: "Chinese Yuan (¥)", locale: "zh-CN" },
  { code: "MXN", label: "Mexican Peso ($)", locale: "es-MX" },
  { code: "BRL", label: "Brazilian Real (R$)", locale: "pt-BR" },
];

export const DEFAULT_CURRENCY = "AUD";

export const FREQUENCIES = [
  { id: "weekly", label: "Weekly", multiplier: 52 },
  { id: "fortnightly", label: "Fortnightly", multiplier: 26 },
  { id: "monthly", label: "Monthly", multiplier: 12 },
  { id: "quarterly", label: "Quarterly", multiplier: 4 },
  { id: "yearly", label: "Yearly", multiplier: 1 },
];
