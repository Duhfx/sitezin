"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function aprovarSolicitacao(id: string) {
  const supabase = await createClient();

  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const token = Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const { error: statusError } = await supabase
    .from("media_kit_requests")
    .update({ status: "aprovado" })
    .eq("id", id);

  if (statusError) return { ok: false, error: "Erro ao aprovar solicitação." };

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);

  const { error: accessError } = await supabase
    .from("media_kit_access")
    .insert({ request_id: id, token, expires_at: expiresAt.toISOString() });

  if (accessError) return { ok: false, error: "Erro ao gerar token de acesso." };

  // TODO Fase 5: enviar e-mail de aprovação com link do mídia kit

  revalidatePath("/admin/solicitacoes");
  revalidatePath(`/admin/solicitacoes/${id}`);
  return { ok: true };
}

export async function reprovarSolicitacao(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("media_kit_requests")
    .update({ status: "reprovado" })
    .eq("id", id);

  if (error) return { ok: false, error: "Erro ao reprovar solicitação." };

  // TODO Fase 5: enviar e-mail de reprovação

  revalidatePath("/admin/solicitacoes");
  revalidatePath(`/admin/solicitacoes/${id}`);
  return { ok: true };
}

export async function revogarAcesso(accessId: string, requestId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("media_kit_access")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", accessId);

  if (error) return { ok: false, error: "Erro ao revogar acesso." };

  revalidatePath("/admin/solicitacoes");
  revalidatePath(`/admin/solicitacoes/${requestId}`);
  return { ok: true };
}
