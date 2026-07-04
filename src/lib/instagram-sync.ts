import type { AudienciaGenero, AudienciaIdade, TopEstado, Reel } from "@/types/database";

// Centraliza a versão da Graph API (mesma usada no OAuth/callback).
const GRAPH = "https://graph.facebook.com/v23.0";

// Erro de autenticação (token expirado/revogado) — código 190 da Graph API.
export class InstagramAuthError extends Error {}

type GraphError = { error?: { message?: string; code?: number; type?: string } };

async function graphGet<T>(
  path: string,
  params: Record<string, string>,
  token: string,
): Promise<T> {
  const qs = new URLSearchParams({ ...params, access_token: token });
  const res = await fetch(`${GRAPH}/${path}?${qs}`, { cache: "no-store" });
  const json = (await res.json()) as T & GraphError;

  if (json.error) {
    const { message, code } = json.error;
    if (code === 190) {
      throw new InstagramAuthError(message ?? "Token do Instagram expirado.");
    }
    throw new Error(message ?? "Erro ao consultar a API do Instagram.");
  }
  return json as T;
}

// ─── Perfil básico ────────────────────────────────────────────────────────────
type PerfilResponse = { username?: string; followers_count?: number; media_count?: number };

async function fetchPerfil(igId: string, token: string) {
  const data = await graphGet<PerfilResponse>(
    igId,
    { fields: "username,followers_count,media_count" },
    token,
  );
  return {
    username: data.username ?? null,
    followers: data.followers_count ?? 0,
    posts: data.media_count ?? 0,
  };
}

// ─── Insights da conta (alcance, views, interações) ───────────────────────────
type InsightItem = {
  name: string;
  total_value?: { value?: number };
  values?: { value?: number }[];
};
type InsightsResponse = { data?: InsightItem[] };

function readInsightValue(items: InsightItem[] | undefined, name: string): number {
  const item = items?.find((i) => i.name === name);
  if (!item) return 0;
  if (typeof item.total_value?.value === "number") return item.total_value.value;
  const last = item.values?.[item.values.length - 1]?.value;
  return typeof last === "number" ? last : 0;
}

// Janela de 30 dias COMPLETOS terminando no fim de ontem — exclui o dia de hoje,
// que ainda é parcial e fazia a API vir acima do "últimos 30 dias" do app.
function janelaUltimos30Dias() {
  const hoje = new Date();
  const inicioHojeUTC = Math.floor(
    Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate()) / 1000,
  );
  const until = inicioHojeUTC; // 00:00 de hoje (UTC) → não inclui o dia parcial de hoje
  const since = until - 30 * 24 * 60 * 60;
  return { since, until, sinceStr: String(since), untilStr: String(until) };
}

// Resposta de total_interactions com breakdown por tipo de mídia.
type InteractionsBreakdownResponse = {
  data?: {
    total_value?: {
      value?: number;
      breakdowns?: { results?: { dimension_values?: string[]; value?: number }[] }[];
    };
  }[];
};

// Soma as interações de todos os tipos EXCETO STORY (o app não as conta da mesma forma).
function sumInteractionsExcludingStories(data: InteractionsBreakdownResponse): number {
  const tv = data.data?.[0]?.total_value;
  const results = tv?.breakdowns?.[0]?.results ?? [];
  // Fallback: sem breakdown, usa o total bruto para não zerar a métrica.
  if (results.length === 0) return tv?.value ?? 0;
  return results
    .filter((r) => (r.dimension_values?.[0] ?? "").toUpperCase() !== "STORY")
    .reduce((acc, r) => acc + (r.value ?? 0), 0);
}

async function fetchAccountInsights(igId: string, token: string) {
  // As métricas novas (reach/views/total_interactions) só aceitam period=day +
  // metric_type=total_value; agregam o intervalo via since/until.
  const { sinceStr, untilStr } = janelaUltimos30Dias();
  const janela = { period: "day", metric_type: "total_value", since: sinceStr, until: untilStr };

  // reach/views numa chamada; total_interactions separado, com breakdown por tipo de
  // mídia para excluir STORY (que o app não soma como "Interações").
  const [base, inter] = await Promise.all([
    graphGet<InsightsResponse>(`${igId}/insights`, { metric: "reach,views", ...janela }, token),
    graphGet<InteractionsBreakdownResponse>(
      `${igId}/insights`,
      { metric: "total_interactions", breakdown: "media_product_type", ...janela },
      token,
    ),
  ]);

  const reach = readInsightValue(base.data, "reach");
  const views = readInsightValue(base.data, "views");
  const interactions = sumInteractionsExcludingStories(inter);
  // Engajamento = interações ÷ alcance (fallback evita divisão por zero).
  const engagement = reach > 0 ? Number(((interactions / reach) * 100).toFixed(2)) : 0;
  return { reach, views, interactions, engagement };
}

