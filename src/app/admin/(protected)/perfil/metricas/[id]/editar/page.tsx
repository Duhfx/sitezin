import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import MetricasForm from "@/components/admin/MetricasForm";

export default async function EditarMetricasPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { data: registro } = await supabase
    .from("influencer_metrics")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!registro) notFound();

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/perfil?tab=metricas"
          className="inline-flex items-center justify-center rounded px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          ← Voltar
        </Link>
        <h1 className="text-xl font-semibold text-foreground">Editar métricas</h1>
      </div>
      <Card>
        <MetricasForm initialData={registro} />
      </Card>
    </div>
  );
}
