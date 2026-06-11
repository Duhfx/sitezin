"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  sincronizarInstagram,
  salvarSincronizacao,
  type SyncResult,
} from "@/app/admin/(protected)/perfil/actions";
import type { SyncStep, SyncStepStatus } from "@/lib/instagram-sync";

const STATUS_STYLE: Record<SyncStepStatus, { icon: string; cls: string }> = {
  ok: { icon: "✓", cls: "text-success" },
  erro: { icon: "✕", cls: "text-destructive" },
  pulado: { icon: "—", cls: "text-muted-foreground" },
};

function StepRow({ step }: { step: SyncStep }) {
  const s = STATUS_STYLE[step.status];
  return (
    <li className="flex items-start gap-2 text-sm">
      <span className={`mt-0.5 font-bold ${s.cls}`}>{s.icon}</span>
      <span className="flex-1">
        <span className="font-medium text-foreground">{step.secao}</span>
        {step.detalhe && <span className="block text-xs text-muted-foreground">{step.detalhe}</span>}
      </span>
    </li>
  );
}

export default function InstagramSyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  // Trava o scroll do fundo enquanto a modal está aberta.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function handleSync() {
    setLoading(true);
    setOpen(true);
    setResult(null);
    setSaved(false);
    setSaveError("");

    const r = await sincronizarInstagram();
    setResult(r);
    setLoading(false);
  }

  async function handleSave() {
    if (!result?.payload) return;
    setSaving(true);
    setSaveError("");

    const r = await salvarSincronizacao(result.payload);
    setSaving(false);

    if (r.ok) {
      setSaved(true);
      router.refresh();
    } else {
      setSaveError(r.error ?? "Erro ao salvar.");
    }
  }

  function close() {
    setOpen(false);
    setResult(null);
    setSaved(false);
    setSaveError("");
  }

  const temPayload = !!(result?.ok && result.payload && (result.payload.perfil || result.payload.metrics));

  return (
    <>
      <button
        type="button"
        onClick={handleSync}
        disabled={loading}
        className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {loading ? "Sincronizando…" : "Sincronizar"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={close}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
              <h3 className="text-base font-semibold text-foreground">Sincronização do Instagram</h3>
              {!loading && !saving && (
                <button
                  type="button"
                  onClick={close}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Fechar"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Estado: carregando */}
            {loading && (
              <div className="flex items-center gap-3 px-6 py-8 text-sm text-muted-foreground">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Buscando dados na API do Instagram…
              </div>
            )}

            {/* Estado: resultado */}
            {!loading && result && (
              <>
                <div className="space-y-5 overflow-y-auto px-6 py-5">
                  {/* Banner de status geral */}
                  <div
                    className={`rounded-md px-3 py-2 text-sm font-medium ${
                      saved
                        ? "bg-success/10 text-success"
                        : result.ok
                          ? "bg-muted text-foreground"
                          : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {saved
                      ? "Dados salvos no banco com sucesso!"
                      : result.ok
                        ? "Dados buscados. Revise e clique em Salvar para gravar no banco."
                        : result.error}
                  </div>

                  {/* Etapas */}
                  {result.steps && result.steps.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Etapas
                      </p>
                      <ul className="space-y-2">
                        {result.steps.map((step) => (
                          <StepRow key={step.secao} step={step} />
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Campos a atualizar */}
                  {result.ok && result.grupos && result.grupos.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {saved ? "Campos atualizados" : "Campos que serão atualizados"}
                      </p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {result.grupos.map((grupo) => (
                          <div key={grupo.titulo} className="rounded-md border border-border p-3">
                            <p className="text-xs font-bold text-primary">{grupo.titulo}</p>
                            {grupo.descricao && (
                              <p className="mb-1.5 text-[11px] text-muted-foreground">{grupo.descricao}</p>
                            )}
                            <dl className={`space-y-1 ${grupo.descricao ? "" : "mt-1.5"}`}>
                              {grupo.itens.map((item) => (
                                <div key={item.label} className="flex justify-between gap-3 text-sm">
                                  <dt className="flex items-center gap-1 text-muted-foreground">
                                    {item.label}
                                    {item.hint && (
                                      <span
                                        title={item.hint}
                                        className="cursor-help text-[10px] text-muted-foreground/70"
                                        aria-label={item.hint}
                                      >
                                        ⓘ
                                      </span>
                                    )}
                                  </dt>
                                  <dd className="text-right font-medium text-foreground">{item.valor}</dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {saveError && <p className="text-sm text-destructive">{saveError}</p>}
                </div>

                {/* Rodapé com ações */}
                <div className="flex shrink-0 justify-end gap-3 border-t border-border px-6 py-4">
                  {temPayload && !saved ? (
                    <>
                      <button
                        type="button"
                        onClick={close}
                        disabled={saving}
                        className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 disabled:opacity-60"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                      >
                        {saving ? "Salvando…" : "Salvar"}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={close}
                      className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
                    >
                      Fechar
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
