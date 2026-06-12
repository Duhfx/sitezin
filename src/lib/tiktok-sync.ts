// Cliente da Display API (Login Kit v2) do TikTok. Espelha lib/instagram-sync.ts:
// funções puras de fetch + orquestrador resiliente com status por etapa.
import type { SyncStep } from "./instagram-sync";

// Reexporta os tipos de etapa para os componentes do TikTok reusarem.
export type { SyncStep, SyncStepStatus } from "./instagram-sync";

const OPEN_API = "https://open.tiktokapis.com/v2";
const TOKEN_URL = `${OPEN_API}/oauth/token/`;

// Janela de agregação das publicações recentes. 28 dias para casar com o padrão
// de "últimos 28 dias" exibido no próprio app do TikTok.
const JANELA_DIAS = 28;
// Limite de páginas do video.list para não paginar indefinidamente (20 vídeos/página).
const MAX_PAGINAS = 5;

// Erro de autenticação (token inválido/expirado/sem escopo) → pedir Reconectar.
export class TiktokAuthError extends Error {}

type TiktokErrorEnvelope = { error?: { code?: string; message?: string; log_id?: string } };

function ehAuthError(status: number, code: string | undefined): boolean {
  if (status === 401) return true;
  const c = (code ?? "").toLowerCase();
  return c.includes("token") || c.includes("scope");
}

// Checa o envelope `error` padrão da Open API (code === "ok" quando sucesso).
function assertSemErro(status: number, json: TiktokErrorEnvelope) {
  const err = json.error;
  if (err && err.code && err.code !== "ok") {
    if (ehAuthError(status, err.code)) {
      throw new TiktokAuthError(err.message ?? "Conexão com o TikTok expirou.");
    }
    throw new Error(err.message ?? "Erro ao consultar a API do TikTok.");
  }
}

// ─── Refresh do access_token (válido ~24h) via refresh_token (~365d) ───────────
export type TiktokTokens = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  refreshExpiresAt: string | null;
  openId: string | null;
};

export async function refreshTiktokToken(refreshToken: string): Promise<TiktokTokens> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    cache: "no-store",
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  const json = await res.json();

  if (!json.access_token) {
    // Refresh token expirado/revogado → tratar como falha de autenticação.
    throw new TiktokAuthError(json.error_description ?? "Não foi possível renovar a conexão com o TikTok.");
  }

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? refreshToken,
    expiresAt: json.expires_in ? new Date(Date.now() + json.expires_in * 1000).toISOString() : null,
    refreshExpiresAt: json.refresh_expires_in
      ? new Date(Date.now() + json.refresh_expires_in * 1000).toISOString()
      : null,
    openId: json.open_id ?? null,
  };
}

// ─── Perfil + estatísticas da conta (user.info.basic/profile/stats) ────────────
type UserInfoResponse = {
  data?: {
    user?: {
      username?: string;
      follower_count?: number;
      likes_count?: number;
      video_count?: number;
    };
  };
} & TiktokErrorEnvelope;

export async function fetchTiktokUserInfo(token: string) {
  const fields = "username,follower_count,likes_count,video_count";
  const res = await fetch(`${OPEN_API}/user/info/?fields=${fields}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const json = (await res.json()) as UserInfoResponse;
  assertSemErro(res.status, json);

  const user = json.data?.user ?? {};
  return {
    username: user.username ?? null,
    followers: user.follower_count ?? 0,
    likes: user.likes_count ?? 0, // total vitalício da conta
    videos: user.video_count ?? 0,
  };
}

// ─── Agregados das publicações recentes (video.list, janela de 30 dias) ────────
type VideoItem = {
  create_time?: number; // unix (segundos)
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
};
type VideoListResponse = {
  data?: { videos?: VideoItem[]; cursor?: number; has_more?: boolean };
} & TiktokErrorEnvelope;

export type TiktokMediaAggregates = {
  views: number;
  likes: number;
  shares: number;
  interactions: number;
  engagement: number;
  videos: number; // nº de vídeos considerados na janela
};

async function fetchVideoAggregates(token: string): Promise<TiktokMediaAggregates> {
  const fields = "create_time,view_count,like_count,comment_count,share_count";
  const sinceSec = Math.floor(Date.now() / 1000) - JANELA_DIAS * 24 * 60 * 60;

  let views = 0;
  let likes = 0;
  let comments = 0;
  let shares = 0;
  let contados = 0;
  let cursor: number | undefined;

  for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
    const body: Record<string, number> = { max_count: 20 };
    if (cursor) body.cursor = cursor;

    const res = await fetch(`${OPEN_API}/video/list/?fields=${fields}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as VideoListResponse;
    assertSemErro(res.status, json);

    const videos = json.data?.videos ?? [];
    let alcancouAntigo = false;
    for (const v of videos) {
      // Os vídeos vêm em ordem cronológica reversa; ao passar da janela, paramos.
      if (typeof v.create_time === "number" && v.create_time < sinceSec) {
        alcancouAntigo = true;
        break;
      }
      views += v.view_count ?? 0;
      likes += v.like_count ?? 0;
      comments += v.comment_count ?? 0;
      shares += v.share_count ?? 0;
      contados += 1;
    }

    if (alcancouAntigo || !json.data?.has_more) break;
    cursor = json.data?.cursor;
    if (!cursor) break;
  }

  const interactions = likes + comments + shares;
  // Sem alcance na Display API; usamos views como base do engajamento.
  const engagement = views > 0 ? Number(((interactions / views) * 100).toFixed(2)) : 0;
  return { views, likes, shares, interactions, engagement, videos: contados };
}

// ─── Orquestrador com status por etapa (resiliente a falhas parciais) ─────────
export type TiktokSyncData = {
  perfil: { username: string | null; followers: number; likes: number; videos: number } | null;
  media: TiktokMediaAggregates | null;
  steps: SyncStep[];
  authError: boolean;
};

export async function fetchTiktokData(token: string): Promise<TiktokSyncData> {
  const steps: SyncStep[] = [];
  let authError = false;

  async function run<T>(secao: string, fn: () => Promise<T>): Promise<T | null> {
    if (authError) {
      steps.push({ secao, status: "pulado", detalhe: "conexão expirada" });
      return null;
    }
    try {
      const result = await fn();
      steps.push({ secao, status: "ok" });
      return result;
    } catch (e) {
      if (e instanceof TiktokAuthError) authError = true;
      steps.push({ secao, status: "erro", detalhe: e instanceof Error ? e.message : String(e) });
      return null;
    }
  }

  const perfil = await run("Perfil", () => fetchTiktokUserInfo(token));
  const media = await run("Métricas das publicações", () => fetchVideoAggregates(token));

  return { perfil, media, steps, authError };
}
