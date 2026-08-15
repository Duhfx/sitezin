"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  User, AtSign, MapPin, Users, CalendarRange, LayoutGrid, Trophy,
  Image as ImageIcon, Film, Plus, Eye, X, type LucideIcon,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Textarea from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";
import { comprimirImagensDoForm } from "@/lib/imagem-client";
import { salvarPerfil } from "@/app/admin/(protected)/perfil/actions";
import { PROFILE_ID, toPresentation } from "@/lib/influencer-profile";
import MediaKitPresentation from "@/components/midia-kit/MediaKitPresentation";

// Índice das seções: alimenta a navegação sticky e dá âncora a cada bloco.
// Manter em sincronia com os `id` dos SectionCard abaixo.
const SECOES: { id: string; nav: string; icon: LucideIcon }[] = [
  { id: "identidade", nav: "Identidade", icon: User },
  { id: "contato", nav: "Contato", icon: AtSign },
  { id: "localidades", nav: "Localidades", icon: MapPin },
  { id: "genero", nav: "Gênero", icon: Users },
  { id: "idade", nav: "Idade", icon: CalendarRange },
  { id: "formatos", nav: "Formatos", icon: LayoutGrid },
  { id: "cases", nav: "Cases", icon: Trophy },
  { id: "moodboard", nav: "Moodboard", icon: ImageIcon },
  { id: "reels", nav: "Reels", icon: Film },
];
import type {
  AudienciaGenero,
  AudienciaIdade,
  Case,
  Formato,
  InfluencerMetrics,
  InfluencerProfile,
  Reel,
  TopEstado,
} from "@/types/database";

type Props = { initialData: InfluencerProfile; metricas: InfluencerMetrics[] };

