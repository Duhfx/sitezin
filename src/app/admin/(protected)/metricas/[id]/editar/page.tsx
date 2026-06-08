import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Button from "@/components/ui/Button";
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
        <Link href="/admin/metricas">
          <Button variant="ghost" size="sm">← Voltar</Button>
        </Link>
        <h1 className="text-xl font-semibold text-foreground">Editar métricas</h1>
      </div>
      <Card>
        <MetricasForm initialData={registro} />
      </Card>
    </div>
  );
}
