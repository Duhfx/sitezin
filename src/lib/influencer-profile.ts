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
    top_estados: influencer.topEstados,
    instagram_url: influencer.redes.instagram,
    tiktok_url: influencer.redes.tiktok,
    youtube_url: influencer.redes.youtube,
    formatos: influencer.formatos,
    cases: influencer.cases,
    moodboard: influencer.moodboard,
    email: influencer.contato.email,
    whatsapp: influencer.contato.whatsapp,
    updated_at: new Date(0).toISOString(),
  };
}

// Converte a linha do banco para o formato que MediaKitPresentation espera.
export function toPresentation(p: InfluencerProfile) {
  return {
    nome: p.nome,
    foto: p.foto_url ?? "",
    biografia: p.biografia,
    nicho: p.nicho,
    publicoAlvo: p.publico_alvo,
    topEstados: p.top_estados ?? [],
    redes: {
      instagram: p.instagram_url ?? "",
      tiktok: p.tiktok_url ?? "",
      youtube: p.youtube_url ?? "",
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
