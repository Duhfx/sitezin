import { createClient } from "@/lib/supabase/server";

// Métricas de acesso ao mídia kit por link. Agrega as views (IP + user agent)
// em memória — o volume de views de um mídia kit é pequeno.
// ponytail: agregação em JS; virar RPC/SQL se media_kit_views crescer muito.

function fmtData(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type LinhaAcesso = {
  id: string;
  link: string;
  ipsUnicos: number;
  visitantes: number; // aproximação: ip + user agent distintos
  views: number;
  ultima: string | null;
  ativo: boolean;
};

export default async function AcessosPage() {
  const supabase = await createClient();

  const [{ data: acessos }, { data: solicitacoes }, { data: views }] = await Promise.all([
    supabase
      .from("media_kit_access")
      .select("id, request_id, slug, label, token, revoked_at"),
    supabase.from("media_kit_requests").select("id, empresa, nome"),
    supabase.from("media_kit_views").select("access_id, ip, user_agent, viewed_at"),
  ]);

  const reqMap = new Map((solicitacoes ?? []).map((r) => [r.id, r]));

  // Agrega views por access_id: IPs distintos, visitantes (ip|ua) distintos,
  // total e data da última visita.
  const agg = new Map<
    string,
    { ips: Set<string>; visitantes: Set<string>; views: number; ultima: string | null }
  >();
  for (const v of views ?? []) {
    let a = agg.get(v.access_id);
    if (!a) {
      a = { ips: new Set(), visitantes: new Set(), views: 0, ultima: null };
      agg.set(v.access_id, a);
    }
    if (v.ip) a.ips.add(v.ip);
    a.visitantes.add(`${v.ip ?? ""}|${v.user_agent ?? ""}`);
    a.views += 1;
    if (!a.ultima || v.viewed_at > a.ultima) a.ultima = v.viewed_at;
  }

  const linhas: LinhaAcesso[] = (acessos ?? [])
    .map((a) => {
      const req = a.request_id ? reqMap.get(a.request_id) : undefined;
      const stats = agg.get(a.id);
      return {
        id: a.id,
        link: req?.empresa || a.label || a.slug || a.token.slice(0, 12),
        ipsUnicos: stats?.ips.size ?? 0,
        visitantes: stats?.visitantes.size ?? 0,
        views: stats?.views ?? 0,
        ultima: stats?.ultima ?? null,
        ativo: !a.revoked_at,
      };
    })
    .sort((a, b) => b.ipsUnicos - a.ipsUnicos || b.views - a.views);

  const totalIps = linhas.reduce((s, l) => s + l.ipsUnicos, 0);
  const totalViews = linhas.reduce((s, l) => s + l.views, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Acessos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acessos aos links de mídia kit. &quot;IPs únicos&quot; é uma aproximação de
          pessoas — celular em 4G ou rede compartilhada pode agrupar visitantes
          diferentes no mesmo IP.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Links</p>
          <p className="mt-1.5 text-2xl font-bold text-foreground">{linhas.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">IPs únicos (total)</p>
          <p className="mt-1.5 text-2xl font-bold text-primary">{totalIps}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Views totais</p>
          <p className="mt-1.5 text-2xl font-bold text-foreground">{totalViews}</p>
        </div>
      </div>

      {linhas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum link de acesso ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Link</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">IPs únicos</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Visitantes ~</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Views</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Última visita</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-border last:border-0 transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-3 font-medium text-foreground">{l.link}</td>
                  <td className="px-4 py-3 text-right font-semibold text-primary">{l.ipsUnicos}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{l.visitantes}</td>
                  <td className="px-4 py-3 text-right text-foreground">{l.views}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtData(l.ultima)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        l.ativo ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {l.ativo ? "Ativo" : "Revogado"}
                    </span>
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
