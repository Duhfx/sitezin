"use client";

// Painel de prévia ao vivo do editor de perfil. Mostra, sem sair da página, o
// que a marca vai receber: o mídia kit (site) e o deck 16:9 que vira PDF.
//
// O conteúdo roda em /admin/preview dentro de um iframe e é alimentado por
// postMessage — ver src/lib/preview-midia-kit.ts para o porquê do iframe.

import { useEffect, useRef, useState } from "react";
import { Monitor, Smartphone, FileText, LayoutTemplate, Eye } from "lucide-react";
import ExportarPdfButton from "@/components/admin/ExportarPdfButton";
import { cn } from "@/lib/utils";
import { ANCORAS, CANAL, ehMensagemPreview, type ModoPreview } from "@/lib/preview-midia-kit";
import type { InfluencerPresentation } from "@/lib/influencer-profile";
import type { InfluencerMetrics } from "@/types/database";

type Dispositivo = "celular" | "desktop";

// Largura da "janela" virtual de cada modo. O celular cabe quase 1:1 na coluna
// (que é estreita e alta, igual a um telefone); o desktop entra reduzido, com a
// proporção de tela real; o deck tem 1280 de página + as margens do @media screen.
const LARGURA = { celular: 420, desktop: 1440, pdf: 1328 };
const ALTURA_DESKTOP = 900; // proporção de notebook: sem isso o hero (100dvh) esticaria

type Props = {
  influencer: InfluencerPresentation;
  metricas: InfluencerMetrics[];
  /** Seção aberta na sanfona do editor: a prévia rola até o trecho equivalente. */
  secaoAtiva: string;
  /** Há alterações não salvas: o PDF é gerado do banco, então exportar agora sairia velho. */
  pendente: boolean;
};

export default function PreviewPanel({ influencer, metricas, secaoAtiva, pendente }: Props) {
  const [modo, setModo] = useState<ModoPreview>("kit");
  const [dispositivo, setDispositivo] = useState<Dispositivo>("desktop");
  // Contador, e não booleano: o iframe é desmontado quando o painel fica sem
  // tamanho (aba "Métricas", telas pequenas). Ao voltar, o iframe novo anuncia
  // "pronto" de novo e o contador muda, o que reenvia os dados — com um booleano
  // que já era `true` a prévia voltaria em branco.
  const [prontoEm, setProntoEm] = useState(0);
  const [caixa, setCaixa] = useState({ largura: 0, altura: 0 });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);

  // Espera o iframe avisar que montou — mandar dados antes disso seria falar
  // sozinho (o listener de lá ainda não existe).
  useEffect(() => {
    function aoReceber(e: MessageEvent) {
      if (!ehMensagemPreview(e) || e.data.tipo !== "pronto") return;
      if (e.source !== iframeRef.current?.contentWindow) return;
      setProntoEm((n) => n + 1);
    }
    window.addEventListener("message", aoReceber);
    return () => window.removeEventListener("message", aoReceber);
  }, []);

  // Tamanho disponível: a escala da prévia sai daqui.
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entrada]) => {
      const { width, height } = entrada.contentRect;
      setCaixa({ largura: width, altura: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Dados novos a cada tecla: o debounce evita repintar o mídia kit inteiro
  // caractere por caractere.
  useEffect(() => {
    if (!prontoEm) return;
    const t = setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        { canal: CANAL, tipo: "dados", modo, influencer, metricas },
        window.location.origin,
      );
    }, 200);
    return () => clearTimeout(t);
  }, [prontoEm, modo, influencer, metricas]);

  // Abrir uma seção no editor rola a prévia até ela. O atraso é maior que o
  // debounce acima para a âncora já existir quando a ordem chegar.
  useEffect(() => {
    if (!prontoEm || !secaoAtiva) return;
    const ancora = ANCORAS[secaoAtiva]?.[modo];
    if (!ancora) return;
    const t = setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        { canal: CANAL, tipo: "irPara", ancora },
        window.location.origin,
      );
    }, 280);
    return () => clearTimeout(t);
  }, [prontoEm, secaoAtiva, modo]);

  const larguraVirtual = modo === "pdf" ? LARGURA.pdf : LARGURA[dispositivo];
  const escala = caixa.largura ? Math.min(1, caixa.largura / larguraVirtual) : 0;
  // No mídia kit em desktop a altura é fixa (tela de notebook). Nos outros modos
  // a janela virtual estica até o fim do painel: aproveita o espaço e, no deck,
  // mostra várias folhas de uma vez.
  const alturaVirtual =
    modo === "kit" && dispositivo === "desktop"
      ? ALTURA_DESKTOP
      : escala
        ? caixa.altura / escala
        : 0;
  const sobra = Math.max(0, caixa.altura - alturaVirtual * escala);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card">
      {/* ── Cabeçalho: o que estou vendo, e em que tela ─────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Eye className="h-3.5 w-3.5" />
          Pré-visualização
        </span>

        <Segmento
          valor={modo}
          onChange={setModo}
          opcoes={[
            { valor: "kit" as const, rotulo: "Mídia kit", icon: LayoutTemplate },
            { valor: "pdf" as const, rotulo: "PDF", icon: FileText },
          ]}
        />

        {modo === "kit" && (
          <Segmento
            valor={dispositivo}
            onChange={setDispositivo}
            opcoes={[
              { valor: "celular" as const, rotulo: "Celular", icon: Smartphone },
              { valor: "desktop" as const, rotulo: "Desktop", icon: Monitor },
            ]}
          />
        )}

        <div className="ml-auto">
          <ExportarPdfButton
            desabilitado={pendente}
            aviso={pendente ? "Salve as alterações para exportar o PDF atualizado." : undefined}
          />
        </div>
      </div>

      {/* ── Prévia ──────────────────────────────────────────────────── */}
      <div ref={areaRef} className="relative flex-1 overflow-hidden bg-muted">
        {escala > 0 && (
          <iframe
            ref={iframeRef}
            src="/admin/preview"
            title="Prévia do mídia kit"
            className="absolute left-0 border-0 bg-white"
            style={{
              width: larguraVirtual,
              height: alturaVirtual,
              top: sobra / 2,
              transform: `scale(${escala})`,
              transformOrigin: "top left",
            }}
          />
        )}
        {!prontoEm && (
          <p className="absolute inset-x-0 bottom-3 text-center text-xs text-muted-foreground">
            Carregando a prévia…
          </p>
        )}
      </div>

      <p className="border-t border-border px-3 py-2 text-[0.7rem] text-muted-foreground">
        Prévia ao vivo, incluindo o que ainda não foi salvo.
      </p>
    </div>
  );
}

// Alternador de duas opções. Um <fieldset> de rádio daria o mesmo com semântica
// nativa, mas este painel vive dentro do <form> do perfil e rádios entrariam no
// FormData — daí botões.
function Segmento<T extends string>({
  valor,
  onChange,
  opcoes,
}: {
  valor: T;
  onChange: (v: T) => void;
  opcoes: { valor: T; rotulo: string; icon: React.ComponentType<{ className?: string }> }[];
}) {
  return (
    <div className="inline-flex rounded-lg bg-muted p-0.5">
      {opcoes.map(({ valor: v, rotulo, icon: Icon }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={valor === v}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
            valor === v
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {rotulo}
        </button>
      ))}
    </div>
  );
}
