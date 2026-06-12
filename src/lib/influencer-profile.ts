import { influencer } from "@/config/influencer";
import type { InfluencerProfile } from "@/types/database";

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
    moodboard: p.moodboard ?? [],
    contato: {
      email: p.email ?? "",
      whatsapp: p.whatsapp ?? "",
    },
  };
}
