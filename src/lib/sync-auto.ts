import { createClient } from "@supabase/supabase-js";
import { fetchInstagramData, InstagramAuthError } from "./instagram-sync";
import { fetchTiktokData, refreshTiktokToken, TiktokAuthError } from "./tiktok-sync";
import type { Database, InfluencerMetrics, InfluencerProfile } from "@/types/database";

const PROFILE_ID = "00000000-0000-0000-0000-000000000001";

function serviceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  );
}

export type PlatformResult = { ok: boolean; error?: string; authExpired?: boolean };
export type AutoSyncResult = { instagram: PlatformResult; tiktok: PlatformResult };
export type SyncSource = "cron" | "manual";

// Grava o histórico de uma execução de sync. Resiliente: se a tabela
// sync_logs não existir ou a escrita falhar, não derruba o sync.
async function registrarLog(
  supabase: ReturnType<typeof serviceClient>,
  platform: "instagram" | "tiktok",
  resultado: PlatformResult,
  source: SyncSource,
) {
  try {
    await supabase.from("sync_logs").insert({
      platform,
      status: resultado.ok ? "ok" : "erro",
      error: resultado.ok ? null : (resultado.error ?? null),
      source,
    });
  } catch {
    // Log é best-effort — nunca interrompe a sincronização.
  }
}

async function upsertMetricsDoMes(
  supabase: ReturnType<typeof serviceClient>,
  metrics: Partial<InfluencerMetrics>,
) {
  if (Object.keys(metrics).length === 0) return;

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

export async function autoSyncInstagram(): Promise<PlatformResult> {
  const supabase = serviceClient();

  const { data: perfil } = await supabase
    .from("influencer_profile")
    .select("meta_access_token, instagram_user_id, meta_token_expires_at")
    .eq("id", PROFILE_ID)
    .maybeSingle();

  if (!perfil?.meta_access_token || !perfil?.instagram_user_id) {
    return { ok: false, error: "Instagram não conectado." };
  }
  if (perfil.meta_token_expires_at && new Date(perfil.meta_token_expires_at) < new Date()) {
    return { ok: false, error: "Token do Instagram expirou.", authExpired: true };
  }

  try {
    const dados = await fetchInstagramData(perfil.instagram_user_id, perfil.meta_access_token);

    if (dados.authError) {
      return { ok: false, error: "Token do Instagram expirou.", authExpired: true };
    }

    const profileUpdate: Partial<InfluencerProfile> = {
      instagram_synced_at: new Date().toISOString(),
    };
    const metricsUpdate: Partial<InfluencerMetrics> = {};

    if (dados.perfil) {
      profileUpdate.instagram_username = dados.perfil.username;
      profileUpdate.instagram_followers = dados.perfil.followers;
      profileUpdate.instagram_posts = dados.perfil.posts;
      metricsUpdate.instagram_followers = dados.perfil.followers;
    }
    if (dados.insights) {
      metricsUpdate.instagram_reach = dados.insights.reach;
      metricsUpdate.instagram_impressions = dados.insights.views;
      metricsUpdate.instagram_engagement = dados.insights.engagement;
      metricsUpdate.instagram_interactions = dados.insights.interactions;
    }
    if (dados.media) {
      metricsUpdate.instagram_saves = dados.media.saves;
      metricsUpdate.instagram_shares = dados.media.shares;
    }
    if (dados.demografia.genero.length > 0) {
      profileUpdate.audiencia_genero = dados.demografia.genero;
    }
    if (dados.demografia.idade.length > 0) {
      profileUpdate.audiencia_idade = dados.demografia.idade;
    }
    if (dados.demografia.localidades.length > 0) {
      profileUpdate.top_estados = dados.demografia.localidades;
    }

    await supabase.from("influencer_profile").update(profileUpdate).eq("id", PROFILE_ID);
    await upsertMetricsDoMes(supabase, metricsUpdate);

    return { ok: true };
  } catch (e) {
    if (e instanceof InstagramAuthError) {
      return { ok: false, error: "Token do Instagram expirou.", authExpired: true };
    }
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao sincronizar Instagram.",
    };
  }
}

export async function autoSyncTiktok(): Promise<PlatformResult> {
  const supabase = serviceClient();

  const { data: perfil } = await supabase
    .from("influencer_profile")
    .select(
      "tiktok_access_token, tiktok_refresh_token, tiktok_token_expires_at, tiktok_refresh_expires_at",
    )
    .eq("id", PROFILE_ID)
    .maybeSingle();

  if (!perfil?.tiktok_refresh_token) {
    return { ok: false, error: "TikTok não conectado." };
  }
  if (
    perfil.tiktok_refresh_expires_at &&
    new Date(perfil.tiktok_refresh_expires_at) < new Date()
  ) {
    return { ok: false, error: "Conexão com TikTok expirou.", authExpired: true };
  }

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
        return { ok: false, error: "Conexão com TikTok expirou.", authExpired: true };
      }
      return { ok: false, error: "Não foi possível renovar a conexão com o TikTok." };
    }
  }

  try {
    const dados = await fetchTiktokData(accessToken);

    if (dados.authError) {
      return { ok: false, error: "Conexão com TikTok expirou.", authExpired: true };
    }

    const profileUpdate: Partial<InfluencerProfile> = {
      tiktok_synced_at: new Date().toISOString(),
    };
    const metricsUpdate: Partial<InfluencerMetrics> = {};

    if (dados.perfil) {
      profileUpdate.tiktok_username = dados.perfil.username;
      profileUpdate.tiktok_followers = dados.perfil.followers;
      profileUpdate.tiktok_likes = dados.perfil.likes;
      profileUpdate.tiktok_videos = dados.perfil.videos;
      metricsUpdate.tiktok_followers = dados.perfil.followers;
    }
    if (dados.media) {
      metricsUpdate.tiktok_views = dados.media.views;
      metricsUpdate.tiktok_likes = dados.media.likes;
      metricsUpdate.tiktok_shares = dados.media.shares;
      metricsUpdate.tiktok_interactions = dados.media.interactions;
      metricsUpdate.tiktok_engagement = dados.media.engagement;
    }

    await supabase.from("influencer_profile").update(profileUpdate).eq("id", PROFILE_ID);
    await upsertMetricsDoMes(supabase, metricsUpdate);

    return { ok: true };
  } catch (e) {
    if (e instanceof TiktokAuthError) {
      return { ok: false, error: "Conexão com TikTok expirou.", authExpired: true };
    }
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao sincronizar TikTok.",
    };
  }
}

export async function autoSyncAll(source: SyncSource = "manual"): Promise<AutoSyncResult> {
  const [instagram, tiktok] = await Promise.all([
    autoSyncInstagram(),
    autoSyncTiktok(),
  ]);

  const supabase = serviceClient();
  await Promise.all([
    registrarLog(supabase, "instagram", instagram, source),
    registrarLog(supabase, "tiktok", tiktok, source),
  ]);

  return { instagram, tiktok };
}
