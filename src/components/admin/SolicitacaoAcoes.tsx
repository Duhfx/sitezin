"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import {
  aprovarSolicitacao,
  reprovarSolicitacao,
  revogarAcesso,
} from "@/app/admin/(protected)/solicitacoes/actions";

type Props =
  | { tipo: "pendente"; requestId: string }
  | { tipo: "revogar"; accessId: string; requestId: string };

export default function SolicitacaoAcoes(props: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleAprovar() {
    if (props.tipo !== "pendente") return;
    startTransition(async () => {
      const result = await aprovarSolicitacao(props.requestId);
      if (!result.ok) setError(result.error ?? "Erro desconhecido.");
    });
  }

  function handleReprovar() {
    if (props.tipo !== "pendente") return;
    if (!window.confirm("Reprovar esta solicitação?")) return;
    startTransition(async () => {
      const result = await reprovarSolicitacao(props.requestId);
      if (!result.ok) setError(result.error ?? "Erro desconhecido.");
    });
  }

  function handleRevogar() {
    if (props.tipo !== "revogar") return;
    if (!window.confirm("Revogar o acesso ao mídia kit? O link deixará de funcionar.")) return;
    startTransition(async () => {
      const result = await revogarAcesso(props.accessId, props.requestId);
      if (!result.ok) setError(result.error ?? "Erro desconhecido.");
    });
  }

  return (
    <div className="space-y-3">
      {props.tipo === "pendente" && (
        <div className="flex gap-3">
          <Button onClick={handleAprovar} disabled={isPending}>
            {isPending ? "Processando…" : "Aprovar"}
          </Button>
          <Button variant="destructive" onClick={handleReprovar} disabled={isPending}>
            Reprovar
          </Button>
        </div>
      )}

      {props.tipo === "revogar" && (
        <Button variant="destructive" onClick={handleRevogar} disabled={isPending}>
          {isPending ? "Revogando…" : "Revogar acesso"}
        </Button>
      )}

      {error && (
        <p className="rounded-sm bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
