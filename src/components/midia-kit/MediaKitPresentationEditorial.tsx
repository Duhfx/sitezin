"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Versão EDITORIAL / LOOKBOOK do mídia kit — proposta de redesign (validação).
// Mesma interface de props de MediaKitPresentation, para troca de 1 linha caso
// seja aprovado. Não substitui o componente atual; renderizado só em /media-kit-v2.
//
// Animações: CSS puro via <Reveal> (sem framer-motion). O conteúdo é visível no
// primeiro paint (nunca tela branca esperando hidratação) e a rota não baixa
// nem hidrata o framer-motion.
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
import Image from "next/image";
import { MapPin, ArrowUpRight, Mail } from "lucide-react";
import Reveal from "./Reveal";
import WhatsappIcon from "@/components/icons/WhatsappIcon";
import type {
  TopEstado, Formato, Case, AudienciaGenero, AudienciaIdade, Reel,
} from "@/types/database";
import {
  TIKTOK_JANELA_DIAS, estiloFoto, fmtCompact, fmtWhatsapp, splitNicho,
  BigNumber, InstagramIcon, TikTokIcon,
} from "@/lib/midia-kit-format";

// Reel em destaque (tipo canônico em @/types/database): print + métricas.
// Opcional — cadastrável depois (igual ao moodboard); a seção só renderiza com reels.

// ─── Tipos das props (idênticos ao componente atual) ──────────────────────────
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
  // Enquadramento de cada foto do moodboard, escolhido no admin (arrays
  // paralelos a `moodboard`). Ausente = centro, sem zoom.
  moodboardPos?: string[];
  moodboardZoom?: number[];
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

// ─── Rótulo de seção (numeração editorial discreta, sem eyebrow uppercase) ─────
function SectionMark({ index, title }: { index: string; title: React.ReactNode }) {
  return (
    <div className="mb-10 flex items-baseline gap-4">
      <span className="font-display text-sm italic text-[#FF9A86]">{index}</span>
      <h2 className="font-display text-3xl font-light italic text-slate-800 md:text-4xl">{title}</h2>
      <div className="h-px flex-1 bg-slate-200/70" />
    </div>
  );
}