// ─── Agregados de mídia (saves e shares não existem em nível de conta) ─────────
type MediaResponse = {
  data?: {
    timestamp?: string;
    insights?: { data?: { name: string; values?: { value?: number }[] }[] };
  }[];
};

async function fetchMediaAggregates(igId: string, token: string) {
  // Mesma janela das métricas da conta: publicações dos últimos 30 dias completos.
  const { since, untilStr, sinceStr } = janelaUltimos30Dias();
  const sinceMs = since * 1000;

  const data = await graphGet<MediaResponse>(
    `${igId}/media`,
    {
      fields: "id,timestamp,insights.metric(saved,shares)",
      since: sinceStr,
      until: untilStr,
      limit: "100",
    },
    token,
  );

  let saves = 0;
  let shares = 0;
  for (const media of data.data ?? []) {
    // Defensivo: confirma a janela de 30 dias mesmo se a paginação por data variar.
    if (media.timestamp && new Date(media.timestamp).getTime() < sinceMs) continue;
    const ins = media.insights?.data ?? [];
    const get = (name: string) =>
      ins.find((i) => i.name === name)?.values?.[0]?.value ?? 0;
    saves += get("saved");
    shares += get("shares");
  }
  return { saves, shares };
}

// ─── Demografia da audiência (gênero, idade, localidade) ──────────────────────
type DemographicsResponse = {
  data?: {
    total_value?: {
      breakdowns?: { results?: { dimension_values?: string[]; value?: number }[] }[];
    };
  }[];
};

// Converte os resultados de um breakdown em pares { rótulo, pct }.
async function fetchDemographicsRaw(
  igId: string,
  token: string,
  breakdown: "age" | "gender" | "city",
): Promise<{ label: string; pct: number }[]> {
  const data = await graphGet<DemographicsResponse>(
    `${igId}/insights`,
    {
      metric: "follower_demographics",
      period: "lifetime",
      metric_type: "total_value",
      timeframe: "last_30_days",
      breakdown,
    },
    token,
  );

  const results = data.data?.[0]?.total_value?.breakdowns?.[0]?.results ?? [];
  const pairs = results
    .map((r) => ({ label: r.dimension_values?.[0] ?? "", value: r.value ?? 0 }))
    .filter((r) => r.label && r.value > 0);

  const total = pairs.reduce((acc, r) => acc + r.value, 0);
  if (total === 0) return [];

  return pairs.map((r) => ({ label: r.label, pct: Math.round((r.value / total) * 100) }));
}

const GENERO_LABELS: Record<string, string> = { F: "Feminino", M: "Masculino", U: "Não informado" };

