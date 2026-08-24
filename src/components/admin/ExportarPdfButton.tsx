"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

// A geração roda um Chrome headless no servidor e leva alguns segundos — um <a>
// simples deixaria o botão mudo esse tempo todo. Daí o fetch com estado: baixa o
// blob e dispara o download com o nome que a rota devolveu.
export default function ExportarPdfButton({
  desabilitado = false,
  aviso,
}: {
  // O PDF é gerado a partir do banco: com alteração pendente ele sairia velho.
  desabilitado?: boolean;
  aviso?: string;
}) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function exportar() {
    setGerando(true);
    setErro(null);
    try {
      const res = await fetch("/api/midia-kit/pdf");
      if (!res.ok) {
        const corpo = await res.json().catch(() => null);
        throw new Error(corpo?.error ?? "Não foi possível gerar o PDF.");
      }

      const nome =
        res.headers.get("content-disposition")?.match(/filename="(.+?)"/)?.[1] ?? "midia-kit.pdf";
      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = nome;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível gerar o PDF.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="shrink-0 text-right">
      <button
        type="button"
        onClick={exportar}
        disabled={gerando || desabilitado}
        title={desabilitado ? aviso : undefined}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {gerando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        {gerando ? "Gerando PDF…" : "Baixar PDF"}
      </button>
      {erro && <p className="mt-1 max-w-xs text-xs text-destructive">{erro}</p>}
    </div>
  );
}
