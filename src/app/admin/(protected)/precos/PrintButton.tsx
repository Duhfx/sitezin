"use client";

import { Printer } from "lucide-react";

// Botão de impressão nativa do navegador (Salvar como PDF). Some na impressão.
export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-full bg-[#FF9A86] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#FF7A60] active:translate-y-px print:hidden"
    >
      <Printer className="h-4 w-4" />
      Imprimir / Salvar PDF
    </button>
  );
}
