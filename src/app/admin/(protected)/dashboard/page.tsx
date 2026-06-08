import { createClient } from "@/lib/supabase/server";

type StatCardProps = { label: string; value: number; accent?: boolean };

function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent ? "text-primary" : "text-foreground"}`}>
        {value.toLocaleString("pt-BR")}
      </p>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: pendentes },
    { count: aprovados },
    { count: reprovados },
    { count: totalViews },
    { data: acessos },
    { data: solicitacoes },
    { data: views },
  ] = await Promise.all([
    supabase
      .from("media_kit_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendente"),
    supabase
      .from("media_kit_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "aprovado"),
    supabase
      .from("media_kit_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "reprovado"),
    supabase
      .from("media_kit_views")
      .select("*", { count: "exact", head: true }),
    supabase.from("media_kit_access").select("id, request_id, revoked_at"),
    supabase.from("media_kit_requests").select("id, empresa, nome"),
    supabase.from("media_kit_views").select("access_id"),
  ]);

  // Agrupa views por access_id
  const viewCount: Record<string, number> = {};
  for (const v of views ?? []) {
    viewCount[v.access_id] = (viewCount[v.access_id] ?? 0) + 1;
  }

  // Mapa request_id → empresa/nome
  const reqMap: Record<string, { empresa: string; nome: string }> = {};
  for (const r of solicitacoes ?? []) {
    reqMap[r.id] = { empresa: r.empresa, nome: r.nome };
  }

  // Top 5 empresas por visualizações
  const topEmpresas = (acessos ?? [])
    .map((a) => ({
      empresa: reqMap[a.request_id]?.empresa ?? "—",
      nome: reqMap[a.request_id]?.nome ?? "—",
      views: viewCount[a.id] ?? 0,
      ativo: !a.revoked_at,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-foreground">Dashboard</h1>

      {/* Cards de indicadores */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Solicitações pendentes" value={pendentes ?? 0} />
        <StatCard label="Solicitações aprovadas" value={aprovados ?? 0} />
        <StatCard label="Solicitações reprovadas" value={reprovados ?? 0} />
        <StatCard label="Visualizações do mídia kit" value={totalViews ?? 0} accent />
      </div>

      {/* Tabela top empresas */}
      <h2 className="mb-3 text-sm font-semibold text-foreground">
        Empresas com mais acessos
      </h2>

      {topEmpresas.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhum acesso registrado ainda.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Empresa</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Contato</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Acesso</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Visualizações</th>
              </tr>
            </thead>
            <tbody>
              {topEmpresas.map((e, i) => (
                <tr
                  key={i}
                  className="border-b border-border last:border-0 transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-3 font-medium text-foreground">{e.empresa}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.nome}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        e.ativo
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {e.ativo ? "Ativo" : "Revogado"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-primary">
                    {e.views}
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
