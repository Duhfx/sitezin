"use server";

import { createClient } from "@/lib/supabase/server";

export type SolicitacaoResult = { ok: true } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function criarSolicitacao(
  formData: FormData
): Promise<SolicitacaoResult> {
  const nome = String(formData.get("nome") ?? "").trim();
  const empresa = String(formData.get("empresa") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const instagram_empresa = String(formData.get("instagram_empresa") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();

  // Validação server-side (o client espelha estas regras, mas é burlável).
  if (!nome || !empresa || !email || !descricao) {
    return { ok: false, error: "Preencha todos os campos obrigatórios." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Informe um e-mail válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("media_kit_requests").insert({
    nome,
    empresa,
    cargo: "Não aplicável", // Fallback seguro caso a coluna seja NOT NULL no banco
    email,
    whatsapp: whatsapp || null,
    instagram_empresa: instagram_empresa || null,
    descricao,
    status: "pendente",
  });

  if (error) {
    console.error("Erro ao criar solicitação:", error.message);
    return { ok: false, error: "Não foi possível enviar. Tente novamente." };
  }

  return { ok: true };
}
