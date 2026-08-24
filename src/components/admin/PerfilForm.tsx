"use client";

// Editor do mídia kit. Duas colunas: à esquerda a sanfona de seções, à direita a
// prévia ao vivo (site e deck em PDF) do que está sendo digitado — ver
// PreviewPanel. Uma seção aberta por vez, e abrir uma rola a prévia até o trecho
// correspondente, para nunca ser preciso adivinhar onde aquele campo aparece.
//
// O formulário é híbrido de propósito: campos simples ficam uncontrolled
// (defaultValue + name, lidos pelo FormData no submit) e as listas moram em
// estado React, serializadas em <input type="hidden">. Para a prévia ao vivo um
// único onInput no <form> relê os campos simples — assim nenhum input precisou
// virar controlado.

import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  User, AtSign, MapPin, Users, CalendarRange, LayoutGrid, Trophy,
  Image as ImageIcon, Film, Plus, X, ChevronDown, Check, AlertCircle, Eye,
  type LucideIcon,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Textarea from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";
import { comprimirImagensDoForm } from "@/lib/imagem-client";
import { salvarPerfil } from "@/app/admin/(protected)/perfil/actions";
import { PROFILE_ID, POS_PADRAO, ZOOM_PADRAO, normalizarMoodboard, toPresentation } from "@/lib/influencer-profile";
import MoodboardMosaico, { type FotoMoodboard } from "@/components/admin/MoodboardMosaico";
import PreviewPanel from "@/components/admin/PreviewPanel";
import type {
  AudienciaGenero,
  AudienciaIdade,
  Case,
  Formato,
  InfluencerMetrics,
  InfluencerProfile,
  TopEstado,
} from "@/types/database";

// Campos simples do formulário. A lista existe para reler tudo de uma vez no
// onInput sem enumerar input por input.
const CAMPOS_TEXTO = [
  "nome", "nicho", "biografia", "publico_alvo", "localizacao",
  "instagram_url", "tiktok_url", "youtube_url", "email", "whatsapp",
] as const;
type CampoTexto = (typeof CAMPOS_TEXTO)[number];
type Campos = Record<CampoTexto, string>;

// O textarea da biografia sai do DOM com \n, mas no banco ela está com o \r\n
// que o submit anterior gravou. Sem alinhar os dois, a assinatura do formulário
// nunca voltaria a bater com a salva e o aviso de pendência ficava preso.
const semCR = (c: Campos): Campos =>
  Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v.replace(/\r\n/g, "\n")])) as Campos;

function camposIniciais(p: InfluencerProfile): Campos {
  return semCR({
    nome: p.nome,
    nicho: p.nicho,
    biografia: p.biografia,
    publico_alvo: p.publico_alvo,
    localizacao: p.localizacao ?? "",
    instagram_url: p.instagram_url ?? "",
    tiktok_url: p.tiktok_url ?? "",
    youtube_url: p.youtube_url ?? "",
    email: p.email ?? "",
    whatsapp: p.whatsapp ?? "",
  });
}

function camposDoForm(form: HTMLFormElement): Campos {
  const fd = new FormData(form);
  return Object.fromEntries(
    CAMPOS_TEXTO.map((campo) => [campo, String(fd.get(campo) ?? "")]),
  ) as Campos;
}

type Props = {
  initialData: InfluencerProfile;
  metricas: InfluencerMetrics[];
  /** Cards de conexão do Instagram e do TikTok, renderizados no topo do editor. */
  conexoes?: React.ReactNode;
};

