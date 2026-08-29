import type { SupabaseClient } from "@supabase/supabase-js";

export type StudioState = {
  computers: any[];
  software: any[];
  plugins: any[];
  endpoints: any[];
  connections: any[];
  observations: any[];
  gear: any[];
  documents: any[];
};

export async function loadStudioState(sb: SupabaseClient): Promise<StudioState> {
  const tables = [
    "computers", "software", "plugins", "endpoints",
    "connections", "observations", "gear", "documents",
  ] as const;
  const results = await Promise.all(tables.map((table) => sb.from(table).select("*")));
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
  return Object.fromEntries(tables.map((table, i) => [table, results[i].data || []])) as StudioState;
}

export function formatWhen(value?: string | null) {
  if (!value) return "unknown";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
