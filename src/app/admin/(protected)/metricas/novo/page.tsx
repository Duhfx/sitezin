import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import MetricasForm from "@/components/admin/MetricasForm";

export default function NovasMetricasPage() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/metricas">
          <Button variant="ghost" size="sm">← Voltar</Button>
        </Link>
        <h1 className="text-xl font-semibold text-foreground">Registrar métricas</h1>
      </div>
      <Card>
        <MetricasForm />
      </Card>
    </div>
  );
}
