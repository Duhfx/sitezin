import { createClient } from "@/lib/supabase/server";
import type { Coupon } from "@/types/database";

/**
 * Cupons ativos para a listagem pública.
 * O filtro `ativo=true` é explícito (e não apenas via RLS) para garantir que,
 * mesmo a admin logada vendo a página pública, só apareçam cupons ativos.
 */
export async function getCuponsAtivos(): Promise<Coupon[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("ativo", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar cupons:", error.message);
    return [];
  }

  return data ?? [];
}
