"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";
import { autoSyncAll, type AutoSyncResult } from "@/lib/sync-auto";

export type SyncDashboardResult =
  | { ok: true; result: AutoSyncResult }
  | { ok: false; error: string };

export async function sincronizarMetricasDashboard(): Promise<SyncDashboardResult> {
  if (!(await requireUser())) return { ok: false, error: "Não autorizado." };

  const result = await autoSyncAll("manual");
  revalidatePath("/admin/dashboard");

  return { ok: true, result };
}
