"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sincronizarMetricasDashboard } from "@/app/admin/(protected)/dashboard/actions";

type Status = "idle" | "loading" | "success" | "error";

function IconRefresh({ spin }: { spin: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`h-3.5 w-3.5 ${spin ? "animate-spin" : ""}`}
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}

export default function DashboardSyncButton({
  igSyncedAt,
  tkSyncedAt,
}: {
  igSyncedAt: string | null;
  tkSyncedAt: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [mensagem, setMensagem] = useState("");

  async function handleSync() {
    setStatus("loading");
    setMensagem("");

    const res = await sincronizarMetricasDashboard();

    if (!res.ok) {
      setStatus("error");
      setMensagem(res.error);
      return;
    }

    const { instagram, tiktok } = res.result;
    const erros = [
      !instagram.ok && instagram.error,
      !tiktok.ok && tiktok.error,
    ].filter(Boolean) as string[];

    if (erros.length === 2) {
      setStatus("error");
      setMensagem(erros.join(" · "));
    } else if (erros.length === 1) {
      setStatus("success");
      setMensagem(`Parcial: ${erros[0]}`);
      router.refresh();
    } else {
      setStatus("success");
      setMensagem("Métricas atualizadas!");
      router.refresh();
    }

    setTimeout(() => {
      setStatus("idle");
      setMensagem("");
    }, 4000);
  }

  const lastSync = igSyncedAt ?? tkSyncedAt;
  const syncLabel = lastSync ? tempoAtras(lastSync) : null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {syncLabel && (
        <span className="text-xs text-muted-foreground">
          Última sync: {syncLabel}
        </span>
      )}

      <button
        type="button"
        onClick={handleSync}
        disabled={status === "loading"}
        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        <IconRefresh spin={status === "loading"} />
        {status === "loading" ? "Sincronizando…" : "Atualizar agora"}
      </button>

      {status === "success" && (
        <span className="text-xs font-medium text-success">{mensagem}</span>
      )}
      {status === "error" && (
        <span className="max-w-xs text-xs text-destructive">{mensagem}</span>
      )}
    </div>
  );
}

function tempoAtras(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 60) return min <= 1 ? "há poucos minutos" : `há ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days} dia${days > 1 ? "s" : ""}`;
}
