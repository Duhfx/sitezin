import { influencer } from "@/config/influencer";
import type { InfluencerProfile, MoodboardItem } from "@/types/database";

// Enquadramento padrão: centro e sem zoom — o que o object-fit: cover faz sozinho.
export const POS_PADRAO = "50% 50%";
export const ZOOM_PADRAO = 1;
export const ZOOM_MAX = 3;

// Aceita os dois formatos gravados no jsonb: string crua (antes do
// enquadramento) e { url, pos }. Usada tanto na apresentação quanto no form do
// admin — é o único lugar que sabe dessa dualidade.
export function normalizarMoodboard(itens: MoodboardItem[] | null | undefined) {
  return (itens ?? []).map((m) =>
    typeof m === "string"
      ? { url: m, pos: POS_PADRAO, zoom: ZOOM_PADRAO }
      : { url: m.url, pos: m.pos || POS_PADRAO, zoom: m.zoom || ZOOM_PADRAO },
  );
}

// UUID fixo da linha única — igual ao seed SQL e à Server Action.
export const PROFILE_ID = "00000000-0000-0000-0000-000000000001";

// Fallback: monta um InfluencerProfile a partir do config estático,
// usado enquanto a linha do banco não existe.
export function profileFromConfig(): InfluencerProfile {
  return {
    id: PROFILE_ID,
    nome: influencer.nome,
    foto_url: influencer.foto,
    biografia: influencer.biografia,
    nicho: influencer.nicho,
    publico_alvo: influencer.publicoAlvo,
    localizacao: influencer.localizacao,
    top_estados: influencer.topEstados,
    audiencia_genero: influencer.audienciaGenero,
    audiencia_idade: influencer.audienciaIdade,
    instagram_url: influencer.redes.instagram,
    tiktok_url: influencer.redes.tiktok,
    youtube_url: influencer.redes.youtube,
    formatos: influencer.formatos,
    cases: influencer.cases,
    moodboard: influencer.moodboard,
    reels: [],
    email: influencer.contato.email,
    whatsapp: influencer.contato.whatsapp,
    updated_at: new Date(0).toISOString(),
    meta_access_token: null,
    facebook_page_id: null,
    instagram_user_id: null,
    meta_token_expires_at: null,
    instagram_username: null,
    instagram_followers: null,
    instagram_posts: null,
    instagram_synced_at: null,
    tiktok_access_token: null,
    tiktok_refresh_token: null,
    tiktok_token_expires_at: null,
    tiktok_refresh_expires_at: null,
    tiktok_open_id: null,
    tiktok_username: null,
    tiktok_followers: null,
    tiktok_likes: null,
    tiktok_videos: null,
    tiktok_synced_at: null,
  };
}

// Extrai o @handle de uma URL de rede social (último segmento do path).
// Ex.: "https://instagram.com/alinecp" → "@alinecp"; "https://tiktok.com/@lineeec" → "@lineeec".
function handleFromUrl(url: string | null): string {
  if (!url) return "";
  try {
    const path = new URL(url).pathname.replace(/\/+$/, "");
    const seg = path.split("/").filter(Boolean).pop() ?? "";
    if (!seg) return "";
    return seg.startsWith("@") ? seg : `@${seg}`;
  } catch {
    return "";
  }
}

// Converte a linha do banco para o formato que MediaKitPresentation espera.
export function toPresentation(p: InfluencerProfile) {
  // Dois arrays paralelos em vez de um de objetos: os componentes de
  // apresentação (e o preview /media-kit-v2) já recebiam `moodboard: string[]`,
  // e um campo novo opcional não obriga ninguém a mudar.
  const fotos = normalizarMoodboard(p.moodboard);
  return {
    nome: p.nome,
    foto: p.foto_url ?? "",
    biografia: p.biografia,
    nicho: p.nicho,
    publicoAlvo: p.publico_alvo,
    localizacao: p.localizacao ?? "",
    topEstados: p.top_estados ?? [],
    audienciaGenero: p.audiencia_genero ?? [],
    audienciaIdade: p.audiencia_idade ?? [],
    redes: {
      instagram: p.instagram_url ?? "",
      tiktok: p.tiktok_url ?? "",
      youtube: p.youtube_url ?? "",
    },
    handles: {
      instagram: handleFromUrl(p.instagram_url),
      tiktok: handleFromUrl(p.tiktok_url),
    },
    formatos: p.formatos ?? [],
    cases: p.cases ?? [],
    moodboard: fotos.map((f) => f.url),
    moodboardPos: fotos.map((f) => f.pos),
    moodboardZoom: fotos.map((f) => f.zoom),
    // Só reels com capa. Entre cadastrar o link e o 1º sync (que baixa a capa do
    // IG) o reel fica sem thumb — não deve aparecer no mídia kit.
    reels: (p.reels ?? []).filter((r) => r.thumb),
    contato: {
      email: p.email ?? "",
      whatsapp: p.whatsapp ?? "",
    },
  };
}
