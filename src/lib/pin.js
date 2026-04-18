const PIN_KEY = "budget-app-pin-hash";

export async function hashPin(pin) {
  const buf = new TextEncoder().encode(pin);
  const h = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function getStoredPinHash() { try { return localStorage.getItem(PIN_KEY) || ""; } catch { return ""; } }
export function storePinHash(hash) { try { if (hash) localStorage.setItem(PIN_KEY, hash); else localStorage.removeItem(PIN_KEY); } catch {} }
