"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fetchInstagramData, type SyncStep } from "@/lib/instagram-sync";
import type {
  AudienciaGenero,
  AudienciaIdade,
  Case,
  Formato,
  InfluencerMetrics,
  InfluencerProfile,
  TopEstado,
} from "@/types/database";

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
    localizacao: str(formData.get("localizacao")) || null,
    top_estados: parseJsonList<TopEstado>(formData.get("top_estados")),
    audiencia_genero: parseJsonList<AudienciaGenero>(formData.get("audiencia_genero")),
    audiencia_idade: parseJsonList<AudienciaIdade>(formData.get("audiencia_idade")),
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

// ── Sincronização sob demanda com a Graph API do Instagram ──────────────────────
function fmtBR(n: number) {
  return n.toLocaleString("pt-BR");
}

export type SyncCampo = { label: string; valor: string; hint?: string };
export type SyncGrupo = { titulo: string; descricao?: string; itens: SyncCampo[] };
// Dados crus prontos para gravar — devolvidos no preview e reenviados ao salvar.
export type SyncPayload = {
  perfil: Partial<InfluencerProfile> | null;
  metrics: Partial<InfluencerMetrics> | null;
};
export type SyncResult = {
  ok: boolean;
  error?: string;
  steps?: SyncStep[];
  grupos?: SyncGrupo[];
  payload?: SyncPayload;
};

// ── Passo 1: busca os dados na Graph API e monta o preview (NÃO grava) ──────────
export async function sincronizarInstagram(): Promise<SyncResult> {
  const supabase = await createClient();

  const { data: perfil } = await supabase
    .from("influencer_profile")
    .select("meta_access_token, instagram_user_id, meta_token_expires_at")
    .eq("id", PROFILE_ID)
    .maybeSingle();

  if (!perfil?.meta_access_token || !perfil?.instagram_user_id) {
    return { ok: false, error: "Instagram não está conectado. Conecte a conta primeiro." };
  }
  if (perfil.meta_token_expires_at && new Date(perfil.meta_token_expires_at) < new Date()) {
    return { ok: false, error: "A conexão com o Instagram expirou. Clique em Reconectar." };
  }

  const dados = await fetchInstagramData(perfil.instagram_user_id, perfil.meta_access_token);

  if (dados.authError) {
    return {
      ok: false,
      error: "A conexão com o Instagram expirou. Clique em Reconectar.",
      steps: dados.steps,
    };
  }

  // Nenhuma etapa essencial veio — não há o que gravar.
  if (!dados.perfil && !dados.insights && !dados.media) {
    return {
      ok: false,
      error: "Não foi possível obter dados do Instagram. Veja os detalhes abaixo.",
      steps: dados.steps,
    };
  }

  const grupos: SyncGrupo[] = [];

  // ── Perfil: campos-espelho + demografia (não sobrescreve conteúdo editorial) ──
  const perfilUpdate: Partial<InfluencerProfile> = {};

  if (dados.perfil) {
    perfilUpdate.instagram_username = dados.perfil.username;
    perfilUpdate.instagram_followers = dados.perfil.followers;
    perfilUpdate.instagram_posts = dados.perfil.posts;
    grupos.push({
      titulo: "Perfil",
      descricao: "Valores atuais da conta",
      itens: [
        { label: "Seguidores", valor: fmtBR(dados.perfil.followers) },
        { label: "Posts", valor: fmtBR(dados.perfil.posts) },
      ],
    });
  }

  // Só inclui demografia quando a API retornou algo — evita zerar dados existentes.
  const demoItens: SyncCampo[] = [];
  if (dados.demografia.genero.length > 0) {
    perfilUpdate.audiencia_genero = dados.demografia.genero;
    demoItens.push({
      label: "Gênero",
      valor: dados.demografia.genero.map((g) => `${g.label} ${g.pct}%`).join(", "),
    });
  }
  if (dados.demografia.idade.length > 0) {
    perfilUpdate.audiencia_idade = dados.demografia.idade;
    demoItens.push({
      label: "Faixa etária",
      valor: dados.demografia.idade.map((a) => `${a.faixa} ${a.pct}%`).join(", "),
    });
  }
  if (dados.demografia.localidades.length > 0) {
    perfilUpdate.top_estados = dados.demografia.localidades;
    demoItens.push({
      label: "Top localidades",
      valor: dados.demografia.localidades.map((l) => `${l.uf} ${l.pct}%`).join(", "),
    });
  }
  if (demoItens.length > 0)
    grupos.push({
      titulo: "Demografia",
      descricao: "2 principais de cada categoria · base: seguidores com dados disponíveis",
      itens: demoItens,
    });

  // ── Métricas do mês: monta só os campos que vieram ──
  const igPartial: Partial<InfluencerMetrics> = {};
  const contaItens: SyncCampo[] = [];
  const midiaItens: SyncCampo[] = [];

  if (dados.perfil) igPartial.instagram_followers = dados.perfil.followers;
  if (dados.insights) {
    igPartial.instagram_reach = dados.insights.reach;
    igPartial.instagram_impressions = dados.insights.views;
    igPartial.instagram_engagement = dados.insights.engagement;
    igPartial.instagram_interactions = dados.insights.interactions;
    contaItens.push(
      { label: "Alcance", valor: fmtBR(dados.insights.reach), hint: "Contas únicas alcançadas no período" },
      { label: "Visualizações", valor: fmtBR(dados.insights.views), hint: "Total de visualizações no período (substitui 'impressões')" },
      { label: "Interações", valor: fmtBR(dados.insights.interactions), hint: "Curtidas + comentários + salvamentos + compartilhamentos em Reels e posts no período (não inclui Stories)" },
      { label: "Engajamento", valor: `${dados.insights.engagement}%`, hint: "Calculado: interações ÷ alcance × 100" },
    );
  }
  if (dados.media) {
    igPartial.instagram_saves = dados.media.saves;
    igPartial.instagram_shares = dados.media.shares;
    midiaItens.push(
      { label: "Salvamentos", valor: fmtBR(dados.media.saves), hint: "Soma das publicações dos últimos 30 dias" },
      { label: "Compartilhamentos", valor: fmtBR(dados.media.shares), hint: "Soma das publicações dos últimos 30 dias" },
    );
  }
  if (contaItens.length > 0)
    grupos.push({
      titulo: "Métricas da conta",
      descricao: "Agregado dos últimos 30 dias",
      itens: contaItens,
    });
  if (midiaItens.length > 0)
    grupos.push({
      titulo: "Publicações",
      descricao: "Agregado das publicações dos últimos 30 dias",
      itens: midiaItens,
    });

  return {
    ok: true,
    steps: dados.steps,
    grupos,
    payload: {
      perfil: Object.keys(perfilUpdate).length > 0 ? perfilUpdate : null,
      metrics: Object.keys(igPartial).length > 0 ? igPartial : null,
    },
  };
}

