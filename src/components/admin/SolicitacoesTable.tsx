"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import { excluirSolicitacao } from "@/app/admin/(protected)/solicitacoes/actions";

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
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleExcluir(id: string) {
    startTransition(async () => {
      const result = await excluirSolicitacao(id);
      if (result.ok) {
        setConfirmId(null);
        router.refresh();
      } else {
        alert(result.error ?? "Erro ao excluir.");
      }
    });
  }

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
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  {confirmId === s.id ? (
                    <span className="inline-flex items-center gap-2 whitespace-nowrap">
                      <span className="text-xs text-muted-foreground">Excluir?</span>
                      <button
                        onClick={() => handleExcluir(s.id)}
                        disabled={isPending}
                        className="text-xs font-semibold text-destructive underline-offset-2 hover:underline disabled:opacity-60"
                      >
                        {isPending ? "…" : "Sim"}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        disabled={isPending}
                        className="text-xs text-muted-foreground underline-offset-2 hover:underline disabled:opacity-60"
                      >
                        Não
                      </button>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-3 whitespace-nowrap">
                      <button
                        onClick={() => router.push(`/admin/solicitacoes/${s.id}`)}
                        className="text-xs font-medium text-primary"
                      >
                        Ver →
                      </button>
                      <button
                        onClick={() => setConfirmId(s.id)}
                        aria-label="Excluir solicitação"
                        title="Excluir solicitação"
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
