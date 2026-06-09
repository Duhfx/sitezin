import { createClient } from "@/lib/supabase/server";
import PerfilForm from "@/components/admin/PerfilForm";
import PerfilTabs from "@/components/admin/PerfilTabs";
import MetricasPanel, { type MetricaRow } from "@/components/admin/MetricasPanel";
import { PROFILE_ID, profileFromConfig } from "@/lib/influencer-profile";
import type { InfluencerProfile } from "@/types/database";

export default async function PerfilPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conteúdo e métricas exibidos na página do mídia kit.
        </p>
      </div>

      <PerfilTabs
        defaultTab={defaultTab}
        conteudo={<PerfilForm initialData={perfil} />}
        metricas={<MetricasPanel rows={rowsDesc} />}
      />
    </div>
  );
}
