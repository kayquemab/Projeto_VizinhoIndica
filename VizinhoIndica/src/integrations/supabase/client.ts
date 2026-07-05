import { createClient } from "@supabase/supabase-js";
import type { Database } from "./db-types";

// Public config — anon/publishable key is safe to expose (RLS enforces access).
const SUPABASE_URL = "https://qibxusriyfqclinowmjg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpYnh1c3JpeWZxY2xpbm93bWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3ODIzMzgsImV4cCI6MjA5ODM1ODMzOH0.clB-6o38FKIqP4-qhh919ZbG9oEQE4WgsljZN1D_FfU";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export { SUPABASE_URL };
