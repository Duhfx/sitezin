"use client";

// Editor do moodboard: mostra as 3 fotos no MESMO mosaico do mídia kit e do PDF
// (colunas 5fr/7fr, duas linhas de altura igual, retrato alto à esquerda), então o que se vê
// aqui é o enquadramento que vai sair lá. Arrastar a foto move o object-position
// dentro da célula — cada célula tem proporção diferente da foto, e o centro
// (padrão do object-fit: cover) costuma cortar cabeça ou pé.
//
// Controlado pelo PerfilForm: o state das 3 fotos vive lá (o modal de
// pré-visualização também usa), aqui só entram os inputs do form.

import { useRef } from "react";
import { ImagePlus, Move } from "lucide-react";
import { POS_PADRAO, ZOOM_PADRAO, ZOOM_MAX } from "@/lib/influencer-profile";
import { estiloFoto, pxPorCento } from "@/lib/midia-kit-format";

export type FotoMoodboard = { url: string; pos: string; zoom: number };

function parsePos(pos: string): [number, number] {
  const [x, y] = pos.split(/\s+/);
  return [parseFloat(x) || 50, parseFloat(y) || 50];
}

const limitar = (n: number) => Math.min(100, Math.max(0, n));

function Celula({
  i,
  foto,
  urlSalva,
  onFoto,
  className,
}: {
  i: number;
  foto: FotoMoodboard;
  urlSalva: string;
  onFoto: (patch: Partial<FotoMoodboard>) => void;
  className: string;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const arraste = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  function aoMover(e: React.PointerEvent) {
    const a = arraste.current;
    const img = imgRef.current;
    if (!a || !img?.naturalWidth) return;

    // Escala do object-fit: cover — a mesma nos dois eixos.
    const cover = Math.max(img.clientWidth / img.naturalWidth, img.clientHeight / img.naturalHeight);
    const porX = pxPorCento(img.naturalWidth, img.clientWidth, cover, foto.zoom);
    const porY = pxPorCento(img.naturalHeight, img.clientHeight, cover, foto.zoom);

    // Arrastar pra direita mostra o que está à esquerda → a porcentagem cai.
    // Eixo sem sobra fica no centro (não há o que reposicionar).
    const x = porX > 0.01 ? limitar(a.px - (e.clientX - a.x) / porX) : 50;
    const y = porY > 0.01 ? limitar(a.py - (e.clientY - a.y) / porY) : 50;
    onFoto({ pos: `${Math.round(x)}% ${Math.round(y)}%` });
  }

  return (
    <div className={`group relative overflow-hidden rounded-[1.25rem] bg-muted ${className}`}>
      <input type="hidden" name={`moodboard_url_atual_${i}`} value={urlSalva} />
      <input type="hidden" name={`moodboard_pos_${i}`} value={foto.pos} />
      <input type="hidden" name={`moodboard_zoom_${i}`} value={foto.zoom} />
      <input
        ref={fileRef}
        name={`moodboard_${i}`}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Foto nova entra centralizada: o enquadramento da anterior não tem
          // relação nenhuma com o novo corte.
          if (file) onFoto({ url: URL.createObjectURL(file), pos: POS_PADRAO, zoom: ZOOM_PADRAO });
        }}
      />

      {foto.url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={foto.url}
            alt={`Moodboard ${i + 1}`}
            draggable={false}
            // touch-none: sem isso o gesto vira scroll da página no celular.
            className="h-full w-full cursor-grab touch-none select-none object-cover active:cursor-grabbing"
            style={estiloFoto(foto.pos, foto.zoom)}
            onPointerDown={(e) => {
              const [px, py] = parsePos(foto.pos);
              arraste.current = { x: e.clientX, y: e.clientY, px, py };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={aoMover}
            onPointerUp={() => (arraste.current = null)}
            onPointerCancel={() => (arraste.current = null)}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 space-y-1.5 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-[0.65rem] font-medium text-white">
                <Move className="h-3 w-3" /> arraste para enquadrar
              </span>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="pointer-events-auto rounded bg-white/90 px-2 py-1 text-[0.65rem] font-medium text-slate-700 hover:bg-white"
              >
                Trocar
              </button>
            </div>
            {/* input range nativo: funciona no mouse e no toque sem lidar com o
                wheel (que só dá pra bloquear o scroll da página com listener
                não-passivo). Duplo clique no rótulo volta pro 1x. */}
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => onFoto({ zoom: ZOOM_PADRAO })}
                title="Voltar ao tamanho original"
                className="w-9 shrink-0 text-left text-[0.65rem] font-medium text-white/90 hover:text-white"
              >
                {foto.zoom.toFixed(1)}x
              </button>
              <input
                type="range"
                aria-label={`Zoom da foto ${i + 1}`}
                min={1}
                max={ZOOM_MAX}
                step={0.05}
                value={foto.zoom}
                onChange={(e) => onFoto({ zoom: Number(e.target.value) })}
                className="h-1 w-full accent-[#FF9A86]"
              />
            </div>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
        >
          <ImagePlus className="h-5 w-5" strokeWidth={1.5} />
          <span className="text-xs font-medium">Foto {i + 1}</span>
        </button>
      )}
    </div>
  );
}

export default function MoodboardMosaico({
  fotos,
  urlsSalvas,
  onChange,
}: {
  fotos: FotoMoodboard[];
  urlsSalvas: string[];
  onChange: (fotos: FotoMoodboard[]) => void;
}) {
  const patch = (i: number, p: Partial<FotoMoodboard>) =>
    onChange(fotos.map((f, j) => (j === i ? { ...f, ...p } : f)));

  // Proporção da área útil da folha do PDF (1200x640) — o mesmo aspect usado no
  // mídia kit, para o corte daqui bater com o de lá.
  return (
    <div className="grid aspect-[15/8] grid-cols-[5fr_7fr] grid-rows-[1fr_1fr] gap-3">
      <Celula i={0} foto={fotos[0]} urlSalva={urlsSalvas[0] ?? ""} onFoto={(p) => patch(0, p)} className="row-span-2" />
      <Celula i={1} foto={fotos[1]} urlSalva={urlsSalvas[1] ?? ""} onFoto={(p) => patch(1, p)} className="" />
      <Celula i={2} foto={fotos[2]} urlSalva={urlsSalvas[2] ?? ""} onFoto={(p) => patch(2, p)} className="" />
    </div>
  );
}
