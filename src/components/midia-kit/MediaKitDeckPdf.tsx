// ─────────────────────────────────────────────────────────────────────────────
// Mídia kit em formato DECK 16:9 — a versão desenhada para virar PDF.
//
// Não é o site repaginado: é um documento. A diferença estrutural é que aqui o
// conteúdo não corre — cada seção devolve uma lista de PÁGINAS de tamanho fixo
// (1280×720px), compostas de propósito, com capa, rodapé, numeração e página de
// encerramento. Listas longas (reels, formatos, cases, moodboard) são fatiadas
// em páginas por `chunk()` em vez de deixar o navegador quebrar onde der.
//
// Por que 1280×720px: o Chrome mapeia 1px = 1/96in, então page.pdf() com essa
// medida gera páginas de 13,333 × 7,5in (960 × 540pt) — o widescreen 16:9 padrão
// de apresentação. Projetar em px nesse tamanho mantém a escala do Tailwind
// (text-base = 16px) legível, sem conversão para mm.
//
// Identidade e dados são os MESMOS de MediaKitPresentationEditorial: Lora italic,
// coral #FF9A86, creme #F7F2EC, slate, alimentados por toPresentation().
//
// A altura das páginas é FIXA (não min-height) para que uma nunca empurre a
// seguinte. O preço é que conteúdo comprido demais seria cortado em silêncio —
// por isso <DeckOverflowCheck> acusa isso na pré-visualização.
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
import { MapPin, Mail } from "lucide-react";
import WhatsappIcon from "@/components/icons/WhatsappIcon";
import {
  TIKTOK_JANELA_DIAS, chunk, fmtCompact, fmtWhatsapp, splitNicho,
  BigNumber, InstagramIcon, TikTokIcon,
} from "@/lib/midia-kit-format";
import type {
  TopEstado, Formato, Case, AudienciaGenero, AudienciaIdade, Reel,
} from "@/types/database";

export const PAGE_W = 1280;
export const PAGE_H = 720;

// Props idênticas às de MediaKitPresentationEditorial — mesma saída de toPresentation().
type InfluencerPresentation = {
  nome: string;
  foto: string;
  biografia: string;
  nicho: string;
  publicoAlvo: string;
  localizacao: string;
  topEstados: TopEstado[];
  audienciaGenero: AudienciaGenero[];
  audienciaIdade: AudienciaIdade[];
  redes: { instagram: string; tiktok: string; youtube: string };
  handles: { instagram: string; tiktok: string };
  formatos: Formato[];
  cases: Case[];
  moodboard: string[];
  reels?: Reel[];
  contato: { email: string; whatsapp: string };
};

type Metrics = {
  reference_month: string;
  instagram_followers?: number;
  instagram_reach?: number;
  instagram_impressions?: number;
  instagram_engagement?: number;
  instagram_interactions?: number;
  instagram_shares?: number;
  instagram_saves?: number;
  tiktok_followers?: number;
  tiktok_views?: number;
  tiktok_likes?: number;
  tiktok_engagement?: number;
  tiktok_interactions?: number;
  tiktok_shares?: number;
  tiktok_saves?: number;
}[];

// Uma página do deck. `sangria` = sem rodapé e sem recuo (capa, lookbook, contato).
type Pagina = { key: string; conteudo: React.ReactNode; sangria?: boolean };

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function rotuloMes(ref?: string) {
  if (!ref) return "";
  const [ano, mes] = ref.split("-");
  const nome = MESES[Number(mes) - 1];
  return nome ? `${nome} de ${ano}` : "";
}

// Nome do arquivo baixado. Fica aqui (e vai para o DOM em data-arquivo) porque é
// aqui que já se sabe o nome e o mês de referência — evita a rota de geração ter
// que repetir as consultas ao Supabase só para montar um nome de arquivo.
function nomeDoArquivo(nome: string, ref?: string) {
  const slug = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const mes = ref?.slice(0, 7) || new Date().toISOString().slice(0, 7);
  return `midia-kit-${slug || "perfil"}-${mes}.pdf`;
}

