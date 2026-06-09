import Link from "next/link";
import Card from "@/components/ui/Card";
import MetricasForm from "@/components/admin/MetricasForm";

export default function NovasMetricasPage() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/perfil?tab=metricas"
          className="inline-flex items-center justify-center rounded px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          ← Voltar
        </Link>
        <h1 className="text-xl font-semibold text-foreground">Registrar métricas</h1>
      </div>
      <Card>
        <MetricasForm />
      </Card>
    </div>
  );
}
