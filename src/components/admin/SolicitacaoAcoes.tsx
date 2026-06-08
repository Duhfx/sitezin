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

function validadePadrao() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

export default function SolicitacaoAcoes(props: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [validade, setValidade] = useState(validadePadrao());

  function handleAprovar() {
    if (props.tipo !== "pendente") return;
    startTransition(async () => {
      const result = await aprovarSolicitacao(props.requestId, validade);
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
        <div className="space-y-3">
          <div>
            <label htmlFor="validade" className="block text-xs font-medium text-muted-foreground mb-1">
              Validade do acesso{" "}
              <span className="font-normal">(deixe em branco para não expirar)</span>
            </label>
            <input
              id="validade"
              type="date"
              value={validade}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setValidade(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleAprovar} disabled={isPending}>
              {isPending ? "Processando…" : "Aprovar"}
            </Button>
            <Button variant="destructive" onClick={handleReprovar} disabled={isPending}>
              Reprovar
            </Button>
          </div>
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
