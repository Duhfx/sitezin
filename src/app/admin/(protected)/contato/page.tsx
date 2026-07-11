import { createClient } from "@/lib/supabase/server";

// Histórico de cliques na aba /contato (redireciona para o WhatsApp).
// Lista as visitas mais recentes + total. IPs únicos é uma aproximação de
// pessoas (mesma ressalva da página de Acessos).

function fmtData(dateStr: string): string {
  return new Date(dateStr).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo", // Server Component roda em UTC no Vercel
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ContatoPage() {
  const supabase = await createClient();

  const { data: cliques } = await supabase
    .from("contact_clicks")
    .select("id, clicked_at, ip, user_agent")
    .order("clicked_at", { ascending: false })
    .limit(500);

  const linhas = cliques ?? [];
  const ipsUnicos = new Set(linhas.map((c) => c.ip).filter(Boolean)).size;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Contato</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cliques na aba <code className="rounded bg-muted px-1">/contato</code>, que
          redireciona para o WhatsApp. &quot;IPs únicos&quot; é uma aproximação de
          pessoas.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Cliques totais</p>
          <p className="mt-1.5 text-2xl font-bold text-primary">{linhas.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">IPs únicos</p>
          <p className="mt-1.5 text-2xl font-bold text-foreground">{ipsUnicos}</p>
        </div>
      </div>

      {linhas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum clique ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Quando</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">IP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Dispositivo</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border last:border-0 transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-foreground">{fmtData(c.clicked_at)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.ip ?? "—"}</td>
                  <td className="px-4 py-3 max-w-[320px] truncate text-muted-foreground" title={c.user_agent ?? ""}>
                    {c.user_agent ?? "—"}
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