export default function PerfilForm({ initialData, metricas }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [previewData, setPreviewData] = useState<ReturnType<typeof toPresentation> | null>(null);

  const [topEstados, setTopEstados] = useState<TopEstado[]>(initialData.top_estados ?? []);
  const [audienciaGenero, setAudienciaGenero] = useState<AudienciaGenero[]>(
    initialData.audiencia_genero ?? [],
  );
  const [audienciaIdade, setAudienciaIdade] = useState<AudienciaIdade[]>(
    initialData.audiencia_idade ?? [],
  );
  const [formatos, setFormatos] = useState<Formato[]>(initialData.formatos ?? []);
  const [cases, setCases] = useState<Case[]>(initialData.cases ?? []);

  const moodboardInicial = initialData.moodboard ?? [];
  const [fotoPreview, setFotoPreview] = useState<string | null>(initialData.foto_url ?? null);
  const [moodboardPreviews, setMoodboardPreviews] = useState<(string | null)[]>([
    moodboardInicial[0] ?? null,
    moodboardInicial[1] ?? null,
    moodboardInicial[2] ?? null,
  ]);

  // Reels em destaque: 3 slots. Print + link editáveis; métricas vêm do sync.
  const reelsInicial = initialData.reels ?? [];
  const [reelPreviews, setReelPreviews] = useState<(string | null)[]>([
    reelsInicial[0]?.thumb ?? null,
    reelsInicial[1]?.thumb ?? null,
    reelsInicial[2]?.thumb ?? null,
  ]);
  const [reelPermalinks, setReelPermalinks] = useState<string[]>([
    reelsInicial[0]?.permalink ?? "",
    reelsInicial[1]?.permalink ?? "",
    reelsInicial[2]?.permalink ?? "",
  ]);
  // Capa salva de cada reel (separada do preview, que pode ser um blob: local).
  // É o que o form envia como thumb atual — zerar aqui faz o sync assumir a capa.
  const [reelThumbs, setReelThumbs] = useState<string[]>([
    reelsInicial[0]?.thumb ?? "",
    reelsInicial[1]?.thumb ?? "",
    reelsInicial[2]?.thumb ?? "",
  ]);
  const reelFileRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Remove a capa manual e devolve a responsabilidade ao sync: limpa a thumb
  // salva, o preview e qualquer arquivo selecionado.
  //
  // Salva na hora (submete o form) porque o sync lê os reels DO BANCO, não deste
  // formulário: com a thumb antiga ainda gravada, materializarThumbsReels pula o
  // download e a capa velha fica. Sem o save aqui, "remover → sincronizar" não
  // faz nada e o único aviso seria um texto pedindo pra clicar em Salvar antes.
  // flushSync garante que o hidden `reel_url_atual_${i}` já esteja vazio no
  // submit (setState é assíncrono).
  function usarCapaAutomatica(i: number) {
    flushSync(() => {
      setReelThumbs((prev) => prev.map((t, j) => (j === i ? "" : t)));
      setReelPreviews((prev) => prev.map((t, j) => (j === i ? null : t)));
    });
    if (reelFileRefs.current[i]) reelFileRefs.current[i]!.value = "";
    formRef.current?.requestSubmit();
  }

  // Soma dos percentuais — gênero e idade devem fechar em 100%. Mostrada ao vivo
  // como aviso para quem edita não deixar a divisão inconsistente.
  const somaGenero = audienciaGenero.reduce((s, g) => s + (Number(g.pct) || 0), 0);
  const somaIdade = audienciaIdade.reduce((s, f) => s + (Number(f.pct) || 0), 0);

  function abrirPreview() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    const snap: InfluencerProfile = {
      ...initialData,
      id: PROFILE_ID,
      nome: String(fd.get("nome") ?? ""),
      nicho: String(fd.get("nicho") ?? ""),
      biografia: String(fd.get("biografia") ?? ""),
      publico_alvo: String(fd.get("publico_alvo") ?? ""),
      localizacao: String(fd.get("localizacao") ?? ""),
      instagram_url: String(fd.get("instagram_url") ?? "") || null,
      tiktok_url: String(fd.get("tiktok_url") ?? "") || null,
      youtube_url: String(fd.get("youtube_url") ?? "") || null,
      email: String(fd.get("email") ?? "") || null,
      whatsapp: String(fd.get("whatsapp") ?? "") || null,
      foto_url: fotoPreview,
      top_estados: topEstados,
      audiencia_genero: audienciaGenero,
      audiencia_idade: audienciaIdade,
      formatos,
      cases,
      moodboard: moodboardPreviews.filter(Boolean) as string[],
      reels: [0, 1, 2]
        .map((i) => ({
          thumb: reelPreviews[i] ?? "",
          permalink: reelPermalinks[i] || undefined,
          media_id: reelsInicial[i]?.media_id,
          views: reelsInicial[i]?.views ?? 0,
          likes: reelsInicial[i]?.likes ?? 0,
          comments: reelsInicial[i]?.comments ?? 0,
        }))
        .filter((r) => r.thumb || r.permalink),
    };
    setPreviewData(toPresentation(snap));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    if (!String(formData.get("nome") ?? "").trim()) {
      setError("Informe o nome.");
      return;
    }

    setLoading(true);
    try {
      // Reduz as imagens antes de enviar — foto de celular vem com 10–15 MB.
      await comprimirImagensDoForm(formData);
      const result = await salvarPerfil(formData);
      if (result?.ok) {
        setSuccess(true);
      } else if (result) {
        setError(result.error ?? "Erro ao salvar o perfil.");
      }
    } catch (e) {
      // Sem isso a falha (upload grande demais, rede) só rejeitava a promise: o
      // botão ficava travado em "Salvando" e parecia que tinha salvo.
      setError(e instanceof Error ? e.message : "Erro ao salvar o perfil.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="scroll-smooth space-y-6">
      {/* ── Índice de seções (navegação sticky) ──────────────────── */}
      <nav
        aria-label="Seções do perfil"
        className="sticky top-0 z-20 -mx-1 flex flex-wrap gap-1.5 rounded-xl border border-border bg-card/95 px-2 py-2 shadow-card backdrop-blur-sm"
      >
        {SECOES.map(({ id, nav, icon: Icon }) => (
          <a
            key={id}
            href={`#${id}`}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            {nav}
          </a>
        ))}
      </nav>

      {/* Listas serializadas */}
      <input type="hidden" name="top_estados" value={JSON.stringify(topEstados)} />
      <input type="hidden" name="audiencia_genero" value={JSON.stringify(audienciaGenero)} />
      <input type="hidden" name="audiencia_idade" value={JSON.stringify(audienciaIdade)} />
      <input type="hidden" name="formatos" value={JSON.stringify(formatos)} />
      <input type="hidden" name="cases" value={JSON.stringify(cases)} />
      <input type="hidden" name="foto_url_atual" value={initialData.foto_url ?? ""} />

      {/* ── Identidade ──────────────────────────────────────────── */}
      <SectionCard
        id="identidade"
        icon={User}
        titulo="Identidade"
        descricao="Nome, nicho, bio e foto que aparecem no topo do mídia kit."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" defaultValue={initialData.nome} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nicho">Nicho</Label>
            <Input id="nicho" name="nicho" defaultValue={initialData.nicho} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="biografia">Biografia</Label>
          <Textarea id="biografia" name="biografia" rows={3} defaultValue={initialData.biografia} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="publico_alvo">Público-alvo</Label>
          <Input id="publico_alvo" name="publico_alvo" defaultValue={initialData.publico_alvo} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="localizacao">
            Localização
            <span className="ml-1 font-normal text-muted-foreground">(exibida no topo do mídia kit)</span>
          </Label>
          <Input
            id="localizacao"
            name="localizacao"
            defaultValue={initialData.localizacao ?? ""}
            placeholder="Blumenau, SC · São Paulo, SP"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="foto">
            Foto de perfil
            <span className="ml-1 font-normal text-muted-foreground">(deixe em branco para manter a atual)</span>
          </Label>
          {fotoPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fotoPreview}
              alt="Foto de perfil"
              className="mb-2 h-16 w-16 rounded border border-border object-cover"
            />
          )}
          <input
            id="foto"
            name="foto"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setFotoPreview(URL.createObjectURL(file));
            }}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-secondary-foreground"
          />
        </div>
      </SectionCard>

      {/* ── Redes & Contato ─────────────────────────────────────── */}
      <SectionCard
        id="contato"
        icon={AtSign}
        titulo="Redes & contato"
        descricao="Links das redes e canais de contato oferecidos às marcas."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="instagram_url">Instagram (URL)</Label>
            <Input id="instagram_url" name="instagram_url" type="url" defaultValue={initialData.instagram_url ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tiktok_url">TikTok (URL)</Label>
            <Input id="tiktok_url" name="tiktok_url" type="url" defaultValue={initialData.tiktok_url ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="youtube_url">YouTube (URL)</Label>
            <Input id="youtube_url" name="youtube_url" type="url" defaultValue={initialData.youtube_url ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail comercial</Label>
            <Input id="email" name="email" type="email" defaultValue={initialData.email ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input id="whatsapp" name="whatsapp" defaultValue={initialData.whatsapp ?? ""} placeholder="+55 47 99999-9999" />
          </div>
        </div>
      </SectionCard>

      {/* ── Top Localidades ─────────────────────────────────────── */}
      <ListEditor
        id="localidades"
        icon={MapPin}
        titulo="Localidades do público"
        descricao="Principais estados ou cidades da audiência. Exibido em Público-alvo."
        itens={topEstados}
        onAdd={() => setTopEstados([...topEstados, { uf: "", pct: 0 }])}
        onRemove={(i) => setTopEstados(topEstados.filter((_, idx) => idx !== i))}
        render={(estado, i) => (
          <div className="grid grid-cols-[1fr_7rem] gap-3">
            <div className="space-y-1">
              <Input
                placeholder="São Paulo"
                value={estado.uf}
                onChange={(e) => {
                  const next = [...topEstados];
                  next[i] = { ...next[i], uf: e.target.value };
                  setTopEstados(next);
                }}
              />
            </div>
            <Input
              type="number"
              min="0"
              max="100"
              placeholder="%"
              value={estado.pct}
              onChange={(e) => {
                const next = [...topEstados];
                next[i] = { ...next[i], pct: Number(e.target.value) };
                setTopEstados(next);
              }}
            />
          </div>
        )}
      />

      {/* ── Audiência: Gênero ───────────────────────────────────── */}
      <ListEditor
        id="genero"
        icon={Users}
        titulo="Público por gênero"
        descricao="Divisão da audiência por gênero."
        soma={somaGenero}
        itens={audienciaGenero}
        onAdd={() => setAudienciaGenero([...audienciaGenero, { label: "", pct: 0 }])}
        onRemove={(i) => setAudienciaGenero(audienciaGenero.filter((_, idx) => idx !== i))}
        render={(item, i) => (
          <div className="grid grid-cols-[1fr_7rem] gap-3">
            <Input
              placeholder="Feminino"
              value={item.label}
              onChange={(e) => {
                const next = [...audienciaGenero];
                next[i] = { ...next[i], label: e.target.value };
                setAudienciaGenero(next);
              }}
            />
            <Input
              type="number"
              min="0"
              max="100"
              placeholder="%"
              value={item.pct}
              onChange={(e) => {
                const next = [...audienciaGenero];
                next[i] = { ...next[i], pct: Number(e.target.value) };
                setAudienciaGenero(next);
              }}
            />
          </div>
        )}
      />

      {/* ── Audiência: Faixa Etária ─────────────────────────────── */}
      <ListEditor
        id="idade"
        icon={CalendarRange}
        titulo="Público por idade"
        descricao="Divisão da audiência por faixa etária."
        soma={somaIdade}
        itens={audienciaIdade}
        onAdd={() => setAudienciaIdade([...audienciaIdade, { faixa: "", pct: 0 }])}
        onRemove={(i) => setAudienciaIdade(audienciaIdade.filter((_, idx) => idx !== i))}
        render={(item, i) => (
          <div className="grid grid-cols-[1fr_7rem] gap-3">
            <Input
              placeholder="18-24 anos"
              value={item.faixa}
              onChange={(e) => {
                const next = [...audienciaIdade];
                next[i] = { ...next[i], faixa: e.target.value };
                setAudienciaIdade(next);
              }}
            />
            <Input
              type="number"
              min="0"
              max="100"
              placeholder="%"
              value={item.pct}
              onChange={(e) => {
                const next = [...audienciaIdade];
                next[i] = { ...next[i], pct: Number(e.target.value) };
                setAudienciaIdade(next);
              }}
            />
          </div>
        )}
      />

      {/* ── Formatos ────────────────────────────────────────────── */}
      <ListEditor
        id="formatos"
        icon={LayoutGrid}
        titulo="Formatos & entregas"
        descricao="Tipos de entrega que você oferece (Reels, Stories, combos)."
        itens={formatos}
        onAdd={() => setFormatos([...formatos, { nome: "", descricao: "" }])}
        onRemove={(i) => setFormatos(formatos.filter((_, idx) => idx !== i))}
        render={(formato, i) => (
          <div className="space-y-2">
            <Input
              placeholder="Nome (ex: Reels)"
              value={formato.nome}
              onChange={(e) => {
                const next = [...formatos];
                next[i] = { ...next[i], nome: e.target.value };
                setFormatos(next);
              }}
            />
            <Input
              placeholder="Descrição"
              value={formato.descricao}
              onChange={(e) => {
                const next = [...formatos];
                next[i] = { ...next[i], descricao: e.target.value };
                setFormatos(next);
              }}
            />
          </div>
        )}
      />

      {/* ── Cases ───────────────────────────────────────────────── */}
      <ListEditor
        id="cases"
        icon={Trophy}
        titulo="Cases"
        descricao="Parcerias e resultados exibidos como prova social."
        itens={cases}
        onAdd={() => setCases([...cases, { marca: "", resultado: "", periodo: "" }])}
        onRemove={(i) => setCases(cases.filter((_, idx) => idx !== i))}
        render={(caso, i) => (
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Input
                placeholder="Marca"
                value={caso.marca}
                onChange={(e) => {
                  const next = [...cases];
                  next[i] = { ...next[i], marca: e.target.value };
                  setCases(next);
                }}
              />
              <Input
                placeholder="Período (ex: Jan 2024)"
                value={caso.periodo}
                onChange={(e) => {
                  const next = [...cases];
                  next[i] = { ...next[i], periodo: e.target.value };
                  setCases(next);
                }}
              />
            </div>
            <Input
              placeholder="Resultado"
              value={caso.resultado}
              onChange={(e) => {
                const next = [...cases];
                next[i] = { ...next[i], resultado: e.target.value };
                setCases(next);
              }}
            />
          </div>
        )}
      />

      {/* ── Moodboard (3 imagens fixas) ─────────────────────────── */}
      <SectionCard
        id="moodboard"
        icon={ImageIcon}
        titulo="Moodboard"
        descricao="Galeria editorial de 3 fotos. Só aparece com as 3 preenchidas."
      >
        <InlineNote tone="warning">
          A galeria do mídia kit só aparece quando as 3 imagens estiverem preenchidas.
        </InlineNote>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Imagem {i + 1} de 3</p>
              <input type="hidden" name={`moodboard_url_atual_${i}`} value={moodboardInicial[i] ?? ""} />
              {moodboardPreviews[i] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={moodboardPreviews[i]!}
                  alt={`Moodboard ${i + 1}`}
                  className="h-28 w-full rounded border border-border object-cover"
                />
              )}
              <input
                name={`moodboard_${i}`}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const next = [...moodboardPreviews];
                    next[i] = URL.createObjectURL(file);
                    setMoodboardPreviews(next);
                  }
                }}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-secondary-foreground"
              />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Reels em destaque (até 3) ───────────────────────────── */}
      <SectionCard
        id="reels"
        icon={Film}
        titulo="Reels em destaque"
        descricao="Cole o link do reel. Capa e métricas vêm do sync do Instagram."
      >
        <InlineNote tone="muted">
          Cole só o link do reel. A capa e as métricas (visualizações, curtidas e comentários)
          são puxadas do Instagram na sincronização, e a capa fica salva de forma permanente. O
          envio de imagem é opcional (sobrepõe a capa automática). O reel só aparece no mídia kit
          depois da 1ª sincronização, quando a capa é baixada — e trocar o link descarta a capa
          antiga, então sincronize logo depois de salvar.
        </InlineNote>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => {
            const atual = reelsInicial[i];
            return (
              <div key={i} className="space-y-2 rounded-lg border border-border p-3">
                <p className="text-xs font-medium text-muted-foreground">Reel {i + 1} de 3</p>
                <input type="hidden" name={`reel_url_atual_${i}`} value={reelThumbs[i]} />
                <input type="hidden" name={`reel_meta_${i}`} value={JSON.stringify(atual ?? null)} />
                {reelPreviews[i] && (
                  <div className="space-y-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={reelPreviews[i]!}
                      alt={`Reel ${i + 1}`}
                      className="aspect-[9/16] w-full rounded border border-border object-cover"
                    />
                    {reelThumbs[i] && (
                      <button
                        type="button"
                        onClick={() => usarCapaAutomatica(i)}
                        className="text-[0.7rem] text-muted-foreground underline underline-offset-2 hover:text-foreground"
                      >
                        Remover imagem · salvar e usar capa automática do sync
                      </button>
                    )}
                  </div>
                )}
                <input
                  ref={(el) => {
                    reelFileRefs.current[i] = el;
                  }}
                  name={`reel_${i}`}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const next = [...reelPreviews];
                      next[i] = URL.createObjectURL(file);
                      setReelPreviews(next);
                    }
                  }}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-secondary-foreground"
                />
                <Input
                  name={`reel_permalink_${i}`}
                  type="url"
                  placeholder="Link do reel (instagram.com/reel/…)"
                  value={reelPermalinks[i]}
                  onChange={(e) => {
                    const next = [...reelPermalinks];
                    next[i] = e.target.value;
                    setReelPermalinks(next);
                  }}
                />
                {atual && (atual.views > 0 || atual.likes > 0 || atual.comments > 0) && (
                  <p className="text-[0.7rem] text-muted-foreground">
                    Atual: {atual.views.toLocaleString("pt-BR")} views ·{" "}
                    {atual.likes.toLocaleString("pt-BR")} curtidas ·{" "}
                    {atual.comments.toLocaleString("pt-BR")} comentários
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* ── Barra de salvar sticky ───────────────────────────────── */}
      <div className="sticky bottom-0 z-20 -mx-1 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/95 px-3 py-3 shadow-card backdrop-blur-sm">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando…" : "Salvar alterações"}
        </Button>
        <Button type="button" variant="secondary" onClick={abrirPreview}>
          <Eye className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
          Pré-visualizar
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm font-medium text-success">Perfil salvo com sucesso!</p>}
      </div>

      {/* ── Modal de pré-visualização ────────────────────────────── */}
      {previewData && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background" role="dialog" aria-modal aria-label="Pré-visualização do mídia kit">
          {/* Barra flutuante */}
          <div className="pointer-events-none fixed inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-3">
            <span className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" />
              Pré-visualização · não salvo
            </span>
            <button
              onClick={() => setPreviewData(null)}
              className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm transition hover:bg-muted"
            >
              <X className="h-3 w-3" strokeWidth={2} aria-hidden />
              Fechar
            </button>
          </div>
          <MediaKitPresentation influencer={previewData} metricas={metricas} />
        </div>
      )}
    </form>
  );
}

