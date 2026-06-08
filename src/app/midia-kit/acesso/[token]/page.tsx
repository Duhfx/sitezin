import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Image from "next/image";
import { createServiceClient } from "@/lib/supabase/server";
import { influencer } from "@/config/influencer";
import type { InfluencerMetrics } from "@/types/database";
import MediaKitPresentation from "@/components/midia-kit/MediaKitPresentation";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("pt-BR");
}

function fmtMonth(dateStr: string) {
  const [year, month] = dateStr.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("pt-BR", {
    month: "short",
    year: "numeric",
  });
}

function growthPct(current: number, prev: number | undefined) {
  if (prev === undefined || prev === 0) return null;
  return ((current - prev) / prev) * 100;
}

function GrowthBadge({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const color =
    pct > 0 ? "text-success" : pct < 0 ? "text-destructive" : "text-muted-foreground";
  return (
    <span className={`text-xs ${color}`}>
      {pct >= 0 ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function MidiaKitAcessoPage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = await createServiceClient();

  // Valida token
  const { data: acesso } = await supabase
    .from("media_kit_access")
    .select("id, revoked_at, expires_at")
    .eq("token", params.token)
    .maybeSingle();

  if (
    !acesso || 
    acesso.revoked_at || 
    (acesso.expires_at && new Date(acesso.expires_at) < new Date())
  ) {
    notFound();
  }

  // Registra visualização
  const headersList = headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ??
    headersList.get("x-real-ip") ??
    null;
  const userAgent = headersList.get("user-agent") ?? null;

  await supabase
    .from("media_kit_views")
    .insert({ access_id: acesso.id, ip, user_agent: userAgent });

  // Busca métricas
  const { data: metricas } = await supabase
    .from("influencer_metrics")
    .select("*")
    .order("reference_month", { ascending: true });

  const ultimaMetrica: InfluencerMetrics | null =
    metricas && metricas.length > 0 ? metricas[metricas.length - 1] : null;

  const historicoDesc = metricas ? [...metricas].reverse() : [];

  return <MediaKitPresentation influencer={influencer} metricas={metricas || []} />;
}
