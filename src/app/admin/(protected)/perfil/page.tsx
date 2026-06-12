import { createClient } from "@/lib/supabase/server";
import PerfilForm from "@/components/admin/PerfilForm";
import PerfilTabs from "@/components/admin/PerfilTabs";
import MetricasPanel, { type MetricaRow } from "@/components/admin/MetricasPanel";
import InstagramConnect from "@/components/admin/InstagramConnect";
import TiktokConnect from "@/components/admin/TiktokConnect";
import { PROFILE_ID, profileFromConfig } from "@/lib/influencer-profile";
import type { InfluencerProfile } from "@/types/database";

export default async function PerfilPage({
  searchParams,
}: {
  searchParams?: { tab?: string; instagram?: string; tiktok?: string };
}) {
  const supabase = await createClient();

  const [{ data: perfilData }, { data: metricasData }] = await Promise.all([
    supabase.from("influencer_profile").select("*").eq("id", PROFILE_ID).maybeSingle(),
    supabase.from("influencer_metrics").select("*").order("reference_month", { ascending: true }),
  ]);

  const perfil: InfluencerProfile = perfilData ?? profileFromConfig();

  const rows: MetricaRow[] = (metricasData ?? []).map((item, i, arr) => ({
    ...item,
    prev: i > 0 ? arr[i - 1] : undefined,
  }));
  const rowsDesc = [...rows].reverse();

  const defaultTab = searchParams?.tab === "metricas" ? "metricas" : "conteudo";
  const instagramStatus = searchParams?.instagram;
  const tiktokStatus = searchParams?.tiktok;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conteúdo e métricas exibidos na página do mídia kit.
        </p>
      </div>

      <InstagramConnect
        username={perfil.instagram_username ?? null}
        followers={perfil.instagram_followers ?? null}
        posts={perfil.instagram_posts ?? null}
        syncedAt={perfil.instagram_synced_at ?? null}
        status={instagramStatus}
      />

      <TiktokConnect
        username={perfil.tiktok_username ?? null}
        followers={perfil.tiktok_followers ?? null}
        likes={perfil.tiktok_likes ?? null}
        videos={perfil.tiktok_videos ?? null}
        syncedAt={perfil.tiktok_synced_at ?? null}
        status={tiktokStatus}
      />

      <PerfilTabs
        defaultTab={defaultTab}
        conteudo={<PerfilForm initialData={perfil} />}
        metricas={<MetricasPanel rows={rowsDesc} />}
      />
    </div>
  );
}
