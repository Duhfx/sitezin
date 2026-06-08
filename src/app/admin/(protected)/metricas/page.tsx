import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Button from "@/components/ui/Button";
import type { InfluencerMetrics } from "@/types/database";

function formatMonth(dateStr: string) {
  const [year, month] = dateStr.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("pt-BR", {
    month: "short",
    year: "numeric",
  });
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function growthLabel(current: number, prev: number | undefined) {
  if (prev === undefined || prev === 0) return null;
  const pct = ((current - prev) / prev) * 100;
  const label = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
  const color = pct > 0 ? "text-success" : pct < 0 ? "text-destructive" : "text-muted-foreground";
  return <span className={`text-xs ${color}`}>{label}</span>;
}

type Row = InfluencerMetrics & { prev?: InfluencerMetrics };

export default async function MetricasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("influencer_metrics")
    .select("*")
    .order("reference_month", { ascending: true });

  const rows: Row[] = (data ?? []).map((item, i, arr) => ({
    ...item,
    prev: i > 0 ? arr[i - 1] : undefined,
  }));

  const rowsDesc = [...rows].reverse();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Métricas</h1>
        <Link href="/admin/metricas/novo">
          <Button size="sm">Registrar mês</Button>
        </Link>
      </div>

      {rowsDesc.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Nenhum registro encontrado. Registre o primeiro mês de métricas.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Mês</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Seguidores IG</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Alcance IG</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Eng. IG</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Seguidores TK</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Views TK</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Eng. TK</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rowsDesc.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-0 transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {formatMonth(r.reference_month)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-foreground">{fmtNum(r.instagram_followers)}</p>
                    {growthLabel(r.instagram_followers, r.prev?.instagram_followers)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {fmtNum(r.instagram_reach)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {(r.instagram_engagement ?? 0).toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-foreground">{fmtNum(r.tiktok_followers)}</p>
                    {growthLabel(r.tiktok_followers, r.prev?.tiktok_followers)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {fmtNum(r.tiktok_views)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {(r.tiktok_engagement ?? 0).toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/metricas/${r.id}/editar`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
