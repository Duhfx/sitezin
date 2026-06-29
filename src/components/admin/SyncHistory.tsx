"use client";

import { useEffect, useState } from "react";
import type { SyncLog } from "@/types/database";

function fmtDataHora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PLATFORM_LABEL: Record<SyncLog["platform"], string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
};

const SOURCE_LABEL: Record<SyncLog["source"], string> = {
  cron: "automático",
  manual: "manual",
};

function IconHistory() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
    >
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

export default function SyncHistory({ logs }: { logs: SyncLog[] }) {
  const [aberto, setAberto] = useState(false);

  // Fecha com Esc e trava o scroll do body enquanto o modal está aberto.
  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [aberto]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <IconHistory />
        Histórico
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
          onClick={() => setAberto(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Histórico de sincronizações"
            className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">
                Histórico de sincronizações
              </h2>
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar"
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="max-h-[calc(80vh-60px)] overflow-y-auto p-5">
              {logs.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma sincronização registrada ainda.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[460px] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                          Quando
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                          Plataforma
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                          Resultado
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                          Origem
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr
                          key={log.id}
                          className="border-b border-border last:border-0 transition-colors hover:bg-muted/40"
                        >
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                            {fmtDataHora(log.created_at)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {PLATFORM_LABEL[log.platform]}
                          </td>
                          <td className="px-4 py-3">
                            {log.status === "ok" ? (
                              <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                                ✓ ok
                              </span>
                            ) : (
                              <span
                                title={log.error ?? undefined}
                                className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive"
                              >
                                ✗ {log.error ?? "erro"}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {SOURCE_LABEL[log.source]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