// <img> em vez de next/image de propósito: em página de tamanho fixo o `fill` não
// ajuda em nada e a otimização on-the-fly gastaria cota a cada exportação.
// O eslint-disable fica aqui, uma vez, em vez de repetido em cada foto.
function Foto({ src, alt, className, style }: {
  src: string; alt: string; className?: string; style?: React.CSSProperties;
}) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} style={style} />;
}

function SectionMark({ index, title, nota }: { index: string; title: React.ReactNode; nota?: string }) {
  return (
    <div className="mb-9">
      <div className="flex items-baseline gap-4">
        <span className="font-display text-base italic text-[#FF9A86]">{index}</span>
        <h2 className="font-display text-[38px] font-light italic leading-none text-slate-800">{title}</h2>
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      {nota && <p className="mt-3 pl-10 text-[11px] uppercase tracking-[0.18em] text-slate-400">{nota}</p>}
    </div>
  );
}

function DistRow({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm text-slate-600">{label}</span>
        <span className="font-display text-lg italic text-slate-800">{pct}%</span>
      </div>
      <div className="h-px w-full bg-slate-200">
        <div className="h-px" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// Bloco "plataforma": cabeçalho, número grande de seguidores e dois indicadores.
function PlataformaBloco({ icone, nome, handle, total, rotulo, indicadores }: {
  icone: React.ReactNode;
  nome: string;
  handle?: string;
  total: number;
  rotulo: string;
  indicadores: { label: string; n: number; accent?: boolean }[];
}) {
  return (
    <div>
      <div className="mb-7 flex items-center gap-3">
        {icone}
        <span className="text-sm uppercase tracking-[0.2em] text-slate-400">{nome}</span>
        {handle && <span className="text-sm text-slate-500">{handle}</span>}
      </div>
      <p className="font-display text-[86px] font-light italic leading-none text-slate-800">
        <BigNumber n={total} suffixClassName="not-italic font-sans text-4xl text-slate-400" />
      </p>
      <p className="mt-3 text-sm text-slate-400">{rotulo}</p>
      <div className="mt-8 grid grid-cols-2 gap-8 border-t border-slate-200 pt-6">
        {indicadores.map((ind) => (
          <div key={ind.label}>
            <p className="mb-1.5 text-xs text-slate-400">{ind.label}</p>
            <p className={`font-display text-3xl font-light italic ${ind.accent ? "text-[#FF9A86]" : "text-slate-700"}`}>
              {fmtCompact(ind.n).value}
              <span className={ind.accent ? "text-lg" : "text-lg text-slate-400"}>{fmtCompact(ind.n).suffix}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function MediaKitDeckPdf({
  influencer,
  metricas,
}: {
  influencer: InfluencerPresentation;
  metricas: Metrics;
}) {
  const m = metricas.length > 0 ? metricas[metricas.length - 1] : null;
  const mesRef = rotuloMes(m?.reference_month);

  const igFollowers = m?.instagram_followers ?? 0;
  const tkFollowers = m?.tiktok_followers ?? 0;
  const alcanceCombinado = (m?.instagram_reach ?? 0) + (m?.tiktok_views ?? 0);

  const nichoTags = splitNicho(influencer.nicho);
  const bioParagrafos = influencer.biografia.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  const primeiroNome = influencer.nome.split(" ")[0] || influencer.nome;
  const sobrenome = influencer.nome.split(" ").slice(1).join(" ");

  const heroStats = [
    igFollowers > 0 && { n: igFollowers, label: "Instagram", accent: false },
    tkFollowers > 0 && { n: tkFollowers, label: "TikTok", accent: false },
    alcanceCombinado > 0 && { n: alcanceCombinado, label: "Alcance combinado", accent: true },
  ].filter(Boolean) as { n: number; label: string; accent: boolean }[];

  const igPerf = [
    { label: "Interações", n: m?.instagram_interactions ?? 0 },
    { label: "Compartilhamentos", n: m?.instagram_shares ?? 0 },
    { label: "Salvamentos", n: m?.instagram_saves ?? 0 },
  ].filter((s) => s.n > 0);
  const tkPerf = [
    { label: "Interações", n: m?.tiktok_interactions ?? 0 },
    { label: "Compartilhamentos", n: m?.tiktok_shares ?? 0 },
    { label: "Salvamentos", n: m?.tiktok_saves ?? 0 },
  ].filter((s) => s.n > 0);

  const igEng = m?.instagram_engagement ?? 0;
  const tkEng = m?.tiktok_engagement ?? 0;
  const showIgPerf = igEng > 0 || igPerf.length > 0;
  const showTkPerf = tkEng > 0 || tkPerf.length > 0;

  const showDemografia =
    influencer.audienciaGenero.length > 0 ||
    influencer.audienciaIdade.length > 0 ||
    influencer.topEstados.length > 0;

  const idadeColors = ["#FF9A86", "#FFB399", "#FFD6A6"];

  // Numeração das seções (01, 02…): só avança quando a seção existe, então
  // esconder uma seção vazia não deixa buraco na sequência.
  let sec = 0;
  const nextIndex = () => String(++sec).padStart(2, "0");

  const paginas: Pagina[] = [];

  // ── CAPA ────────────────────────────────────────────────────────────────────
  // ponytail: tamanho do nome por contagem de caracteres em vez de auto-fit por
  // medição. Cobre de "Ana" a "Maria Fernanda"; nome muito mais longo que isso, o
  // DeckOverflowCheck acusa e aí se resolve com uma faixa a mais.
  const maiorPalavra = Math.max(primeiroNome.length, sobrenome.length || 0);
  const tamanhoNome = maiorPalavra > 11 ? 68 : maiorPalavra > 8 ? 84 : 100;

  paginas.push({
    key: "capa",
    sangria: true,
    conteudo: (
      <div className="grid h-full" style={{ gridTemplateColumns: "1.05fr 0.95fr" }}>
        <div className="flex flex-col justify-between bg-[#F7F2EC] px-20 py-16">
          <p className="text-[11px] uppercase tracking-[0.34em] text-slate-400">
            Mídia kit{mesRef && ` · ${mesRef}`}
          </p>

          <div>
            <h1
              className="font-display font-light italic text-slate-800"
              style={{ fontSize: tamanhoNome, lineHeight: 0.92 }}
            >
              {primeiroNome}
              {sobrenome && (
                <>
                  <br />
                  <span className="text-[#FF9A86]">{sobrenome}</span>
                </>
              )}
            </h1>

            {(nichoTags.length > 0 || influencer.localizacao) && (
              <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-light text-slate-500">
                {nichoTags.map((tag, i) => (
                  <React.Fragment key={tag}>
                    {i > 0 && <span className="h-1 w-1 rounded-full bg-[#FF9A86]" />}
                    <span>{tag}</span>
                  </React.Fragment>
                ))}
                {influencer.localizacao && (
                  <span className="ml-1 flex items-center gap-1.5 text-slate-400">
                    <MapPin className="h-3.5 w-3.5" /> {influencer.localizacao}
                  </span>
                )}
              </div>
            )}

            {(influencer.handles.instagram || influencer.handles.tiktok) && (
              <div className="mt-6 flex items-center gap-6 text-sm text-slate-500">
                {influencer.handles.instagram && (
                  <a href={influencer.redes.instagram || undefined} className="flex items-center gap-2 no-underline text-slate-500">
                    <InstagramIcon className="h-4 w-4 text-[#FF9A86]" /> {influencer.handles.instagram}
                  </a>
                )}
                {influencer.handles.tiktok && (
                  <a href={influencer.redes.tiktok || undefined} className="flex items-center gap-2 no-underline text-slate-500">
                    <TikTokIcon className="h-4 w-4 text-slate-700" /> {influencer.handles.tiktok}
                  </a>
                )}
              </div>
            )}
          </div>

          {heroStats.length > 0 && (
            <div className="flex divide-x divide-slate-300/70 border-t border-slate-300/70 pt-7">
              {heroStats.map((s) => (
                <div key={s.label} className="flex-1 pl-6 first:pl-0">
                  <p className={`font-display text-[42px] font-light italic leading-none ${s.accent ? "text-[#FF9A86]" : "text-slate-800"}`}>
                    <BigNumber n={s.n} />
                  </p>
                  <p className="mt-2.5 text-[10px] uppercase tracking-[0.18em] text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative overflow-hidden bg-slate-100">
          {influencer.foto && (
            <>
              <Foto src={influencer.foto} alt={`Retrato de ${influencer.nome}`} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#F7F2EC]/55 via-transparent to-transparent" />
            </>
          )}
        </div>
      </div>
    ),
  });

  // ── QUEM SOU ────────────────────────────────────────────────────────────────
  if (bioParagrafos.length > 0) {
    const bioLonga = influencer.biografia.length > 900;
    paginas.push({
      key: "bio",
      // Só texto: a coluna de foto saiu (era o moodboard[0], que já aparece no
      // lookbook). Sem sangria, então a página usa o recuo padrão e ganha rodapé
      // numerado como as demais de conteúdo. `max-w` segura a medida do texto —
      // parágrafo em 1280px de largura vira linha ilegível.
      conteudo: (
        <div className="max-w-[760px]">
          <h2 className="font-display text-[46px] font-light italic leading-tight text-slate-800">
            Muito prazer,<br />sou a <span className="text-[#FF9A86]">{primeiroNome}.</span>
          </h2>
          <div className="my-7 h-px w-16 bg-[#FF9A86]" />
          <div className={`space-y-4 font-light leading-relaxed text-slate-500 ${bioLonga ? "text-[15px]" : "text-[17px]"}`}>
            {bioParagrafos.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      ),
    });
  }

  // ── 01 · PLATAFORMAS ────────────────────────────────────────────────────────
  if (igFollowers > 0 || tkFollowers > 0) {
    const index = nextIndex();
    paginas.push({
      key: "plataformas",
      conteudo: (
        <>
          <SectionMark
            index={index}
            title={<>As <span className="text-[#FF9A86]">plataformas</span></>}
            nota={mesRef ? `Dados de ${mesRef}` : undefined}
          />
          <div className="grid grid-cols-2 divide-x divide-slate-200">
            {igFollowers > 0 && (
              <div className="pr-16">
                <PlataformaBloco
                  icone={<InstagramIcon className="h-5 w-5 text-[#FF9A86]" />}
                  nome="Instagram"
                  handle={influencer.handles.instagram}
                  total={igFollowers}
                  rotulo="seguidores"
                  indicadores={[
                    { label: "Alcance (30d)", n: m?.instagram_reach ?? 0 },
                    { label: "Impressões", n: m?.instagram_impressions ?? 0, accent: true },
                  ]}
                />
              </div>
            )}
            {tkFollowers > 0 && (
              <div className={igFollowers > 0 ? "pl-16" : "pr-16"}>
                <PlataformaBloco
                  icone={<TikTokIcon className="h-5 w-5 text-slate-700" />}
                  nome="TikTok"
                  handle={influencer.handles.tiktok}
                  total={tkFollowers}
                  rotulo="seguidores"
                  indicadores={[
                    { label: `Visualizações (${TIKTOK_JANELA_DIAS}d)`, n: m?.tiktok_views ?? 0 },
                    { label: "Curtidas", n: m?.tiktok_likes ?? 0, accent: true },
                  ]}
                />
              </div>
            )}
          </div>
        </>
      ),
    });
  }

  // ── 02 · PERFORMANCE ────────────────────────────────────────────────────────
  if (showIgPerf || showTkPerf) {
    const index = nextIndex();
    const coluna = (
      eng: number,
      perf: { label: string; n: number }[],
      icone: React.ReactNode,
      nome: string,
    ) => (
      <>
        <div className="mb-7 flex items-center gap-3">
          {icone}
          <span className="text-sm uppercase tracking-[0.2em] text-slate-400">{nome}</span>
        </div>
        {eng > 0 && (
          <div className="flex items-end gap-4">
            <p className="font-display text-[92px] font-light italic leading-none text-slate-800">{eng.toFixed(1)}</p>
            <div className="mb-2">
              <p className="font-display text-4xl font-light italic leading-none text-slate-400">%</p>
              <p className="mt-2 text-xs text-slate-400">taxa de engajamento</p>
            </div>
          </div>
        )}
        {perf.length > 0 && (
          <div className="mt-9 grid grid-cols-3 gap-6 border-t border-slate-200 pt-6">
            {perf.map((s) => (
              <div key={s.label}>
                <p className="mb-1.5 text-xs text-slate-400">{s.label}</p>
                <p className="font-display text-2xl font-light italic text-slate-700">
                  {fmtCompact(s.n).value}
                  <span className="text-base text-slate-400">{fmtCompact(s.n).suffix}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </>
    );

    paginas.push({
      key: "performance",
      conteudo: (
        <>
          <SectionMark
            index={index}
            title={<>Performance <span className="text-[#FF9A86]">e engajamento</span></>}
            nota={mesRef ? `Dados de ${mesRef}` : undefined}
          />
          <div className="grid grid-cols-2 divide-x divide-slate-200">
            {showIgPerf && (
              <div className="pr-16">
                {coluna(igEng, igPerf, <InstagramIcon className="h-5 w-5 text-[#FF9A86]" />, "Instagram")}
              </div>
            )}
            {showTkPerf && (
              <div className={showIgPerf ? "pl-16" : "pr-16"}>
                {coluna(tkEng, tkPerf, <TikTokIcon className="h-5 w-5 text-slate-700" />, "TikTok")}
              </div>
            )}
          </div>
        </>
      ),
    });
  }

  // ── 03 · REELS EM DESTAQUE ──────────────────────────────────────────────────
  if ((influencer.reels?.length ?? 0) > 0) {
    const index = nextIndex();
    // 4 por página: thumb 9:16 de 380px de altura + métricas cabe na faixa útil.
    chunk(influencer.reels!, 4).forEach((bloco, pagina) => {
      paginas.push({
        key: `reels-${pagina}`,
        conteudo: (
          <>
            <SectionMark index={index} title={<>Reels em <span className="text-[#FF9A86]">destaque</span></>} />
            {/* Largura fixa por card (9:16 de 400px de altura) e a fileira
                centrada: uma página com 2 ou 3 reels fica equilibrada em vez de
                deixar buraco de coluna vazia à direita. */}
            <div className="flex justify-center gap-8">
              {bloco.map((reel, i) => {
                const stats = [
                  { label: "Views", n: reel.views },
                  { label: "Curtidas", n: reel.likes },
                  { label: "Coment.", n: reel.comments },
                ].filter((s) => s.n > 0);
                const thumb = (
                  <div className="overflow-hidden rounded-[1.25rem] bg-slate-100" style={{ height: 400 }}>
                    <Foto src={reel.thumb} alt={`Reel em destaque ${i + 1}`} className="h-full w-full object-cover" />
                  </div>
                );
                return (
                  <div key={i} style={{ width: 225 }}>
                    {/* O PDF preserva o link: quem recebe clica e abre o reel. */}
                    {reel.permalink ? <a href={reel.permalink}>{thumb}</a> : thumb}
                    {stats.length > 0 && (
                      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-200 pt-3">
                        {stats.map((s) => (
                          <div key={s.label}>
                            <p className="font-display text-lg font-light italic leading-none text-slate-800">
                              {fmtCompact(s.n).value}
                              <span className="text-xs text-slate-400">{fmtCompact(s.n).suffix}</span>
                            </p>
                            <p className="mt-1.5 text-[9px] uppercase tracking-[0.14em] text-slate-400">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ),
      });
    });
  }

  // ── LOOKBOOK ────────────────────────────────────────────────────────────────
  // Sem título nem numeração: são páginas de fotografia sangrando até a borda —
  // é a coisa que mais depende de o PDF ser paginado de propósito.
  if (influencer.moodboard.length >= 3) {
    chunk(influencer.moodboard, 3).forEach((trio, pagina) => {
      paginas.push({
        key: `lookbook-${pagina}`,
        sangria: true,
        conteudo: (
          <div className="h-full bg-[#F7F2EC] p-10">
            {trio.length === 1 ? (
              <div className="h-full overflow-hidden rounded-[1.5rem]">
                <Foto src={trio[0]} alt="Conteúdo editorial" className="h-full w-full object-cover" />
              </div>
            ) : trio.length === 2 ? (
              <div className="grid h-full grid-cols-2 gap-5">
                {trio.map((src, i) => (
                  <div key={i} className="overflow-hidden rounded-[1.5rem]">
                    <Foto src={src} alt={`Conteúdo editorial ${i + 1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid h-full gap-5" style={{ gridTemplateColumns: "5fr 7fr", gridTemplateRows: "3fr 2fr" }}>
                <div className="row-span-2 overflow-hidden rounded-[1.5rem]">
                  <Foto src={trio[0]} alt="Conteúdo editorial 1" className="h-full w-full object-cover" />
                </div>
                <div className="overflow-hidden rounded-[1.5rem]">
                  <Foto src={trio[1]} alt="Conteúdo editorial 2" className="h-full w-full object-cover" />
                </div>
                <div className="overflow-hidden rounded-[1.5rem]">
                  <Foto src={trio[2]} alt="Conteúdo editorial 3" className="h-full w-full object-cover" />
                </div>
              </div>
            )}
          </div>
        ),
      });
    });
  }

  // ── 04 · PÚBLICO ALVO ───────────────────────────────────────────────────────
  if (showDemografia) {
    const index = nextIndex();
    // ponytail: teto de 8 estados por página. Acima disso a coluna estoura os
    // 720px — se um dia precisar de mais, vira chunk() como reels/cases.
    const estados = influencer.topEstados.slice(0, 8);
    paginas.push({
      key: "publico",
      conteudo: (
        <>
          <SectionMark index={index} title={<>Público <span className="text-[#FF9A86]">alvo</span></>} />
          {/* Texto e colunas num bloco só: assim a centralização vertical move os
              dois juntos, em vez de abrir um vão entre o parágrafo e os gráficos. */}
          <div>
          {influencer.publicoAlvo && (
            <p className="mb-10 max-w-[75ch] text-[17px] font-light leading-relaxed text-slate-500">
              {influencer.publicoAlvo}
            </p>
          )}
          <div className="grid grid-cols-3 gap-14">
            {influencer.audienciaGenero.length > 0 && (
              <div>
                <h3 className="mb-6 text-[11px] uppercase tracking-[0.2em] text-slate-400">Gênero</h3>
                <div className="space-y-5">
                  {influencer.audienciaGenero.map((g, i) => (
                    <DistRow key={g.label} label={g.label} pct={g.pct} color={i === 0 ? "#FF9A86" : "#cbd5e1"} />
                  ))}
                </div>
              </div>
            )}
            {influencer.audienciaIdade.length > 0 && (
              <div>
                <h3 className="mb-6 text-[11px] uppercase tracking-[0.2em] text-slate-400">Faixa etária</h3>
                <div className="space-y-5">
                  {influencer.audienciaIdade.map((f, i) => (
                    <DistRow key={f.faixa} label={f.faixa} pct={f.pct} color={idadeColors[i % idadeColors.length]} />
                  ))}
                </div>
              </div>
            )}
            {estados.length > 0 && (
              <div>
                <h3 className="mb-6 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  <MapPin className="h-3.5 w-3.5 text-[#FF9A86]" /> Localização
                </h3>
                <div>
                  {estados.map((estado, i) => (
                    <div key={estado.uf} className="flex items-center gap-4 border-t border-slate-200 py-2.5 first:border-t-0">
                      <span className="font-display text-sm italic text-[#FF9A86]">{String(i + 1).padStart(2, "0")}</span>
                      <span className="flex-1 text-sm text-slate-700">{estado.uf}</span>
                      <span className="font-display text-lg italic text-slate-800">{estado.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          </div>
        </>
      ),
    });
  }

  // ── 05 · FORMATOS E ENTREGAS ────────────────────────────────────────────────
  if (influencer.formatos.length > 0) {
    const index = nextIndex();
    chunk(influencer.formatos, 6).forEach((bloco, pagina) => {
      paginas.push({
        key: `formatos-${pagina}`,
        conteudo: (
          <>
            <SectionMark index={index} title={<>Formatos <span className="text-[#FF9A86]">e entregas</span></>} />
            <div className="grid grid-cols-2 gap-x-16">
              {bloco.map((f, i) => (
                <div key={i} className="flex items-baseline gap-5 border-t border-slate-200 py-6">
                  <span className="font-display text-sm italic text-[#FF9A86]">
                    {String(pagina * 6 + i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <p className="font-display text-[26px] font-light italic leading-tight text-slate-800">{f.nome}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ),
      });
    });
  }

  // ── 06 · CASOS DE SUCESSO ───────────────────────────────────────────────────
  if (influencer.cases.length > 0) {
    const index = nextIndex();
    chunk(influencer.cases, 4).forEach((bloco, pagina) => {
      paginas.push({
        key: `cases-${pagina}`,
        conteudo: (
          <>
            <SectionMark index={index} title={<>Casos de <span className="text-[#FF9A86]">sucesso</span></>} />
            <div className="space-y-6">
              {bloco.map((c, i) => (
                <div key={i} className="grid gap-8 border-t border-slate-200 pt-5" style={{ gridTemplateColumns: "0.25fr 0.75fr" }}>
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-[#FF9A86]">{c.marca}</p>
                    <p className="mt-1.5 text-xs text-slate-400">{c.periodo}</p>
                  </div>
                  <p className="font-display text-[26px] font-light italic leading-snug text-slate-800">{c.resultado}</p>
                </div>
              ))}
            </div>
          </>
        ),
      });
    });
  }

  // ── CONTATO (encerramento) ──────────────────────────────────────────────────
  if (influencer.contato.email || influencer.contato.whatsapp) {
    paginas.push({
      key: "contato",
      sangria: true,
      conteudo: (
        <div className="relative flex h-full flex-col justify-between overflow-hidden bg-[#FF9A86] px-20 py-16 text-white">
          <div className="absolute -right-20 -top-24 h-[420px] w-[420px] rounded-full bg-white/20 blur-[90px]" />
          <div className="absolute -bottom-32 left-1/3 h-[320px] w-[320px] rounded-full bg-[#FF7A60]/40 blur-[70px]" />

          <p className="relative text-[11px] uppercase tracking-[0.34em] text-white/70">
            Vamos trabalhar juntos?
          </p>

          <div className="relative">
            <h2 className="font-display text-[68px] font-light italic leading-[1.05] text-white">
              Pronta para criar<br />algo incrível.
            </h2>
            <div className="mt-10 flex items-center gap-12 text-[17px]">
              {influencer.contato.email && (
                <a href={`mailto:${influencer.contato.email}`} className="flex items-center gap-3 font-medium text-white no-underline">
                  <Mail className="h-[18px] w-[18px]" /> {influencer.contato.email}
                </a>
              )}
              {influencer.contato.whatsapp && (
                <a
                  href={`https://api.whatsapp.com/send?phone=${influencer.contato.whatsapp.replace(/\D/g, "")}`}
                  className="flex items-center gap-3 font-medium text-white no-underline"
                >
                  <WhatsappIcon className="h-[18px] w-[18px]" /> {fmtWhatsapp(influencer.contato.whatsapp)}
                </a>
              )}
            </div>
          </div>

          <div className="relative flex items-center gap-6 text-sm text-white/75">
            {influencer.handles.instagram && (
              <span className="flex items-center gap-2">
                <InstagramIcon className="h-4 w-4" /> {influencer.handles.instagram}
              </span>
            )}
            {influencer.handles.tiktok && (
              <span className="flex items-center gap-2">
                <TikTokIcon className="h-4 w-4" /> {influencer.handles.tiktok}
              </span>
            )}
          </div>
        </div>
      ),
    });
  }

  const total = paginas.length;
  const legendaRodape = [influencer.handles.instagram, influencer.nome].filter(Boolean).join(" · ");

  return (
    <div
      className="deck-root bg-white font-sans text-slate-700"
      data-arquivo={nomeDoArquivo(influencer.nome, m?.reference_month)}
    >
      {/* dangerouslySetInnerHTML e não children: React ESCAPA o texto de um
          <style> na renderização do servidor, então o `>` do seletor vira &gt;
          e o CSS chega quebrado — além de causar mismatch de hidratação que
          derruba a árvore inteira para renderização no cliente. */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page { size: ${PAGE_W}px ${PAGE_H}px; margin: 0; }
        .deck-page {
          width: ${PAGE_W}px;
          height: ${PAGE_H}px;
          position: relative;
          overflow: hidden;
          background: #fff;
          page-break-after: always;
          break-after: page;
        }
        .deck-page:last-child { page-break-after: auto; break-after: auto; }
        /* Recuo padrão das páginas de conteúdo. Páginas com sangria (capa, bio,
           lookbook, contato) pintam de borda a borda e não usam isso. */
        .deck-corpo {
          padding: 56px 88px 72px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        /* Toda seção é <SectionMark/> seguido de UM bloco de conteúdo. Margem
           automática centra esse bloco na sobra da folha — sem isso o conteúdo
           fica grudado no topo com um vão morto embaixo, que é o jeito mais
           rápido de um PDF entregar que era um site picotado.
           Tem que ser margem, e não display:flex no bloco: o bloco costuma ser um
           grid, e trocar o display dele desmonta a seção inteira. Se o conteúdo
           passar da folha, as margens viram 0 e ele transborda só para baixo —
           onde o DeckOverflowCheck consegue medir. */
        .deck-corpo > :last-child { margin-top: auto; margin-bottom: auto; }
        @media print {
          html, body { background: #fff; }
          .deck-root, .deck-root * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        /* Pré-visualização no navegador: folhas soltas sobre fundo cinza. */
        @media screen {
          body { background: #e9e7e2; }
          .deck-page { margin: 24px auto; box-shadow: 0 6px 28px rgba(0,0,0,.14); }
        }
      ` }} />

      {paginas.map((p, i) => (
        <section key={p.key} className="deck-page" data-pagina={i + 1}>
          {p.sangria ? p.conteudo : <div className="deck-corpo">{p.conteudo}</div>}
          {!p.sangria && (
            <div className="absolute inset-x-[88px] bottom-8 flex items-baseline justify-between border-t border-slate-200 pt-3 text-[10px] uppercase tracking-[0.16em] text-slate-400">
              <span>{legendaRodape}</span>
              <span>{String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
