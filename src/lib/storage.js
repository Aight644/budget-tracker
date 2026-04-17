import { SCHEMA_VERSION, STORAGE_KEY, LEGACY_KEY, BACKUP_KEY } from "./constants.js";

export function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const d = JSON.parse(legacy);
      return { version: SCHEMA_VERSION, ...d };
    }
  } catch (e) {}
  return null;
}

export function saveStored(data) {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) localStorage.setItem(BACKUP_KEY, current);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, ...data }));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message || "Failed to save" };
  }
}

export function clearStored() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_KEY);
  } catch (e) {}
}
