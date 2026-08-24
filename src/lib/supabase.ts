import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
  );
}

// Server-only client using the service role key. Never import this from
// client components — the whole app is already gated by the password
// session check in proxy.ts, so RLS is intentionally bypassed here.
export const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});
