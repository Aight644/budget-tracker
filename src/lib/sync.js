import { supabase } from "./supabase.js";

// Pulls user data blob from Supabase
export async function pullUserData(userId) {
  const { data, error } = await supabase
    .from("user_data")
    .select("data, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Pushes the whole state blob to Supabase
export async function pushUserData(userId, blob) {
  const payload = {
    user_id: userId,
    data: blob,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("user_data")
    .upsert(payload, { onConflict: "user_id" });
  if (error) throw error;
}

// Debounced push helper
let pushTimer = null;
export function schedulePush(userId, blob, delay = 1500) {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushUserData(userId, blob).catch((e) => console.warn("Sync push failed:", e.message));
  }, delay);
}

// ── Auth helpers ────────────────────────────────────
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user || null;
}

export function onAuthChange(cb) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session?.user || null));
  return () => data.subscription.unsubscribe();
}
