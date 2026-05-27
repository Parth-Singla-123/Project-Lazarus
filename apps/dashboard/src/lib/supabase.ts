import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  // It's fine for dev to not have env vars set — code will still import.
  // Runtime will log an error when attempting requests.
  // Keep this lightweight and safe for client usage.
  // eslint-disable-next-line no-console
  console.warn("[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not set");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

export type HealingEvent = {
  id?: string;
  script_id?: string | null;
  target_description?: string | null;
  old_selector?: string | null;
  new_selector?: string | null;
  screenshot_base64?: string | null;
  status?: "PENDING" | "HEALED" | "FAILED" | string;
  created_at?: string | null;
  error_stack?: string | null;
};

