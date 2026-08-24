// Contrato entre o editor de perfil (/admin/perfil) e a prévia ao vivo que roda
// dentro de um iframe (/admin/preview).
//
// Por que iframe e não renderizar o mídia kit direto no painel: o mídia kit usa
// min-h-[100dvh] e breakpoints. Dentro de uma coluna de ~460px ele viraria uma
// prévia mentirosa (layout mobile fingindo ser desktop). No iframe a página tem
// a própria janela, então dvh e media queries valem de verdade e basta reduzir o
// elemento com transform: scale().

import type { InfluencerMetrics } from "@/types/database";
import type { InfluencerPresentation } from "@/lib/influencer-profile";

export const CANAL = "midia-kit-preview";

export type ModoPreview = "kit" | "pdf";

export type MensagemPreview =
  // iframe -> editor: montei, pode mandar os dados
  | { canal: typeof CANAL; tipo: "pronto" }
  // editor -> iframe: renderize isto
  | {
      canal: typeof CANAL;
      tipo: "dados";
      modo: ModoPreview;
      influencer: InfluencerPresentation;
      metricas: InfluencerMetrics[];
    }
  // editor -> iframe: role até esta âncora
  | { canal: typeof CANAL; tipo: "irPara"; ancora: string };

// Filtra ruído: extensões e outros embeds também postam mensagens na janela.
export function ehMensagemPreview(e: MessageEvent): e is MessageEvent<MensagemPreview> {
  return (
    e.origin === window.location.origin &&
    !!e.data &&
    typeof e.data === "object" &&
    (e.data as { canal?: string }).canal === CANAL
  );
}

// Onde cada seção do editor aparece em cada modo da prévia. As âncoras do mídia
// kit são os `id` das seções de MediaKitPresentationEditorial; as do PDF são as
// chaves de página de MediaKitDeckPdf (que já existiam para o React).
export const ANCORAS: Record<string, Record<ModoPreview, string>> = {
  identidade: { kit: "identidade", pdf: "capa" },
  contato: { kit: "contato", pdf: "contato" },
  localidades: { kit: "publico", pdf: "publico" },
  genero: { kit: "publico", pdf: "publico" },
  idade: { kit: "publico", pdf: "publico" },
  formatos: { kit: "formatos", pdf: "formatos-0" },
  cases: { kit: "cases", pdf: "cases-0" },
  moodboard: { kit: "lookbook", pdf: "lookbook-0" },
  reels: { kit: "reels", pdf: "reels-0" },
};
