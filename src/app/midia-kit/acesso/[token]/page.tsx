import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { PROFILE_ID, profileFromConfig, toPresentation } from "@/lib/influencer-profile";
import MediaKitPresentation from "@/components/midia-kit/MediaKitPresentationEditorial";

// ─── Metadata (preview em WhatsApp/redes) ─────────────────────────────────────
// `title.absolute` ignora o template "Aline — %s" do layout raiz. `robots` marca
// como noindex porque é um link privado por token (não deve ser indexado).
const OG_TITLE = "Mídia Kit — Aline Carreiro";
const OG_DESCRICAO = "Dados, alcance e oportunidades de parceria";

export const metadata: Metadata = {
  title: { absolute: OG_TITLE },
  description: OG_DESCRICAO,
  openGraph: {
    title: OG_TITLE,
    description: OG_DESCRICAO,
  },
  robots: { index: false, follow: false },
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function MidiaKitAcessoPage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = await createServiceClient();

  // Slug curto e token hex só contêm [A-Za-z0-9_-]. Validar o formato antes de
  // interpolar no filtro `.or()` evita injeção de filtro no PostgREST (vírgulas
  // ou operadores no token alterariam a query).
  if (!/^[A-Za-z0-9_-]+$/.test(params.token)) {
    notFound();
  }

  // Valida token — aceita slug curto (novo) ou token hex completo (backward compat)
  const { data: acesso } = await supabase
    .from("media_kit_access")
    .select("id, revoked_at, expires_at")
    .or(`slug.eq.${params.token},token.eq.${params.token}`)
    .maybeSingle();

  if (
    !acesso || 
    acesso.revoked_at || 
    (acesso.expires_at && new Date(acesso.expires_at) < new Date())
  ) {
    notFound();
  }

  const headersList = headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ??
    headersList.get("x-real-ip") ??
    null;
  const userAgent = headersList.get("user-agent") ?? null;

  // Registro de view + leituras de perfil e métricas em paralelo (antes eram 3
  // round-trips seriais ao Supabase). A view é independente do render, mas roda
  // no mesmo Promise.all para ser garantidamente gravada sem virar hop extra —
  // como é mais rápida que os SELECTs, não adiciona latência.
  const [, { data: perfilRow }, { data: metricas }] = await Promise.all([
    supabase
      .from("media_kit_views")
      .insert({ access_id: acesso.id, ip, user_agent: userAgent }),
    supabase
      .from("influencer_profile")
      .select("*")
      .eq("id", PROFILE_ID)
      .maybeSingle(),
    supabase
      .from("influencer_metrics")
      .select("*")
      .order("reference_month", { ascending: true }),
  ]);

  const influencer = toPresentation(perfilRow ?? profileFromConfig());

  return <MediaKitPresentation influencer={influencer} metricas={metricas || []} />;
}