export default function PerfilForm({ initialData, metricas, conexoes }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [campos, setCampos] = useState<Campos>(() => camposIniciais(initialData));
  const [secaoAberta, setSecaoAberta] = useState("identidade");
  const [previewMobile, setPreviewMobile] = useState(false);

  const [topEstados, setTopEstados] = useState<TopEstado[]>(initialData.top_estados ?? []);
  const [audienciaGenero, setAudienciaGenero] = useState<AudienciaGenero[]>(
    initialData.audiencia_genero ?? [],
  );
  const [audienciaIdade, setAudienciaIdade] = useState<AudienciaIdade[]>(
    initialData.audiencia_idade ?? [],
  );
  const [formatos, setFormatos] = useState<Formato[]>(initialData.formatos ?? []);
  const [cases, setCases] = useState<Case[]>(initialData.cases ?? []);

  // 3 slots fixos: normaliza o formato antigo (string crua) e completa o que
  // faltar, para o mosaico ter sempre as 3 células.
  const moodboardInicial = normalizarMoodboard(initialData.moodboard);
  const [fotoPreview, setFotoPreview] = useState<string | null>(initialData.foto_url ?? null);
  const [moodboardFotos, setMoodboardFotos] = useState<FotoMoodboard[]>(() =>
    [0, 1, 2].map((i) => moodboardInicial[i] ?? { url: "", pos: POS_PADRAO, zoom: ZOOM_PADRAO }),
  );

  // Reels em destaque: 3 slots. Print + link editáveis; métricas vêm do sync.
  const reelsInicial = useMemo(() => initialData.reels ?? [], [initialData.reels]);
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

  // Assinatura de tudo que é editável. A pendência sai da comparação com a
  // última versão salva, e não de "houve digitação": assim desfazer a edição na
  // mão volta pra "Tudo salvo" em vez de deixar o aviso preso — e o botão de
  // exportar PDF destravado. Os arquivos ainda não enviados entram pelos
  // previews (`blob:`), que mudam junto.
  const assinatura = useMemo(
    () =>
      JSON.stringify([
        campos, fotoPreview, topEstados, audienciaGenero, audienciaIdade,
        formatos, cases, moodboardFotos, reelPreviews, reelPermalinks, reelThumbs,
      ]),
    [
      campos, fotoPreview, topEstados, audienciaGenero, audienciaIdade,
      formatos, cases, moodboardFotos, reelPreviews, reelPermalinks, reelThumbs,
    ],
  );
  const [assinaturaSalva, setAssinaturaSalva] = useState(assinatura);
  const pendente = assinatura !== assinaturaSalva;

  // Soma dos percentuais — gênero e idade devem fechar em 100%. Mostrada ao vivo
  // como aviso para quem edita não deixar a divisão inconsistente.
  const somaGenero = audienciaGenero.reduce((s, g) => s + (Number(g.pct) || 0), 0);
  const somaIdade = audienciaIdade.reduce((s, f) => s + (Number(f.pct) || 0), 0);

  // O perfil como ele ficaria se fosse salvo agora. É isto que alimenta a prévia,
  // com as fotos ainda não enviadas entrando como blob: local.
  const influencerPreview = useMemo(
    () =>
      toPresentation({
        ...initialData,
        id: PROFILE_ID,
        nome: campos.nome,
        nicho: campos.nicho,
        biografia: campos.biografia,
        publico_alvo: campos.publico_alvo,
        localizacao: campos.localizacao,
        instagram_url: campos.instagram_url || null,
        tiktok_url: campos.tiktok_url || null,
        youtube_url: campos.youtube_url || null,
        email: campos.email || null,
        whatsapp: campos.whatsapp || null,
        foto_url: fotoPreview,
        top_estados: topEstados,
        audiencia_genero: audienciaGenero,
        audiencia_idade: audienciaIdade,
        formatos,
        cases,
        moodboard: moodboardFotos.filter((f) => f.url),
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
      }),
    [
      initialData, campos, fotoPreview, topEstados, audienciaGenero, audienciaIdade,
      formatos, cases, moodboardFotos, reelPreviews, reelPermalinks, reelsInicial,
    ],
  );

  // Fechar a aba com edição pendente perde tudo: o navegador confirma antes.
  useEffect(() => {
    if (!pendente) return;
    function avisar(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [pendente]);

  // Prévia em tela cheia no celular, onde não cabe a segunda coluna.
  useEffect(() => {
    if (!previewMobile) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") setPreviewMobile(false);
    }
    window.addEventListener("keydown", aoTeclar);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener("keydown", aoTeclar);
    };
  }, [previewMobile]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    if (!String(formData.get("nome") ?? "").trim()) {
      setError("Informe o nome.");
      setSecaoAberta("identidade");
      return;
    }

    setLoading(true);
    try {
      // Reduz as imagens antes de enviar — foto de celular vem com 10–15 MB.
      await comprimirImagensDoForm(formData);
      const result = await salvarPerfil(formData);
      if (result?.ok) {
        setAssinaturaSalva(assinatura);
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

  const painel = (
    <PreviewPanel
      influencer={influencerPreview}
      metricas={metricas}
      secaoAtiva={secaoAberta}
      pendente={pendente}
    />
  );

  const fotosMoodboard = moodboardFotos.filter((f) => f.url).length;
  const reelsPreenchidos = [0, 1, 2].filter((i) => reelPreviews[i] || reelPermalinks[i]).length;
  const redesPreenchidas = [
    campos.instagram_url, campos.tiktok_url, campos.youtube_url, campos.email, campos.whatsapp,
  ].filter(Boolean).length;

  // Um onInput no formulário inteiro dá conta da prévia: `input` borbulha de
  // todos os campos, inclusive dos controlados das listas e dos inputs de
  // arquivo.
  //
  // Grade: a partir de xl a coluna de campos para de crescer e a sobra de tela
  // vira prévia maior, que é quem ganha com espaço (campo de texto com 900px de
  // largura não ajuda ninguém).
  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onInput={(e) => setCampos(camposDoForm(e.currentTarget))}
      noValidate
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.85fr)] lg:items-start xl:grid-cols-[minmax(0,620px)_minmax(0,1fr)]"
    >
      {/* ── Coluna do editor ─────────────────────────────────────── */}
      <div className="min-w-0 space-y-4">
        {/* Barra de ações: estado do rascunho sempre visível */}
        <div className="sticky top-0 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/95 px-3 py-3 shadow-card backdrop-blur-sm">
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando…" : "Salvar alterações"}
          </Button>

          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium",
              pendente ? "text-warning" : "text-success",
            )}
          >
            {pendente ? (
              <AlertCircle className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            ) : (
              <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            )}
            {pendente ? "Alterações não salvas" : "Tudo salvo"}
          </span>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="ml-auto lg:hidden"
            onClick={() => setPreviewMobile(true)}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            Ver prévia
          </Button>

          {error && <p className="w-full text-sm text-destructive">{error}</p>}
        </div>

        {conexoes}

        {/* Listas serializadas */}
        <input type="hidden" name="top_estados" value={JSON.stringify(topEstados)} />
        <input type="hidden" name="audiencia_genero" value={JSON.stringify(audienciaGenero)} />
        <input type="hidden" name="audiencia_idade" value={JSON.stringify(audienciaIdade)} />
        <input type="hidden" name="formatos" value={JSON.stringify(formatos)} />
        <input type="hidden" name="cases" value={JSON.stringify(cases)} />
        <input type="hidden" name="foto_url_atual" value={initialData.foto_url ?? ""} />

        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-card">
          {/* ── Identidade ──────────────────────────────────────── */}
          <Secao
            id="identidade"
            icon={User}
            titulo="Identidade"
            descricao="Nome, nicho, bio e foto que abrem o mídia kit."
            resumo={campos.nome || "sem nome"}
            onAbrir={setSecaoAberta}
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
          </Secao>

          {/* ── Redes & Contato ─────────────────────────────────── */}
          <Secao
            id="contato"
            icon={AtSign}
            titulo="Redes e contato"
            descricao="Links das redes e canais oferecidos às marcas."
            resumo={redesPreenchidas > 0 ? `${redesPreenchidas} de 5 preenchidos` : "nenhum preenchido"}
            onAbrir={setSecaoAberta}
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
          </Secao>

          {/* ── Top Localidades ─────────────────────────────────── */}
          <ListEditor
            id="localidades"
            icon={MapPin}
            titulo="Localidades do público"
            descricao="Principais estados ou cidades da audiência. Aparece em Público-alvo."
            onAbrir={setSecaoAberta}
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

          {/* ── Audiência: Gênero ───────────────────────────────── */}
          <ListEditor
            id="genero"
            icon={Users}
            titulo="Público por gênero"
            descricao="Divisão da audiência por gênero."
            soma={somaGenero}
            onAbrir={setSecaoAberta}
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

          {/* ── Audiência: Faixa Etária ─────────────────────────── */}
          <ListEditor
            id="idade"
            icon={CalendarRange}
            titulo="Público por idade"
            descricao="Divisão da audiência por faixa etária."
            soma={somaIdade}
            onAbrir={setSecaoAberta}
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

          {/* ── Formatos ────────────────────────────────────────── */}
          <ListEditor
            id="formatos"
            icon={LayoutGrid}
            titulo="Formatos e entregas"
            descricao="Tipos de entrega que você oferece (Reels, Stories, combos)."
            onAbrir={setSecaoAberta}
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

          {/* ── Cases ───────────────────────────────────────────── */}
          <ListEditor
            id="cases"
            icon={Trophy}
            titulo="Cases"
            descricao="Parcerias e resultados exibidos como prova social."
            onAbrir={setSecaoAberta}
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

          {/* ── Moodboard (3 imagens fixas) ─────────────────────── */}
          <Secao
            id="moodboard"
            icon={ImageIcon}
            titulo="Moodboard"
            descricao="Galeria editorial de 3 fotos. Só aparece com as 3 preenchidas."
            resumo={`${fotosMoodboard} de 3 fotos`}
            alerta={fotosMoodboard < 3}
            onAbrir={setSecaoAberta}
          >
            <InlineNote tone="warning">
              A galeria do mídia kit só aparece quando as 3 imagens estiverem preenchidas. Este é o
              mesmo mosaico do mídia kit e do PDF: arraste cada foto para escolher o enquadramento.
            </InlineNote>

            <MoodboardMosaico
              fotos={moodboardFotos}
              urlsSalvas={[0, 1, 2].map((i) => moodboardInicial[i]?.url ?? "")}
              onChange={setMoodboardFotos}
            />
          </Secao>

          {/* ── Reels em destaque (até 3) ───────────────────────── */}
          <Secao
            id="reels"
            icon={Film}
            titulo="Reels em destaque"
            descricao="Cole o link do reel. Capa e métricas vêm do sync do Instagram."
            resumo={`${reelsPreenchidos} de 3 cadastrados`}
            onAbrir={setSecaoAberta}
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
          </Secao>
        </div>
      </div>

      {/* ── Coluna da prévia (acompanha a rolagem) ───────────────── */}
      <aside className="hidden lg:sticky lg:top-4 lg:block lg:h-[calc(100dvh-7rem)]">
        {painel}
      </aside>

      {/* ── Prévia em tela cheia no celular ──────────────────────── */}
      {previewMobile && (
        <div
          className="fixed inset-0 z-50 flex flex-col gap-2 bg-background p-3 lg:hidden"
          role="dialog"
          aria-modal
          aria-label="Prévia do mídia kit"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Prévia</p>
            <button
              type="button"
              onClick={() => setPreviewMobile(false)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Fechar
            </button>
          </div>
          <div className="min-h-0 flex-1">{painel}</div>
        </div>
      )}
    </form>
  );
}