async function fetchDemografia(igId: string, token: string) {
  const [genderRaw, ageRaw, cityRaw] = await Promise.all([
    fetchDemographicsRaw(igId, token, "gender"),
    fetchDemographicsRaw(igId, token, "age"),
    fetchDemographicsRaw(igId, token, "city"),
  ]);

  // Em cada categoria guardamos apenas os 2 principais.
  const genero: AudienciaGenero[] = genderRaw
    .map((g) => ({ label: GENERO_LABELS[g.label] ?? g.label, pct: g.pct }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 2);

  const idade: AudienciaIdade[] = ageRaw
    .map((a) => ({ faixa: `${a.label} anos`, pct: a.pct }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 2);

  // A API retorna "Cidade, Estado"; guardamos só a cidade.
  const localidades: TopEstado[] = cityRaw
    .map((c) => ({ uf: c.label.split(",")[0].trim(), pct: c.pct }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 2);

  return { genero, idade, localidades };
}

// ─── Reels em destaque (métricas por reel) ────────────────────────────────────
// like_count/comments_count são campos diretos da mídia; views é insight.
type MediaNode = {
  id: string;
  permalink?: string;
  like_count?: number;
  comments_count?: number;
  thumbnail_url?: string; // capa do reel/vídeo (URL do CDN, expira em dias)
  insights?: { data?: { name: string; values?: { value?: number }[] }[] };
};
const REEL_FIELDS =
  "id,permalink,like_count,comments_count,thumbnail_url,insights.metric(views)";

function lerViews(node: MediaNode): number {
  const ins = node.insights?.data ?? [];
  return ins.find((i) => i.name === "views")?.values?.[0]?.value ?? 0;
}

// Extrai o shortcode de uma URL de reel/post do Instagram. É o identificador
// estável — imune a query string (utm/igsh), www, barra final e à variação
// /reel · /reels · /p · /tv. Ex.: .../reel/DaVQHmnBeHU/?utm=... → "DaVQHmnBeHU".
export function shortcodeInstagram(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/instagram\.com\/(?:reel|reels|p|tv)\/([^/?#]+)/i);
  return m ? m[1] : null;
}

// Reel campeão costuma ser antigo → varre /media paginando e casa pelo shortcode.
// Cap de páginas evita varredura infinita; o media_id resolvido é cacheado no
// reel (próxima sync usa GET direto e nem cai aqui).
async function resolveReelPorPermalink(
  igId: string,
  token: string,
  permalink: string,
): Promise<MediaNode | null> {
  const alvo = shortcodeInstagram(permalink);
  if (!alvo) return null;
  let params: Record<string, string> = { fields: REEL_FIELDS, limit: "100" };
  for (let pagina = 0; pagina < 5; pagina++) {
    const res = await graphGet<{
      data?: MediaNode[];
      paging?: { cursors?: { after?: string } };
    }>(`${igId}/media`, params, token);
    const match = (res.data ?? []).find(
      (m) => shortcodeInstagram(m.permalink) === alvo,
    );
    if (match) return match;
    const after = res.paging?.cursors?.after;
    if (!after) break;
    params = { ...params, after };
  }
  return null;
}

// Atualiza views/likes/comments de cada reel cadastrado. Resiliente por reel:
// falha pontual preserva os números atuais; só token expirado propaga.
async function fetchReelsMetrics(igId: string, token: string, reels: Reel[]): Promise<Reel[]> {
  const out: Reel[] = [];
  for (const reel of reels) {
    try {
      let node: MediaNode | null = null;
      if (reel.media_id) {
        node = await graphGet<MediaNode>(reel.media_id, { fields: REEL_FIELDS }, token);
      } else if (reel.permalink) {
        node = await resolveReelPorPermalink(igId, token, reel.permalink);
      }
      if (node) {
        out.push({
          ...reel,
          media_id: node.id ?? reel.media_id,
          views: lerViews(node),
          likes: node.like_count ?? reel.likes,
          comments: node.comments_count ?? reel.comments,
          // Sem capa própria → carrega a URL do IG pra materializarThumbsReels
          // baixar e salvar no bucket depois (a URL do IG expira).
          ...(!reel.thumb && node.thumbnail_url
            ? { thumbSource: node.thumbnail_url }
            : {}),
        });
      } else {
        out.push(reel); // não encontrado → mantém os números atuais
      }
    } catch (e) {
      if (e instanceof InstagramAuthError) throw e; // token expirado propaga
      out.push(reel); // erro pontual → preserva
    }
  }
  return out;
}

// ─── Orquestrador com status por etapa (resiliente a falhas parciais) ─────────
export type SyncStepStatus = "ok" | "erro" | "pulado";
export type SyncStep = { secao: string; status: SyncStepStatus; detalhe?: string };

export type InstagramSyncData = {
  perfil: { username: string | null; followers: number; posts: number } | null;
  insights: { reach: number; views: number; interactions: number; engagement: number } | null;
  media: { saves: number; shares: number } | null;
  demografia: { genero: AudienciaGenero[]; idade: AudienciaIdade[]; localidades: TopEstado[] };
  // null quando não há reels cadastrados; senão, a lista com métricas atualizadas.
  reels: Reel[] | null;
  steps: SyncStep[];
  authError: boolean;
};

export async function fetchInstagramData(
  igId: string,
  token: string,
  reels: Reel[] = [],
): Promise<InstagramSyncData> {
  const steps: SyncStep[] = [];
  let authError = false;

  // Executa uma etapa, registra o status e nunca derruba as demais.
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
      if (e instanceof InstagramAuthError) authError = true;
      steps.push({ secao, status: "erro", detalhe: e instanceof Error ? e.message : String(e) });
      return null;
    }
  }

  const perfil = await run("Perfil", () => fetchPerfil(igId, token));
  const insights = await run("Métricas da conta", () => fetchAccountInsights(igId, token));
  const media = await run("Saves e compartilhamentos", () => fetchMediaAggregates(igId, token));
  const reelsAtualizados =
    reels.length > 0
      ? await run("Reels em destaque", () => fetchReelsMetrics(igId, token, reels))
      : null;
  const demografia =
    (await run("Demografia da audiência", () => fetchDemografia(igId, token))) ?? {
      genero: [],
      idade: [],
      localidades: [],
    };

  // Demografia "ok" porém vazia → marca como pulada com explicação.
  const demoVazia =
    demografia.genero.length === 0 &&
    demografia.idade.length === 0 &&
    demografia.localidades.length === 0;
  if (demoVazia) {
    const step = steps.find((s) => s.secao === "Demografia da audiência");
    if (step && step.status === "ok") {
      step.status = "pulado";
      step.detalhe = "sem dados (requer ≥100 seguidores; pode levar até 48h)";
    }
  }

  return { perfil, insights, media, demografia, reels: reelsAtualizados, steps, authError };
}
