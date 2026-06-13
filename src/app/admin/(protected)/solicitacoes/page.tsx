import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SolicitacoesTable from "@/components/admin/SolicitacoesTable";
import LinksDiretosPanel from "@/components/admin/LinksDiretosPanel";

type Status = "pendente" | "aprovado" | "reprovado";

const TABS: { label: string; value: Status | "todos" }[] = [
  { label: "Todos", value: "todos" },
  { label: "Pendentes", value: "pendente" },
  { label: "Aprovados", value: "aprovado" },
  { label: "Reprovados", value: "reprovado" },
];

export default async function SolicitacoesPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const filtro = searchParams.status as Status | "todos" | undefined;
  const supabase = await createClient();

  const [{ data: todas }, { data: linksDiretos }] = await Promise.all([
    supabase
      .from("media_kit_requests")
      .select("id, nome, empresa, email, status, created_at, media_kit_access(revoked_at)")
      .order("created_at", { ascending: false }),
    supabase
      .from("media_kit_access")
      .select("*")
      .is("request_id", null)
      .order("created_at", { ascending: false }),
  ]);

  const contadores: Record<Status | "todos", number> = {
    todos: todas?.length ?? 0,
    pendente: todas?.filter((s) => s.status === "pendente").length ?? 0,
    aprovado: todas?.filter((s) => s.status === "aprovado").length ?? 0,
    reprovado: todas?.filter((s) => s.status === "reprovado").length ?? 0,
  };

  const todasComFlag = (todas ?? []).map((s) => ({
    ...s,
    linkRevogado:
      s.status === "aprovado" &&
      Array.isArray(s.media_kit_access) &&
      s.media_kit_access.length > 0 &&
      s.media_kit_access.every((a) => a.revoked_at !== null),
  }));

  const solicitacoes =
    filtro && filtro !== "todos"
      ? todasComFlag.filter((s) => s.status === filtro)
      : todasComFlag;

  const ativo = filtro ?? "todos";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-foreground">Solicitações</h1>

      <LinksDiretosPanel linksIniciais={linksDiretos ?? []} appUrl={appUrl} />

      {/* Filtro por status */}
      <div className="mb-4 flex gap-1 rounded-lg border border-border bg-muted p-1 w-fit">
        {TABS.map((tab) => {
          const isAtivo = ativo === tab.value;
          const count = contadores[tab.value];
          return (
            <Link
              key={tab.value}
              href={
                tab.value === "todos"
                  ? "/admin/solicitacoes"
                  : `/admin/solicitacoes?status=${tab.value}`
              }
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition ${
                isAtivo
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                  isAtivo
                    ? "bg-foreground/10 text-foreground"
                    : "bg-muted-foreground/20 text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Tabela */}
      {solicitacoes.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Nenhuma solicitação encontrada.
        </p>
      ) : (
        <SolicitacoesTable solicitacoes={solicitacoes} />
      )}
    </div>
  );
}