// ── Passo 2: grava no banco o payload confirmado no modal ──────────────────────
export async function salvarSincronizacao(payload: SyncPayload) {
  const supabase = await createClient();

  // Perfil: campos-espelho + demografia + carimbo de sincronização.
  if (payload.perfil) {
    const { error } = await supabase
      .from("influencer_profile")
      .update({ ...payload.perfil, instagram_synced_at: new Date().toISOString() })
      .eq("id", PROFILE_ID);
    if (error) return { ok: false, error: "Erro ao salvar os dados do perfil." };
  }

  // Métricas: upsert da linha do mês corrente (só os campos do Instagram).
  if (payload.metrics && Object.keys(payload.metrics).length > 0) {
    const now = new Date();
    const mesRef = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    const { data: existente } = await supabase
      .from("influencer_metrics")
      .select("id")
      .eq("reference_month", mesRef)
      .maybeSingle();

    if (existente) {
      await supabase.from("influencer_metrics").update(payload.metrics).eq("id", existente.id);
    } else {
      await supabase.from("influencer_metrics").insert({
        reference_month: mesRef,
        instagram_followers: 0,
        instagram_reach: 0,
        instagram_impressions: 0,
        instagram_engagement: 0,
        instagram_interactions: 0,
        instagram_shares: 0,
        instagram_saves: 0,
        tiktok_followers: 0,
        tiktok_views: 0,
        tiktok_likes: 0,
        tiktok_engagement: 0,
        tiktok_interactions: 0,
        tiktok_shares: 0,
        tiktok_saves: 0,
        ...payload.metrics,
      });
    }
  }

  revalidatePath("/admin/perfil");
  return { ok: true };
}
