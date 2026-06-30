"use server";

import { revalidatePath } from "next/cache";
import { createClient, requireUser } from "@/lib/supabase/server";
import { processarImagem } from "@/lib/upload";
import { fetchInstagramData, type SyncStep } from "@/lib/instagram-sync";
import { fetchTiktokData, refreshTiktokToken, TiktokAuthError } from "@/lib/tiktok-sync";
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
  const processada = await processarImagem(file);
  if ("error" in processada) return { error: processada.error };
  const path = `${pasta}/${crypto.randomUUID()}.${processada.ext}`;

  const { data, error } = await supabase.storage
    .from("media")
    .upload(path, processada.bytes, { contentType: processada.contentType });

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
  if (!(await requireUser())) return { ok: false, error: "Não autorizado." };
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
  if (!(await requireUser())) return { ok: false, error: "Não autorizado." };
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
  if (!(await requireUser())) return { ok: false, error: "Não autorizado." };
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
  await upsertMetricsDoMes(supabase, payload.metrics);

  revalidatePath("/admin/perfil");
  return { ok: true };
}

// Upsert da linha de métricas do mês corrente, gravando só os campos informados
// (preserva o que já existe na linha — IG e TikTok sincronizam de forma independente).
async function upsertMetricsDoMes(supabase: Client, metrics: SyncPayload["metrics"]) {
  if (!metrics || Object.keys(metrics).length === 0) return;

  const now = new Date();
  const mesRef = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const { data: existente } = await supabase
    .from("influencer_metrics")
    .select("id")
    .eq("reference_month", mesRef)
    .maybeSingle();

  if (existente) {
    await supabase.from("influencer_metrics").update(metrics).eq("id", existente.id);
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
      ...metrics,
    });
  }
}

// ── Sincronização sob demanda com a Display API do TikTok ───────────────────────
// Passo 1: garante token válido (refresh se preciso), busca dados e monta o preview.
export async function sincronizarTiktok(): Promise<SyncResult> {
  if (!(await requireUser())) return { ok: false, error: "Não autorizado." };
  const supabase = await createClient();

  const { data: perfil } = await supabase
    .from("influencer_profile")
    .select(
      "tiktok_access_token, tiktok_refresh_token, tiktok_token_expires_at, tiktok_refresh_expires_at",
    )
    .eq("id", PROFILE_ID)
    .maybeSingle();

  if (!perfil?.tiktok_refresh_token) {
    return { ok: false, error: "TikTok não está conectado. Conecte a conta primeiro." };
  }
  if (
    perfil.tiktok_refresh_expires_at &&
    new Date(perfil.tiktok_refresh_expires_at) < new Date()
  ) {
    return { ok: false, error: "A conexão com o TikTok expirou. Clique em Reconectar." };
  }

  // Token de acesso vale ~24h; renova quando ausente ou prestes a expirar (buffer 60s).
  let accessToken = perfil.tiktok_access_token ?? "";
  const expiraEm = perfil.tiktok_token_expires_at
    ? new Date(perfil.tiktok_token_expires_at).getTime()
    : 0;
  if (!accessToken || expiraEm <= Date.now() + 60_000) {
    try {
      const tokens = await refreshTiktokToken(perfil.tiktok_refresh_token);
      accessToken = tokens.accessToken;
      await supabase
        .from("influencer_profile")
        .update({
          tiktok_access_token: tokens.accessToken,
          tiktok_refresh_token: tokens.refreshToken,
          tiktok_token_expires_at: tokens.expiresAt,
          tiktok_refresh_expires_at: tokens.refreshExpiresAt,
        })
        .eq("id", PROFILE_ID);
    } catch (e) {
      if (e instanceof TiktokAuthError) {
        return { ok: false, error: "A conexão com o TikTok expirou. Clique em Reconectar." };
      }
      return { ok: false, error: "Não foi possível renovar a conexão com o TikTok." };
    }
  }

  const dados = await fetchTiktokData(accessToken);

  if (dados.authError) {
    return {
      ok: false,
      error: "A conexão com o TikTok expirou. Clique em Reconectar.",
      steps: dados.steps,
    };
  }
  if (!dados.perfil && !dados.media) {
    return {
      ok: false,
      error: "Não foi possível obter dados do TikTok. Veja os detalhes abaixo.",
      steps: dados.steps,
    };
  }

  const grupos: SyncGrupo[] = [];
  const perfilUpdate: Partial<InfluencerProfile> = {};
  const tkPartial: Partial<InfluencerMetrics> = {};

  if (dados.perfil) {
    perfilUpdate.tiktok_username = dados.perfil.username;
    perfilUpdate.tiktok_followers = dados.perfil.followers;
    perfilUpdate.tiktok_likes = dados.perfil.likes;
    perfilUpdate.tiktok_videos = dados.perfil.videos;
    tkPartial.tiktok_followers = dados.perfil.followers;
    grupos.push({
      titulo: "Perfil",
      descricao: "Valores atuais da conta",
      itens: [
        { label: "Seguidores", valor: fmtBR(dados.perfil.followers) },
        { label: "Curtidas (total)", valor: fmtBR(dados.perfil.likes), hint: "Curtidas acumuladas em toda a conta (vitalício)" },
        { label: "Vídeos", valor: fmtBR(dados.perfil.videos) },
      ],
    });
  }

  if (dados.media) {
    tkPartial.tiktok_views = dados.media.views;
    tkPartial.tiktok_likes = dados.media.likes;
    tkPartial.tiktok_shares = dados.media.shares;
    tkPartial.tiktok_interactions = dados.media.interactions;
    tkPartial.tiktok_engagement = dados.media.engagement;
    grupos.push({
      titulo: "Publicações",
      descricao: `Agregado dos vídeos dos últimos 28 dias (até ~2 dias atrás, como o app)${dados.media.videos ? ` · ${dados.media.videos} vídeo(s)` : ""}`,
      itens: [
        { label: "Visualizações", valor: fmtBR(dados.media.views), hint: "Soma das views dos vídeos do período" },
        { label: "Curtidas", valor: fmtBR(dados.media.likes), hint: "Soma das curtidas dos vídeos do período" },
        { label: "Compartilhamentos", valor: fmtBR(dados.media.shares), hint: "Soma dos compartilhamentos dos vídeos do período" },
        { label: "Interações", valor: fmtBR(dados.media.interactions), hint: "Curtidas + comentários + compartilhamentos dos vídeos do período" },
        { label: "Engajamento", valor: `${dados.media.engagement}%`, hint: "Calculado: interações ÷ visualizações × 100" },
      ],
    });
  }

  return {
    ok: true,
    steps: dados.steps,
    grupos,
    payload: {
      perfil: Object.keys(perfilUpdate).length > 0 ? perfilUpdate : null,
      metrics: Object.keys(tkPartial).length > 0 ? tkPartial : null,
    },
  };
}

// Passo 2: grava no banco o payload confirmado no modal (carimbo tiktok_synced_at).
export async function salvarSincronizacaoTiktok(payload: SyncPayload) {
  if (!(await requireUser())) return { ok: false, error: "Não autorizado." };
  const supabase = await createClient();

  if (payload.perfil) {
    const { error } = await supabase
      .from("influencer_profile")
      .update({ ...payload.perfil, tiktok_synced_at: new Date().toISOString() })
      .eq("id", PROFILE_ID);
    if (error) return { ok: false, error: "Erro ao salvar os dados do perfil." };
  }

  await upsertMetricsDoMes(supabase, payload.metrics);

  revalidatePath("/admin/perfil");
  return { ok: true };
}
