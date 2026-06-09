"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Case, Formato, TopEstado } from "@/types/database";

// Linha única do perfil (singleton). Mesmo UUID usado no seed SQL.
const PROFILE_ID = "00000000-0000-0000-0000-000000000001";

type Client = Awaited<ReturnType<typeof createClient>>;

async function uploadImagem(
  supabase: Client,
  file: File,
  pasta: string,
): Promise<{ url: string } | { error: string }> {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `${pasta}/${crypto.randomUUID()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { data, error } = await supabase.storage
    .from("media")
    .upload(path, bytes, { contentType: file.type });

  if (error) {
    return { error: `Erro ao fazer upload da imagem (${pasta}).` };
  }

  const { data: urlData } = supabase.storage.from("media").getPublicUrl(data.path);
  return { url: urlData.publicUrl };
}

function parseJsonList<T>(value: FormDataEntryValue | null): T[] {
  try {
    const parsed = JSON.parse(String(value ?? "[]"));
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function str(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

export async function salvarPerfil(formData: FormData) {
  const supabase = await createClient();

  const nome = str(formData.get("nome"));
  if (!nome) {
    return { ok: false, error: "Informe o nome." };
  }

  // ── Foto de perfil ──────────────────────────────────────────────
  let foto_url: string | null = str(formData.get("foto_url_atual")) || null;
  const foto = formData.get("foto") as File | null;
  if (foto && foto.size > 0) {
    const result = await uploadImagem(supabase, foto, "perfil");
    if ("error" in result) return { ok: false, error: result.error };
    foto_url = result.url;
  }

  // ── Moodboard (3 imagens, posições fixas) ───────────────────────
  const moodboard: string[] = [];
  for (let i = 0; i < 3; i++) {
    let url = str(formData.get(`moodboard_url_atual_${i}`)) || "";
    const file = formData.get(`moodboard_${i}`) as File | null;
    if (file && file.size > 0) {
      const result = await uploadImagem(supabase, file, "moodboard");
      if ("error" in result) return { ok: false, error: result.error };
      url = result.url;
    }
    if (url) moodboard.push(url);
  }

  const { error } = await supabase.from("influencer_profile").upsert({
    id: PROFILE_ID,
    nome,
    foto_url,
    biografia: str(formData.get("biografia")),
    nicho: str(formData.get("nicho")),
    publico_alvo: str(formData.get("publico_alvo")),
    top_estados: parseJsonList<TopEstado>(formData.get("top_estados")),
    instagram_url: str(formData.get("instagram_url")) || null,
    tiktok_url: str(formData.get("tiktok_url")) || null,
    youtube_url: str(formData.get("youtube_url")) || null,
    formatos: parseJsonList<Formato>(formData.get("formatos")),
    cases: parseJsonList<Case>(formData.get("cases")),
    moodboard,
    email: str(formData.get("email")) || null,
    whatsapp: str(formData.get("whatsapp")) || null,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { ok: false, error: "Erro ao salvar o perfil." };
  }

  revalidatePath("/admin/perfil");
  return { ok: true };
}
