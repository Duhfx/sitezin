import Link from "next/link";
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

export type MetricaRow = InfluencerMetrics & { prev?: InfluencerMetrics };

export default function MetricasPanel({ rows }: { rows: MetricaRow[] }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Histórico de métricas</h3>
        <Link
          href="/admin/perfil/metricas/novo"
          className="inline-flex items-center justify-center rounded px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground transition hover:opacity-90"
        >
          Registrar mês
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Nenhum registro encontrado. Registre o primeiro mês de métricas.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground" colSpan={1}>
                  Mês
                </th>
                {/* Instagram */}
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  Seguidores IG
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  Alcance IG
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  Eng. IG
                </th>
                {/* TikTok — separador visual */}
                <th className="border-l border-border px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  Seguidores TK
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  Views TK
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  Eng. TK
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-0 transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {formatMonth(r.reference_month)}
                  </td>
                  {/* Instagram */}
                  <td className="px-4 py-3 text-right">
                    <p className="text-foreground">{fmtNum(r.instagram_followers)}</p>
                    {growthLabel(r.instagram_followers, r.prev?.instagram_followers)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-muted-foreground">{fmtNum(r.instagram_reach)}</p>
                    {growthLabel(r.instagram_reach, r.prev?.instagram_reach)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-muted-foreground">{(r.instagram_engagement ?? 0).toFixed(2)}%</p>
                    {growthLabel(r.instagram_engagement ?? 0, r.prev?.instagram_engagement)}
                  </td>
                  {/* TikTok — separador visual */}
                  <td className="border-l border-border px-4 py-3 text-right">
                    <p className="text-foreground">{fmtNum(r.tiktok_followers)}</p>
                    {growthLabel(r.tiktok_followers, r.prev?.tiktok_followers)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-muted-foreground">{fmtNum(r.tiktok_views)}</p>
                    {growthLabel(r.tiktok_views, r.prev?.tiktok_views)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-muted-foreground">{(r.tiktok_engagement ?? 0).toFixed(2)}%</p>
                    {growthLabel(r.tiktok_engagement ?? 0, r.prev?.tiktok_engagement)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/perfil/metricas/${r.id}/editar`}
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
