"use server";

import { revalidatePath } from "next/cache";
import { createClient, requireUser } from "@/lib/supabase/server";

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function gerarSlug(length = 8): string {
  const bytes = new Uint8Array(length * 2);
  crypto.getRandomValues(bytes);
  let result = "";
  for (const byte of bytes) {
    if (result.length === length) break;
    if (byte < 248) result += BASE62[byte % 62];
  }
  return result.length === length ? result : gerarSlug(length);
}

export async function aprovarSolicitacao(id: string, expiresAtDate?: string) {
  if (!(await requireUser())) return { ok: false, error: "Não autorizado." };
  const supabase = await createClient();

  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const token = Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const slug = gerarSlug();

  const { error: statusError } = await supabase
    .from("media_kit_requests")
    .update({ status: "aprovado" })
    .eq("id", id);

  if (statusError) return { ok: false, error: "Erro ao aprovar solicitação." };

  // expiresAtDate vem como "YYYY-MM-DD" do formulário; vazio = sem expiração.
  let expiresAt: string | null = null;
  if (expiresAtDate) {
    const d = new Date(`${expiresAtDate}T23:59:59`);
    if (Number.isNaN(d.getTime())) return { ok: false, error: "Data de validade inválida." };
    expiresAt = d.toISOString();
  }

  const { error: accessError } = await supabase
    .from("media_kit_access")
    .insert({ request_id: id, token, slug, expires_at: expiresAt });

  if (accessError) return { ok: false, error: "Erro ao gerar token de acesso." };

  // TODO Fase 5: enviar e-mail de aprovação com link do mídia kit

  revalidatePath("/admin/solicitacoes");
  revalidatePath(`/admin/solicitacoes/${id}`);
  return { ok: true };
}

export async function reprovarSolicitacao(id: string) {
  if (!(await requireUser())) return { ok: false, error: "Não autorizado." };
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

export async function revogarAcesso(accessId: string, requestId?: string) {
  if (!(await requireUser())) return { ok: false, error: "Não autorizado." };
  const supabase = await createClient();

  const { error } = await supabase
    .from("media_kit_access")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", accessId);

  if (error) return { ok: false, error: "Erro ao revogar acesso." };

  revalidatePath("/admin/solicitacoes");
  if (requestId) revalidatePath(`/admin/solicitacoes/${requestId}`);
  return { ok: true };
}

export async function gerarLinkDireto(
  label: string,
  expiresAtDate?: string,
): Promise<
  | { ok: true; data: import("@/types/database").MediaKitAccess }
  | { ok: false; error: string }
> {
  if (!(await requireUser())) return { ok: false, error: "Não autorizado." };
  if (!label.trim()) return { ok: false, error: "Identificação é obrigatória." };

  const supabase = await createClient();

  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const token = Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const slug = gerarSlug();

  let expiresAt: string | null = null;
  if (expiresAtDate) {
    const d = new Date(`${expiresAtDate}T23:59:59`);
    if (Number.isNaN(d.getTime())) return { ok: false, error: "Data de validade inválida." };
    expiresAt = d.toISOString();
  }

  const { data, error } = await supabase
    .from("media_kit_access")
    .insert({ token, slug, label: label.trim(), expires_at: expiresAt })
    .select()
    .single();

  if (error || !data) return { ok: false, error: "Erro ao gerar link de acesso." };

  revalidatePath("/admin/solicitacoes");
  return { ok: true, data };
}