// Barra fina de distribuição (gênero / faixa etária).
function DistRow({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm text-slate-600">{label}</span>
        <span className="font-display text-lg italic text-slate-800">{pct}%</span>
      </div>
      <div className="h-px w-full bg-slate-200/70">
        <div className="h-px" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function MediaKitPresentationEditorial({
  influencer,
  metricas,
}: {
  influencer: InfluencerPresentation;
  metricas: Metrics;
}) {
  const m = metricas.length > 0 ? metricas[metricas.length - 1] : null;

  // ── Derivações ──
  const igFollowers = m?.instagram_followers ?? 0;
  const tkFollowers = m?.tiktok_followers ?? 0;
  const alcanceCombinado = (m?.instagram_reach ?? 0) + (m?.tiktok_views ?? 0);

  const nichoTags = splitNicho(influencer.nicho);
  const bioParagrafos = influencer.biografia.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  const primeiroNome = influencer.nome.split(" ")[0] || influencer.nome;
  const sobrenome = influencer.nome.split(" ").slice(1).join(" ");

  const whatsappDigits = influencer.contato.whatsapp.replace(/\D/g, "");
  const whatsappUrl = whatsappDigits ? `https://wa.me/${whatsappDigits}` : "";
  const emailUrl = influencer.contato.email ? `mailto:${influencer.contato.email}` : "";

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
  const showPerformance = showIgPerf || showTkPerf;

  const showDemografia =
    influencer.audienciaGenero.length > 0 ||
    influencer.audienciaIdade.length > 0 ||
    influencer.topEstados.length > 0;

  const idadeColors = ["#FF9A86", "#FFB399", "#FFD6A6"];

  return (
    <div className="min-h-screen bg-[#faf9f6] font-sans text-slate-700 selection:bg-[#FF9A86] selection:text-white">

      {/* ── HERO — split lookbook (sempre visível no primeiro paint) ──────────── */}
      <section id="identidade" className="relative grid min-h-[100dvh] grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Coluna texto */}
        <div className="relative z-10 flex flex-col justify-between bg-[#F7F2EC] px-6 pt-16 pb-12 md:px-12 lg:px-16 lg:pt-20 lg:pb-16">
          {/* Glow decorativo: só no desktop. filter:blur() de raio alto trava o
              paint no mobile (~6-7s pra abrir), e a 15% de opacidade quase não
              se nota. hidden no mobile = zero custo de GPU lá. */}
          <div className="hidden lg:block absolute -left-32 top-1/4 h-[420px] w-[420px] rounded-full bg-[#FF9A86]/15 blur-[120px]" />

          <div className="relative z-10 my-auto py-12">
            <h1 className="font-display text-[clamp(3.5rem,9vw,8rem)] font-light italic leading-[0.92] text-slate-800">
              {primeiroNome}
              {sobrenome && (
                <>
                  <br />
                  <span className="text-[#FF9A86]">{sobrenome}</span>
                </>
              )}
            </h1>

            {(nichoTags.length > 0 || influencer.localizacao) && (
              <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-light text-slate-500">
                {nichoTags.map((tag, i) => (
                  <React.Fragment key={tag}>
                    {i > 0 && <span className="h-1 w-1 rounded-full bg-[#FF9A86]/60" />}
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

            {(influencer.redes.instagram || influencer.redes.tiktok) && (
              <div className="mt-8 flex items-center gap-3">
                {influencer.redes.instagram && (
                  <a
                    href={influencer.redes.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300/70 text-slate-600 transition-colors hover:border-[#FF9A86] hover:text-[#FF9A86]"
                  >
                    <InstagramIcon className="h-4 w-4" />
                  </a>
                )}
                {influencer.redes.tiktok && (
                  <a
                    href={influencer.redes.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300/70 text-slate-600 transition-colors hover:border-[#FF9A86] hover:text-[#FF9A86]"
                  >
                    <TikTokIcon className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Métricas como números grandes + fios verticais (sem cards) */}
          {heroStats.length > 0 && (
            <div className="relative z-10 flex divide-x divide-slate-300/60 border-t border-slate-300/60 pt-8">
              {heroStats.map((s) => (
                <div key={s.label} className="flex-1 pl-3 first:pl-0 sm:pl-5">
                  <p className={`font-display text-3xl font-light italic sm:text-4xl md:text-5xl ${s.accent ? "text-[#FF9A86]" : "text-slate-800"}`}>
                    <BigNumber n={s.n} />
                  </p>
                  <p className="mt-2 text-[0.62rem] uppercase tracking-[0.14em] text-slate-400 sm:text-[0.7rem] sm:tracking-[0.18em]">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coluna foto full-bleed */}
        {influencer.foto && (
          <div className="relative min-h-[55vh] overflow-hidden lg:min-h-full">
            <Image
              src={influencer.foto}
              alt={`Retrato de ${influencer.nome}`}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#F7F2EC]/40 via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#F7F2EC]/60 lg:via-transparent lg:to-transparent" />
          </div>
        )}
      </section>

      {/* ── CORPO ───────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 py-20 md:px-12 md:py-28">

        {/* BIO — spread editorial */}
        <Reveal as="section" id="bio" className="grid grid-cols-1 gap-x-16 gap-y-8 lg:grid-cols-[0.35fr_0.65fr]">
          <h2 className="font-display text-4xl font-light italic leading-tight text-slate-800 md:text-5xl">
            Muito prazer,<br />sou a <span className="text-[#FF9A86]">{primeiroNome}.</span>
          </h2>
          <div className="space-y-5 text-lg font-light leading-relaxed text-slate-500 max-w-[65ch]">
            <div className="mb-6 h-px w-16 bg-[#FF9A86]" />
            {bioParagrafos.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </Reveal>

        {/* PLATAFORMAS — Instagram + TikTok lado a lado, sem caixas */}
        {(igFollowers > 0 || tkFollowers > 0) && (
          <Reveal as="section" id="plataformas" className="mt-28">
            <SectionMark index="01" title={<>As <span className="text-[#FF9A86]">plataformas</span></>} />

            <div className="grid grid-cols-1 gap-x-16 gap-y-14 md:grid-cols-2 md:divide-x md:divide-slate-200/70">
              {igFollowers > 0 && (
                <div className="md:pr-16">
                  <div className="mb-8 flex items-center gap-3 text-slate-700">
                    <InstagramIcon className="h-5 w-5 text-[#FF9A86]" />
                    <span className="text-sm uppercase tracking-[0.2em] text-slate-400">Instagram</span>
                    {influencer.handles.instagram && (
                      <span className="text-sm text-slate-500">{influencer.handles.instagram}</span>
                    )}
                  </div>
                  <p className="font-display text-6xl font-light italic text-slate-800 md:text-7xl">
                    <BigNumber n={igFollowers} suffixClassName="not-italic font-sans text-3xl text-slate-400" />
                  </p>
                  <p className="mt-2 text-sm text-slate-400">seguidores</p>
                  <div className="mt-8 grid grid-cols-2 gap-8 border-t border-slate-200/70 pt-6">
                    <div>
                      <p className="mb-1 text-xs text-slate-400">Alcance (30d)</p>
                      <p className="font-display text-2xl font-light italic text-slate-700">
                        {fmtCompact(m?.instagram_reach ?? 0).value}
                        <span className="text-base text-slate-400">{fmtCompact(m?.instagram_reach ?? 0).suffix}</span>
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-slate-400">Impressões</p>
                      <p className="font-display text-2xl font-light italic text-[#FF9A86]">
                        {fmtCompact(m?.instagram_impressions ?? 0).value}
                        <span className="text-base">{fmtCompact(m?.instagram_impressions ?? 0).suffix}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {tkFollowers > 0 && (
                <div className="md:pl-16">
                  <div className="mb-8 flex items-center gap-3 text-slate-700">
                    <TikTokIcon className="h-5 w-5 text-slate-700" />
                    <span className="text-sm uppercase tracking-[0.2em] text-slate-400">TikTok</span>
                    {influencer.handles.tiktok && (
                      <span className="text-sm text-slate-500">{influencer.handles.tiktok}</span>
                    )}
                  </div>
                  <p className="font-display text-6xl font-light italic text-slate-800 md:text-7xl">
                    <BigNumber n={tkFollowers} suffixClassName="not-italic font-sans text-3xl text-slate-400" />
                  </p>
                  <p className="mt-2 text-sm text-slate-400">seguidores</p>
                  <div className="mt-8 grid grid-cols-2 gap-8 border-t border-slate-200/70 pt-6">
                    <div>
                      <p className="mb-1 text-xs text-slate-400">Visualizações ({TIKTOK_JANELA_DIAS}d)</p>
                      <p className="font-display text-2xl font-light italic text-slate-700">
                        {fmtCompact(m?.tiktok_views ?? 0).value}
                        <span className="text-base text-slate-400">{fmtCompact(m?.tiktok_views ?? 0).suffix}</span>
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-slate-400">Curtidas</p>
                      <p className="font-display text-2xl font-light italic text-[#FF9A86]">
                        {fmtCompact(m?.tiktok_likes ?? 0).value}
                        <span className="text-base">{fmtCompact(m?.tiktok_likes ?? 0).suffix}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        )}

        {/* PERFORMANCE & ENGAJAMENTO */}
        {showPerformance && (
          <Reveal as="section" id="performance" className="mt-28">
            <SectionMark index="02" title={<>Performance <span className="text-[#FF9A86]">e engajamento</span></>} />

            <div className="grid grid-cols-1 gap-x-16 gap-y-14 md:grid-cols-2 md:divide-x md:divide-slate-200/70">
              {showIgPerf && (
                <div className="md:pr-16">
                  <div className="mb-6 flex items-center gap-3">
                    <InstagramIcon className="h-4 w-4 text-[#FF9A86]" />
                    <span className="text-sm uppercase tracking-[0.2em] text-slate-400">Instagram</span>
                  </div>
                  {igEng > 0 && (
                    <div className="flex items-end gap-3">
                      <p className="font-display text-7xl font-light italic text-slate-800">
                        {igEng.toFixed(1)}
                      </p>
                      <div className="mb-3">
                        <p className="font-display text-3xl font-light italic text-slate-400">%</p>
                        <p className="text-xs text-slate-400">taxa de engajamento</p>
                      </div>
                    </div>
                  )}
                  {igPerf.length > 0 && (
                    <div className="mt-8 grid grid-cols-3 gap-6 border-t border-slate-200/70 pt-6">
                      {igPerf.map((s) => (
                        <div key={s.label}>
                          <p className="mb-1 text-xs text-slate-400">{s.label}</p>
                          <p className="font-display text-xl font-light italic text-slate-700">
                            {fmtCompact(s.n).value}<span className="text-sm text-slate-400">{fmtCompact(s.n).suffix}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {showTkPerf && (
                <div className="md:pl-16">
                  <div className="mb-6 flex items-center gap-3">
                    <TikTokIcon className="h-4 w-4 text-slate-700" />
                    <span className="text-sm uppercase tracking-[0.2em] text-slate-400">TikTok</span>
                  </div>
                  {tkEng > 0 && (
                    <div className="flex items-end gap-3">
                      <p className="font-display text-7xl font-light italic text-slate-800">
                        {tkEng.toFixed(1)}
                      </p>
                      <div className="mb-3">
                        <p className="font-display text-3xl font-light italic text-slate-400">%</p>
                        <p className="text-xs text-slate-400">taxa de engajamento</p>
                      </div>
                    </div>
                  )}
                  {tkPerf.length > 0 && (
                    <div className="mt-8 grid grid-cols-3 gap-6 border-t border-slate-200/70 pt-6">
                      {tkPerf.map((s) => (
                        <div key={s.label}>
                          <p className="mb-1 text-xs text-slate-400">{s.label}</p>
                          <p className="font-display text-xl font-light italic text-slate-700">
                            {fmtCompact(s.n).value}<span className="text-sm text-slate-400">{fmtCompact(s.n).suffix}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Reveal>
        )}

        {/* REELS EM DESTAQUE — prints do Instagram com métricas */}
        {(influencer.reels?.length ?? 0) > 0 && (
          <Reveal as="section" id="reels" className="mt-28">
            <SectionMark index="03" title={<>Reels em <span className="text-[#FF9A86]">destaque</span></>} />

            <div className="grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-3">
              {influencer.reels!.map((reel, i) => {
                const stats = [
                  { label: "Views", n: reel.views },
                  { label: "Curtidas", n: reel.likes },
                  { label: "Comentários", n: reel.comments },
                ].filter((s) => s.n > 0);
                return (
                  <div key={i}>
                    <div className="group relative aspect-[9/16] overflow-hidden rounded-[1.5rem] bg-slate-100">
                      <Image
                        src={reel.thumb}
                        alt={`Reel em destaque ${i + 1}`}
                        fill
                        sizes="(min-width: 640px) 30vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      {reel.permalink && (
                        <a
                          href={reel.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Abrir reel ${i + 1} no Instagram`}
                          className="absolute inset-0 z-10 flex items-start justify-end p-3"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-slate-700 lg:backdrop-blur">
                            <ArrowUpRight className="h-4 w-4" />
                          </span>
                        </a>
                      )}
                    </div>
                    {stats.length > 0 && (
                      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-200/70 pt-4">
                        {stats.map((s) => (
                          <div key={s.label}>
                            <p className="font-display text-xl font-light italic text-slate-800">
                              {fmtCompact(s.n).value}
                              <span className="text-sm text-slate-400">{fmtCompact(s.n).suffix}</span>
                            </p>
                            <p className="mt-1 text-[0.65rem] uppercase tracking-[0.14em] text-slate-400">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Reveal>
        )}
      </div>

      {/* LOOKBOOK — faixa de fotografia full-bleed */}
      {influencer.moodboard.length >= 3 && (
        <section id="lookbook" className="relative overflow-hidden bg-[#F7F2EC] py-20 md:py-28">
          {/* Mesmo mosaico da página de lookbook do PDF (MediaKitDeckPdf):
              colunas 5fr/7fr, linhas de altura igual, retrato alto à esquerda. O
              `aspect` do container reproduz a área útil da folha 16:9 (1200x640)
              — é ele que dá altura às células, então cada foto volta a
              `aspect-auto` no md. No mobile o grid vira coluna e cada foto
              recupera o próprio aspect. */}
          <div className="mx-auto max-w-6xl px-6 md:px-12">
            <div className="grid grid-cols-1 gap-5 md:aspect-[15/8] md:grid-cols-[5fr_7fr] md:grid-rows-[1fr_1fr]">
              <Reveal className="relative aspect-[3/4] overflow-hidden rounded-[1.5rem] md:aspect-auto md:row-span-2">
                <Image
                  src={influencer.moodboard[0]}
                  alt="Conteúdo editorial 1"
                  fill
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="object-cover"
                  style={estiloFoto(influencer.moodboardPos?.[0], influencer.moodboardZoom?.[0])}
                />
              </Reveal>
              <Reveal delay={100} className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] md:aspect-auto">
                <Image
                  src={influencer.moodboard[1]}
                  alt="Conteúdo editorial 2"
                  fill
                  sizes="(min-width: 768px) 56vw, 100vw"
                  className="object-cover"
                  style={estiloFoto(influencer.moodboardPos?.[1], influencer.moodboardZoom?.[1])}
                />
              </Reveal>
              <Reveal delay={200} className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] md:aspect-auto">
                <Image
                  src={influencer.moodboard[2]}
                  alt="Conteúdo editorial 3"
                  fill
                  sizes="(min-width: 768px) 56vw, 100vw"
                  className="object-cover"
                  style={estiloFoto(influencer.moodboardPos?.[2], influencer.moodboardZoom?.[2])}
                />
              </Reveal>
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-6xl px-6 py-20 md:px-12 md:py-28">

        {/* DEMOGRAFIA / PÚBLICO-ALVO */}
        {showDemografia && (
          <Reveal as="section" id="publico">
            <SectionMark index="04" title={<>Público <span className="text-[#FF9A86]">alvo</span></>} />

            {influencer.publicoAlvo && (
              <p className="mb-12 max-w-[60ch] text-lg font-light leading-relaxed text-slate-500">
                {influencer.publicoAlvo}
              </p>
            )}

            <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-16">
              {influencer.audienciaGenero.length > 0 && (
                <div>
                  <h3 className="mb-6 text-xs uppercase tracking-[0.2em] text-slate-400">Gênero</h3>
                  <div className="space-y-6">
                    {influencer.audienciaGenero.map((g, i) => (
                      <DistRow key={g.label} label={g.label} pct={g.pct} color={i === 0 ? "#FF9A86" : "#cbd5e1"} />
                    ))}
                  </div>
                </div>
              )}

              {influencer.audienciaIdade.length > 0 && (
                <div>
                  <h3 className="mb-6 text-xs uppercase tracking-[0.2em] text-slate-400">Faixa etária</h3>
                  <div className="space-y-6">
                    {influencer.audienciaIdade.map((f, i) => (
                      <DistRow key={f.faixa} label={f.faixa} pct={f.pct} color={idadeColors[i % idadeColors.length]} />
                    ))}
                  </div>
                </div>
              )}

              {influencer.topEstados.length > 0 && (
                <div>
                  <h3 className="mb-6 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                    <MapPin className="h-3.5 w-3.5 text-[#FF9A86]" /> Localização
                  </h3>
                  <div>
                    {influencer.topEstados.map((estado, i) => (
                      <div
                        key={estado.uf}
                        className="flex items-center gap-4 border-t border-slate-200/70 py-3 first:border-t-0"
                      >
                        <span className="font-display text-sm italic text-[#FF9A86]">{String(i + 1).padStart(2, "0")}</span>
                        <span className="flex-1 text-sm text-slate-700">{estado.uf}</span>
                        <span className="font-display text-lg italic text-slate-800">{estado.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        )}

        {/* FORMATOS & ENTREGAS — lista editorial (sem 6 cards iguais) */}
        {influencer.formatos.length > 0 && (
          <Reveal as="section" id="formatos" className="mt-28">
            <SectionMark index="05" title={<>Formatos <span className="text-[#FF9A86]">e entregas</span></>} />

            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-16">
              {influencer.formatos.map((f, i) => (
                <div
                  key={i}
                  className="group flex items-baseline gap-5 border-t border-slate-200/70 py-6"
                >
                  <span className="font-display text-sm italic text-[#FF9A86]">{String(i + 1).padStart(2, "0")}</span>
                  <div className="flex-1">
                    <p className="font-display text-2xl font-light italic text-slate-800">{f.nome}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{f.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        )}

        {/* CASES / SUCESSO — citações editoriais */}
        {influencer.cases.length > 0 && (
          <Reveal as="section" id="cases" className="mt-28">
            <SectionMark index="06" title={<>Casos de <span className="text-[#FF9A86]">sucesso</span></>} />

            <div className="space-y-10">
              {influencer.cases.map((c, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 gap-3 border-t border-slate-200/70 pt-8 md:grid-cols-[0.25fr_0.75fr] md:gap-8"
                >
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-[#FF9A86]">{c.marca}</p>
                    <p className="mt-1 text-xs text-slate-400">{c.periodo}</p>
                  </div>
                  <p className="font-display text-2xl font-light italic leading-snug text-slate-800 md:text-3xl">
                    {c.resultado}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        )}
      </div>

      {/* CTA FINAL */}
      {(influencer.contato.email || influencer.contato.whatsapp) && (
        <section id="contato" className="px-6 pb-16 md:px-12">
          <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-[#FF9A86] px-8 py-16 md:px-16 md:py-24">
            <div className="hidden lg:block absolute right-0 top-0 h-80 w-80 rounded-full bg-white/15 blur-[90px]" />
            <div className="hidden lg:block absolute bottom-0 left-1/3 h-60 w-60 rounded-full bg-[#FF7A60]/30 blur-[70px]" />

            <div className="relative z-10 flex flex-col items-start justify-between gap-12 lg:flex-row lg:items-end">
              <div>
                <p className="mb-4 text-xs uppercase tracking-[0.25em] text-white/70">Vamos trabalhar juntos?</p>
                <h2 className="font-display text-4xl font-light italic leading-tight text-white md:text-6xl">
                  Pronta para criar<br />algo incrível.
                </h2>
              </div>

              <div className="flex flex-col gap-4 lg:items-end">
                {influencer.contato.email && (
                  <a href={emailUrl} className="group flex items-center gap-3 text-white transition-opacity hover:opacity-80">
                    <Mail className="h-4 w-4" />
                    <span className="font-medium">{influencer.contato.email}</span>
                    <ArrowUpRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                )}
                {influencer.contato.whatsapp && (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 text-white transition-opacity hover:opacity-80">
                    <WhatsappIcon className="h-4 w-4" />
                    <span className="font-medium">{fmtWhatsapp(influencer.contato.whatsapp)}</span>
                    <ArrowUpRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                )}
              </div>
            </div>
          </Reveal>
        </section>
      )}
    </div>
  );
}
