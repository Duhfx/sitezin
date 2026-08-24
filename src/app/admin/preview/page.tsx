"use client";

// Prévia ao vivo do mídia kit, feita para rodar dentro do iframe do editor de
// perfil. Não busca nada: recebe por postMessage o perfil que está sendo digitado
// em /admin/perfil (inclusive fotos ainda não salvas, como blob:) e renderiza os
// MESMOS componentes que a marca vê — o site (MediaKitPresentationEditorial) e o
// deck 16:9 que vira PDF (MediaKitDeckPdf).
//
// Fora do grupo (protected) de propósito, igual a /admin/midia-kit-pdf: aqui não
// queremos a AdminSidebar. Continua protegida pelo middleware (/admin/:path*).

import { useEffect, useState } from "react";
import MediaKitPresentationEditorial from "@/components/midia-kit/MediaKitPresentationEditorial";
import MediaKitDeckPdf from "@/components/midia-kit/MediaKitDeckPdf";
import DeckOverflowCheck from "@/components/midia-kit/DeckOverflowCheck";
import {
  CANAL,
  ehMensagemPreview,
  type ModoPreview,
} from "@/lib/preview-midia-kit";
import type { InfluencerPresentation } from "@/lib/influencer-profile";
import type { InfluencerMetrics } from "@/types/database";

type Dados = {
  modo: ModoPreview;
  influencer: InfluencerPresentation;
  metricas: InfluencerMetrics[];
};

export default function PreviewPage() {
  const [dados, setDados] = useState<Dados | null>(null);
  // Muda a cada pacote de dados: é o que faz o DeckOverflowCheck medir de novo
  // depois de uma edição (senão o aviso de conteúdo cortado congelaria no
  // primeiro render).
  const [revisao, setRevisao] = useState(0);

  useEffect(() => {
    function aoReceber(e: MessageEvent) {
      if (!ehMensagemPreview(e)) return;
      const msg = e.data;

      if (msg.tipo === "dados") {
        setDados({ modo: msg.modo, influencer: msg.influencer, metricas: msg.metricas });
        setRevisao((r) => r + 1);
      }

      if (msg.tipo === "irPara") {
        // A seção pode não existir (moodboard com menos de 3 fotos, reels sem
        // capa): nesse caso não rola nada, e o editor já avisa o porquê.
        document.getElementById(msg.ancora)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    window.addEventListener("message", aoReceber);
    window.parent?.postMessage({ canal: CANAL, tipo: "pronto" }, window.location.origin);
    return () => window.removeEventListener("message", aoReceber);
  }, []);

  if (!dados) {
    return (
      <div className="min-h-screen animate-pulse bg-[#F7F2EC] p-10">
        <div className="h-14 w-2/3 rounded bg-black/5" />
        <div className="mt-4 h-14 w-1/2 rounded bg-black/5" />
        <div className="mt-10 h-64 w-full rounded bg-black/5" />
      </div>
    );
  }

  if (dados.modo === "pdf") {
    return (
      <>
        <MediaKitDeckPdf influencer={dados.influencer} metricas={dados.metricas} />
        <DeckOverflowCheck chave={revisao} />
      </>
    );
  }

  return (
    <MediaKitPresentationEditorial influencer={dados.influencer} metricas={dados.metricas} />
  );
}
