"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, requireUser } from "@/lib/supabase/server";
import { processarImagem } from "@/lib/upload";

export async function criarCupom(formData: FormData) {
  if (!(await requireUser())) {
    return { ok: false, error: "Não autorizado." };
  }
  const supabase = await createClient();

  const marca = String(formData.get("marca") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const cupom = String(formData.get("cupom") ?? "").trim();
  const affiliate_url = String(formData.get("affiliate_url") ?? "").trim();
  const logo = formData.get("logo") as File | null;

  if (!marca || !descricao || !cupom) {
    return { ok: false, error: "Preencha todos os campos obrigatórios." };
  }

  let logo_url: string | null = null;

  if (logo && logo.size > 0) {
    const processada = await processarImagem(logo);
    if ("error" in processada) return { ok: false, error: processada.error };
    const path = `logos/${crypto.randomUUID()}.${processada.ext}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("media")
      .upload(path, processada.bytes, { contentType: processada.contentType });

    if (uploadError) {
      return { ok: false, error: "Erro ao fazer upload da logo." };
    }

    const { data: urlData } = supabase.storage
      .from("media")
      .getPublicUrl(uploadData.path);
    logo_url = urlData.publicUrl;
  }

  const { error } = await supabase
    .from("coupons")
    .insert({ marca, descricao, cupom, affiliate_url, logo_url, ativo: true });

  if (error) {
    return { ok: false, error: "Erro ao salvar cupom." };
  }

  revalidatePath("/admin/cupons");
  redirect("/admin/cupons");
}

export async function editarCupom(id: string, formData: FormData) {
  if (!(await requireUser())) {
    return { ok: false, error: "Não autorizado." };
  }
  const supabase = await createClient();

  const marca = String(formData.get("marca") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const cupom = String(formData.get("cupom") ?? "").trim();
  const affiliate_url = String(formData.get("affiliate_url") ?? "").trim();
  const logo = formData.get("logo") as File | null;
  const logo_url_atual = String(formData.get("logo_url_atual") ?? "") || null;

  if (!marca || !descricao || !cupom) {
    return { ok: false, error: "Preencha todos os campos obrigatórios." };
  }

  let logo_url: string | null = logo_url_atual;

  if (logo && logo.size > 0) {
    const processada = await processarImagem(logo);
    if ("error" in processada) return { ok: false, error: processada.error };
    const path = `logos/${crypto.randomUUID()}.${processada.ext}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("media")
      .upload(path, processada.bytes, { contentType: processada.contentType });

    if (uploadError) {
      return { ok: false, error: "Erro ao fazer upload da logo." };
    }

    const { data: urlData } = supabase.storage
      .from("media")
      .getPublicUrl(uploadData.path);
    logo_url = urlData.publicUrl;
  }

  const { error } = await supabase
    .from("coupons")
    .update({ marca, descricao, cupom, affiliate_url, logo_url })
    .eq("id", id);

  if (error) {
    return { ok: false, error: "Erro ao atualizar cupom." };
  }

  revalidatePath("/admin/cupons");
  redirect("/admin/cupons");
}

export async function toggleAtivoCupom(id: string, ativo: boolean) {
  if (!(await requireUser())) {
    return { ok: false, error: "Não autorizado." };
  }
  const supabase = await createClient();

  const { error } = await supabase
    .from("coupons")
    .update({ ativo })
    .eq("id", id);

  if (error) {
    return { ok: false, error: "Erro ao atualizar status." };
  }

  revalidatePath("/admin/cupons");
  return { ok: true };
}

export async function removerCupom(id: string) {
  if (!(await requireUser())) {
    return { ok: false, error: "Não autorizado." };
  }
  const supabase = await createClient();

  const { error } = await supabase.from("coupons").delete().eq("id", id);

  if (error) {
    return { ok: false, error: "Erro ao remover cupom." };
  }

  revalidatePath("/admin/cupons");
  return { ok: true };
}
