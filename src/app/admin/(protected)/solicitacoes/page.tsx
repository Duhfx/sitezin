import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/ui/Badge";

type Status = "pendente" | "aprovado" | "reprovado";

const TABS: { label: string; value: Status | "todos" }[] = [
  { label: "Todos", value: "todos" },
  { label: "Pendentes", value: "pendente" },
  { label: "Aprovados", value: "aprovado" },
  { label: "Reprovados", value: "reprovado" },
];

const badgeVariant: Record<Status, "warning" | "success" | "destructive"> = {
  pendente: "warning",
  aprovado: "success",
  reprovado: "destructive",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default async function SolicitacoesPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const filtro = searchParams.status as Status | "todos" | undefined;
  const supabase = await createClient();

  let query = supabase
    .from("media_kit_requests")
    .select("id, nome, empresa, email, status, created_at")
    .order("created_at", { ascending: false });

  if (filtro && filtro !== "todos") {
    query = query.eq("status", filtro);
  }

  const { data: solicitacoes } = await query;

  const ativo = filtro ?? "todos";

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-foreground">Solicitações</h1>

      {/* Filtro por status */}
      <div className="mb-4 flex gap-1 rounded-lg border border-border bg-muted p-1 w-fit">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={
              tab.value === "todos"
                ? "/admin/solicitacoes"
                : `/admin/solicitacoes?status=${tab.value}`
            }
            className={`rounded px-3 py-1.5 text-sm font-medium transition ${
              ativo === tab.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Tabela */}
      {!solicitacoes || solicitacoes.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Nenhuma solicitação encontrada.
        </p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Empresa</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">E-mail</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {solicitacoes.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-border last:border-0 transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-3 font-medium text-foreground">{s.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.empresa}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(s.created_at)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={badgeVariant[s.status as Status]}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/solicitacoes/${s.id}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Ver detalhes →
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
