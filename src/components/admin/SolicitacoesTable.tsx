"use client";

import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";

type Status = "pendente" | "aprovado" | "reprovado";

const badgeVariant: Record<Status, "warning" | "success" | "destructive"> = {
  pendente: "warning",
  aprovado: "success",
  reprovado: "destructive",
};

const statusLabel: Record<Status, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

type Solicitacao = {
  id: string;
  nome: string;
  empresa: string;
  email: string;
  status: string;
  created_at: string;
  linkRevogado?: boolean;
};

export default function SolicitacoesTable({ solicitacoes }: { solicitacoes: Solicitacao[] }) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[580px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted">
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Nome</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Empresa</th>
            <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">E-mail</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Data</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {solicitacoes.map((s) => {
            const status = s.status as Status;
            const isPendente = status === "pendente";
            return (
              <tr
                key={s.id}
                onClick={() => router.push(`/admin/solicitacoes/${s.id}`)}
                className={`cursor-pointer border-b border-border transition-colors last:border-0 ${
                  isPendente
                    ? "bg-warning/5 hover:bg-warning/10"
                    : "hover:bg-muted/50"
                }`}
              >
                <td className={`px-4 py-3 font-medium text-foreground ${isPendente ? "border-l-2 border-l-warning" : ""}`}>
                  {s.nome}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{s.empresa}</td>
                <td className="hidden max-w-[180px] truncate px-4 py-3 text-muted-foreground sm:table-cell">
                  {s.email}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(s.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={badgeVariant[status]}>
                      {statusLabel[status] ?? s.status}
                    </Badge>
                    {s.linkRevogado && (
                      <Badge variant="neutral" className="gap-1 opacity-70">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
                          <circle cx="4" cy="4" r="3.5" stroke="currentColor" />
                          <line x1="1.5" y1="6.5" x2="6.5" y2="1.5" stroke="currentColor" strokeLinecap="round" />
                        </svg>
                        link revogado
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-xs font-medium text-primary">Ver →</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