// ── Seção da sanfona ──────────────────────────────────────────────
// <details name> dá sanfona exclusiva nativa (abrir uma fecha as outras), com
// teclado e acessibilidade de graça. O conteúdo fechado continua no DOM, então
// os campos e os hidden inputs seguem sendo enviados no submit.
function Secao({
  id,
  icon: Icon,
  titulo,
  descricao,
  resumo,
  alerta,
  acao,
  onAbrir,
  children,
}: {
  id: string;
  icon: LucideIcon;
  titulo: string;
  descricao?: string;
  resumo?: string;
  alerta?: boolean;
  acao?: React.ReactNode;
  onAbrir: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <details
      name="perfil-secao"
      open={id === "identidade"}
      onToggle={(e) => {
        if (e.currentTarget.open) onAbrir(id);
      }}
      className="group"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/60 [&::-webkit-details-marker]:hidden">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">{titulo}</span>
          {resumo && (
            <span
              className={cn(
                "block truncate text-xs group-open:hidden",
                alerta ? "text-warning" : "text-muted-foreground",
              )}
            >
              {resumo}
            </span>
          )}
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          strokeWidth={2}
          aria-hidden
        />
      </summary>

      <div className="space-y-5 border-t border-border px-5 pb-6 pt-5">
        {(descricao || acao) && (
          <div className="flex items-start justify-between gap-4">
            {descricao && <p className="text-xs leading-relaxed text-muted-foreground">{descricao}</p>}
            {acao && <div className="shrink-0">{acao}</div>}
          </div>
        )}
        {children}
      </div>
    </details>
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
  onAbrir,
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
  onAbrir: (id: string) => void;
  render: (item: T, index: number) => React.ReactNode;
}) {
  const plural = itens.length === 1 ? "item" : "itens";
  const resumo =
    itens.length === 0
      ? "nenhum item"
      : soma != null
        ? `${itens.length} ${plural} · soma ${soma}%`
        : `${itens.length} ${plural}`;

  return (
    <Secao
      id={id}
      icon={icon}
      titulo={titulo}
      descricao={descricao}
      resumo={resumo}
      alerta={soma != null && itens.length > 0 && soma !== 100}
      onAbrir={onAbrir}
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
    </Secao>
  );
}
