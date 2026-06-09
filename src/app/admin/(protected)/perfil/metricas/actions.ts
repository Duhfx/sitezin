"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function parseNum(value: FormDataEntryValue | null): number {
  const n = Number(String(value ?? "").trim());
  return isNaN(n) ? 0 : n;
}

function toFirstOfMonth(yyyyMM: string): string {
  return `${yyyyMM}-01`;
}

export async function salvarMetricas(formData: FormData) {
  const supabase = await createClient();

  const mes = String(formData.get("reference_month") ?? "").trim();

  if (!mes) {
    return { ok: false, error: "Selecione o mês de referência." };
  }

  const { error } = await supabase.from("influencer_metrics").insert({
    reference_month: toFirstOfMonth(mes),
    instagram_followers: parseNum(formData.get("instagram_followers")),
    instagram_reach: parseNum(formData.get("instagram_reach")),
    instagram_impressions: parseNum(formData.get("instagram_impressions")),
    instagram_engagement: parseNum(formData.get("instagram_engagement")),
    tiktok_followers: parseNum(formData.get("tiktok_followers")),
    tiktok_views: parseNum(formData.get("tiktok_views")),
    tiktok_likes: parseNum(formData.get("tiktok_likes")),
    tiktok_engagement: parseNum(formData.get("tiktok_engagement")),
  });

  if (error) {
    return { ok: false, error: "Erro ao salvar métricas." };
  }

  revalidatePath("/admin/perfil");
  redirect("/admin/perfil?tab=metricas");
}

export async function editarMetricas(id: string, formData: FormData) {
  const supabase = await createClient();

  const mes = String(formData.get("reference_month") ?? "").trim();

  if (!mes) {
    return { ok: false, error: "Selecione o mês de referência." };
  }

  const { error } = await supabase
    .from("influencer_metrics")
    .update({
      reference_month: toFirstOfMonth(mes),
      instagram_followers: parseNum(formData.get("instagram_followers")),
      instagram_reach: parseNum(formData.get("instagram_reach")),
      instagram_impressions: parseNum(formData.get("instagram_impressions")),
      instagram_engagement: parseNum(formData.get("instagram_engagement")),
      tiktok_followers: parseNum(formData.get("tiktok_followers")),
      tiktok_views: parseNum(formData.get("tiktok_views")),
      tiktok_likes: parseNum(formData.get("tiktok_likes")),
      tiktok_engagement: parseNum(formData.get("tiktok_engagement")),
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: "Erro ao atualizar métricas." };
  }

  revalidatePath("/admin/perfil");
  redirect("/admin/perfil?tab=metricas");
}
