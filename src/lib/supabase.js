import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://eewjbbrlhoyqxoscppas.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVld2piYnJsaG95cXhvc2NwcGFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDQzNDUsImV4cCI6MjA5MjA4MDM0NX0.FulC4Oz3f1jTqDtCF83Wl83slVwD9s7VDwnqfqs97Go";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
