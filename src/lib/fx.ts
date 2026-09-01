import "server-only";
import { supabase } from "@/lib/supabase";

// Editable exchange rates for converting non-AED account balances into
// AED on the Net Worth page — same app_settings pattern as the AED/USD
// rate on the Investments tab. Rough ballpark defaults; edit on the page
// to match reality.
const DEFAULT_AED_PER_GBP = 4.65;
const DEFAULT_AED_PER_INR = 0.044;

export async function getAedPerGbpRate(): Promise<number> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "aed_per_gbp")
    .maybeSingle();
  if (error) throw error;
  return data?.value ?? DEFAULT_AED_PER_GBP;
}

export async function setAedPerGbpRate(rate: number): Promise<void> {
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "aed_per_gbp", value: rate }, { onConflict: "key" });
  if (error) throw error;
}

export async function getAedPerInrRate(): Promise<number> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "aed_per_inr")
    .maybeSingle();
  if (error) throw error;
  return data?.value ?? DEFAULT_AED_PER_INR;
}

export async function setAedPerInrRate(rate: number): Promise<void> {
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "aed_per_inr", value: rate }, { onConflict: "key" });
  if (error) throw error;
}
