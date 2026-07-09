"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import {
  aprovarSolicitacao,
  reprovarSolicitacao,
  revogarAcesso,
  excluirAcesso,
} from "@/app/admin/(protected)/solicitacoes/actions";

type Props =
  | { tipo: "pendente"; requestId: string }
  | { tipo: "revogar"; accessId: string; requestId: string; ativo: boolean };

function validadePadrao() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

export default function SolicitacaoAcoes(props: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [validade, setValidade] = useState(validadePadrao());
  const [confirmReprovar, setConfirmReprovar] = useState(false);
  const [confirmRevogar, setConfirmRevogar] = useState(false);
  const [confirmExcluir, setConfirmExcluir] = useState(false);

  function handleAprovar() {
    if (props.tipo !== "pendente") return;
    setError("");
    startTransition(async () => {
      const result = await aprovarSolicitacao(props.requestId, validade);
      if (result.ok) {
        setSuccessMsg("Solicitação aprovada com sucesso!");
      } else {
        setError(result.error ?? "Erro desconhecido.");
      }
    });
  }

  function handleReprovar() {
    if (props.tipo !== "pendente") return;
    setError("");
    startTransition(async () => {
      const result = await reprovarSolicitacao(props.requestId);
      if (result.ok) {
        setSuccessMsg("Solicitação reprovada.");
      } else {
        setError(result.error ?? "Erro desconhecido.");
      }
    });
  }

  function handleRevogar() {
    if (props.tipo !== "revogar") return;
    setError("");
    startTransition(async () => {
      const result = await revogarAcesso(props.accessId, props.requestId);
      if (result.ok) {
        setSuccessMsg("Acesso revogado com sucesso.");
      } else {
        setError(result.error ?? "Erro desconhecido.");
      }
    });
  }

  function handleExcluir() {
    if (props.tipo !== "revogar") return;
    setError("");
    startTransition(async () => {
      const result = await excluirAcesso(props.accessId, props.requestId);
      if (result.ok) {
        setSuccessMsg("Acesso excluído. O histórico de visitas foi apagado.");
      } else {
        setError(result.error ?? "Erro desconhecido.");
      }
    });
  }

  if (successMsg) {
    return (
      <p className="rounded-md bg-success/10 px-3 py-2 text-sm font-medium text-success">
        {successMsg}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {props.tipo === "pendente" && (
        <>
          {/* Ação principal: Aprovar */}
          <div className="space-y-3">
            <div>
              <label htmlFor="validade" className="mb-1 block text-xs font-medium text-muted-foreground">
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
            <Button onClick={handleAprovar} disabled={isPending}>
              {isPending ? "Processando…" : "Aprovar solicitação"}
            </Button>
          </div>

          {/* Ação destrutiva: Reprovar — visualmente separada */}
          <div className="border-t border-border pt-4">
            {confirmReprovar ? (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 space-y-3">
                <p className="text-sm font-medium text-foreground">Reprovar esta solicitação?</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={handleReprovar} disabled={isPending}>
                    {isPending ? "Reprovando…" : "Sim, reprovar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmReprovar(false)}
                    disabled={isPending}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReprovar(true)}
                disabled={isPending}
                className="text-xs text-muted-foreground underline-offset-2 hover:text-destructive hover:underline disabled:opacity-60"
              >
                Reprovar solicitação
              </button>
            )}
          </div>
        </>
      )}

      {props.tipo === "revogar" && (
        <div className="space-y-4">
          {/* Revogar — só faz sentido enquanto o acesso está ativo */}
          {props.ativo &&
            (confirmRevogar ? (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Revogar o acesso?</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    O link do mídia kit deixará de funcionar imediatamente. O histórico de visitas é
                    mantido.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={handleRevogar} disabled={isPending}>
                    {isPending ? "Revogando…" : "Sim, revogar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmRevogar(false)}
                    disabled={isPending}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="destructive" onClick={() => setConfirmRevogar(true)} disabled={isPending}>
                Revogar acesso
              </Button>
            ))}

          {/* Excluir de vez — disponível mesmo já revogado; apaga o histórico */}
          <div className={props.ativo ? "border-t border-border pt-4" : ""}>
            {confirmExcluir ? (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Excluir o acesso?</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    O link some para sempre e o histórico de visitas dele é apagado. Não dá pra
                    desfazer.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={handleExcluir} disabled={isPending}>
                    {isPending ? "Excluindo…" : "Sim, excluir"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmExcluir(false)}
                    disabled={isPending}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmExcluir(true)}
                disabled={isPending}
                className="text-xs text-muted-foreground underline-offset-2 hover:text-destructive hover:underline disabled:opacity-60"
              >
                Excluir acesso permanentemente
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-sm bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