// ── Card de seção: ícone + título + descrição de contexto + âncora ──
// Unifica o visual de todas as seções e dá a cada uma um `id` para a navegação
// sticky pular até ela. `scroll-mt` compensa a barra de navegação fixa no topo.
function SectionCard({
  id,
  icon: Icon,
  titulo,
  descricao,
  acao,
  children,
}: {
  id: string;
  icon: LucideIcon;
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-5 rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <h3 className="text-base font-semibold text-foreground">{titulo}</h3>
            {descricao && <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{descricao}</p>}
          </div>
        </div>
        {acao && <div className="shrink-0">{acao}</div>}
      </div>
      {children}
    </section>
  );
}

// Nota contextual dentro de uma seção (aviso ou dica neutra).
function InlineNote({ tone, children }: { tone: "warning" | "muted"; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-md px-3 py-2.5 text-xs leading-relaxed",
        tone === "warning" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </div>
  );
}

// Badge da soma dos percentuais: verde quando fecha em 100%, âmbar quando não.
function PctBadge({ soma }: { soma: number }) {
  const ok = soma === 100;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        ok ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
      )}
      title={ok ? "A divisão fecha em 100%." : "A divisão ainda não fecha em 100%."}
    >
      Soma {soma}%
    </span>
  );
}

// ── Editor genérico de lista ──────────────────────────────────────
function ListEditor<T>({
  id,
  icon,
  titulo,
  descricao,
  soma,
  itens,
  onAdd,
  onRemove,
  render,
}: {
  id: string;
  icon: LucideIcon;
  titulo: string;
  descricao?: string;
  soma?: number;
  itens: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  render: (item: T, index: number) => React.ReactNode;
}) {
  return (
    <SectionCard
      id={id}
      icon={icon}
      titulo={titulo}
      descricao={descricao}
      acao={
        <div className="flex items-center gap-2">
          {soma != null && itens.length > 0 && <PctBadge soma={soma} />}
          <Button type="button" variant="ghost" size="sm" onClick={onAdd}>
            <Plus className="mr-1 h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Adicionar
          </Button>
        </div>
      }
    >
      {itens.length === 0 ? (
        <button
          type="button"
          onClick={onAdd}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-6 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
          Adicionar o primeiro item
        </button>
      ) : (
        <div className="space-y-3">
          {itens.map((item, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
              <div className="flex-1">{render(item, i)}</div>
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label="Remover item"
                className="shrink-0 rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" strokeWidth={2} aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
