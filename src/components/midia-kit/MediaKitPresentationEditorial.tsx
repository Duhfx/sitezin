"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Versão EDITORIAL / LOOKBOOK do mídia kit — proposta de redesign (validação).
// Mesma interface de props de MediaKitPresentation, para troca de 1 linha caso
// seja aprovado. Não substitui o componente atual; renderizado só em /media-kit-v2.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { MapPin, ArrowUpRight, Mail, Phone } from "lucide-react";
import {
  motion, useScroll, useTransform, useSpring, useMotionValue, useInView, useReducedMotion,
} from "framer-motion";
import type {
  TopEstado, Formato, Case, AudienciaGenero, AudienciaIdade,
} from "@/types/database";

// Janela considerada nas métricas de publicações do TikTok (views/curtidas):
// soma dos vídeos dos últimos N dias. Espelha JANELA_DIAS em src/lib/tiktok-sync.ts.
const TIKTOK_JANELA_DIAS = 28;

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

// ─── Ícones de marca ──────────────────────────────────────────────────────────
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

// ─── Animações ────────────────────────────────────────────────────────────────
const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

// ─── Helpers de formatação ────────────────────────────────────────────────────
function splitNum(n: number): { value: number; suffix: string; decimals: number } {
  if (n >= 1_000_000) {
    const v = parseFloat((n / 1_000_000).toFixed(1));
    return { value: v, suffix: "M", decimals: Number.isInteger(v) ? 0 : 1 };
  }
  if (n >= 1_000) {
    const v = parseFloat((n / 1_000).toFixed(1));
    return { value: v, suffix: "K", decimals: Number.isInteger(v) ? 0 : 1 };
  }
  return { value: n, suffix: "", decimals: 0 };
}

function splitNicho(nicho: string): string[] {
  return nicho.split(/[,&·/|]+/).map((s) => s.trim()).filter(Boolean);
}

function fmtWhatsapp(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 13) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  return raw;
}

function fmtCompact(n: number) {
  const { value, suffix, decimals } = splitNum(n);
  return { value: value.toFixed(decimals), suffix };
}

// ─── Número animado ao entrar na viewport ─────────────────────────────────────
function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: 1800, bounce: 0 });
  const [display, setDisplay] = useState(value.toFixed(decimals));

  useEffect(() => {
    if (reduce) {
      setDisplay(value.toFixed(decimals));
      return;
    }
    if (isInView) motionValue.set(value);
  }, [isInView, motionValue, value, decimals, reduce]);

  useEffect(() => {
    if (reduce) return;
    return springValue.on("change", (v) => setDisplay(v.toFixed(decimals)));
  }, [springValue, decimals, reduce]);

  return <span ref={ref}>{display}</span>;
}

function BigNumber({ n, suffixClassName }: { n: number; suffixClassName?: string }) {
  const { value, suffix, decimals } = splitNum(n);
  return (
    <>
      <AnimatedNumber value={value} decimals={decimals} />
      {suffix && <span className={suffixClassName ?? "not-italic font-sans text-[0.45em] text-slate-400"}>{suffix}</span>}
    </>
  );
}

// ─── Rótulo de seção (numeração editorial discreta, sem eyebrow uppercase) ─────
function SectionMark({ index, title }: { index: string; title: React.ReactNode }) {
  return (
    <motion.div variants={fadeUp} className="mb-10 flex items-baseline gap-4">
      <span className="font-display text-sm italic text-[#FF9A86]">{index}</span>
      <h2 className="font-display text-3xl font-light italic text-slate-800 md:text-4xl">{title}</h2>
      <div className="h-px flex-1 bg-slate-200/70" />
    </motion.div>
  );
}

// Barra fina de distribuição (gênero / faixa etária).
function DistRow({ label, pct, color, delay }: { label: string; pct: number; color: string; delay: number }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm text-slate-600">{label}</span>
        <span className="font-display text-lg italic text-slate-800">{pct}%</span>
      </div>
      <div className="h-px w-full bg-slate-200/70">
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: pct / 100 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay, ease: "easeOut" }}
          style={{ background: color, transformOrigin: "left" }}
          className="h-px"
        />
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
  const reduce = useReducedMotion();
  const lookbookRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: lookbookRef,
    offset: ["start end", "end start"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const y1 = useTransform(smooth, [0, 1], reduce ? [0, 0] : [80, -80]);
  const y2 = useTransform(smooth, [0, 1], reduce ? [0, 0] : [-30, 30]);

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

      {/* ── HERO — split lookbook ───────────────────────────────────────────── */}
      <section className="relative grid min-h-[100dvh] grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Coluna texto */}
        <div className="relative z-10 flex flex-col justify-between bg-[#F7F2EC] px-6 pt-16 pb-12 md:px-12 lg:px-16 lg:pt-20 lg:pb-16">
          <div className="absolute -left-32 top-1/4 h-[420px] w-[420px] rounded-full bg-[#FF9A86]/15 blur-[120px]" />

          <div className="relative z-10 my-auto py-12">
            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE }}
              className="font-display text-[clamp(3.5rem,9vw,8rem)] font-light italic leading-[0.92] text-slate-800"
            >
              {primeiroNome}
              {sobrenome && (
                <>
                  <br />
                  <span className="text-[#FF9A86]">{sobrenome}</span>
                </>
              )}
            </motion.h1>

            {(nichoTags.length > 0 || influencer.localizacao) && (
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.7 }}
                className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-light text-slate-500"
              >
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
              </motion.div>
            )}
          </div>

          {/* Métricas como números grandes + fios verticais (sem cards) */}
          {heroStats.length > 0 && (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="relative z-10 flex divide-x divide-slate-300/60 border-t border-slate-300/60 pt-8"
            >
              {heroStats.map((s) => (
                <div key={s.label} className="flex-1 pl-3 first:pl-0 sm:pl-5">
                  <p className={`font-display text-3xl font-light italic sm:text-4xl md:text-5xl ${s.accent ? "text-[#FF9A86]" : "text-slate-800"}`}>
                    <BigNumber n={s.n} />
                  </p>
                  <p className="mt-2 text-[0.62rem] uppercase tracking-[0.14em] text-slate-400 sm:text-[0.7rem] sm:tracking-[0.18em]">{s.label}</p>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Coluna foto full-bleed */}
        {influencer.foto && (
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: EASE }}
            className="relative min-h-[55vh] overflow-hidden lg:min-h-full"
          >
            <Image
              src={influencer.foto}
              alt={`Retrato de ${influencer.nome}`}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#F7F2EC]/40 via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#F7F2EC]/60 lg:via-transparent lg:to-transparent" />
          </motion.div>
        )}
      </section>

      {/* ── CORPO ───────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 py-20 md:px-12 md:py-28">

        {/* BIO — spread editorial */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid grid-cols-1 gap-x-16 gap-y-8 lg:grid-cols-[0.35fr_0.65fr]"
        >
          <motion.h2 variants={fadeUp} className="font-display text-4xl font-light italic leading-tight text-slate-800 md:text-5xl">
            Muito prazer,<br />sou a <span className="text-[#FF9A86]">{primeiroNome}.</span>
          </motion.h2>
          <motion.div variants={fadeUp} className="space-y-5 text-lg font-light leading-relaxed text-slate-500 max-w-[65ch]">
            <div className="mb-6 h-px w-16 bg-[#FF9A86]" />
            {bioParagrafos.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </motion.div>
        </motion.section>

        {/* PLATAFORMAS — Instagram + TikTok lado a lado, sem caixas */}
        {(igFollowers > 0 || tkFollowers > 0) && (
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mt-28"
          >
            <SectionMark index="01" title={<>As <span className="text-[#FF9A86]">plataformas</span></>} />

            <div className="grid grid-cols-1 gap-x-16 gap-y-14 md:grid-cols-2 md:divide-x md:divide-slate-200/70">
              {igFollowers > 0 && (
                <motion.div variants={fadeUp} className="md:pr-16">
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
                </motion.div>
              )}

              {tkFollowers > 0 && (
                <motion.div variants={fadeUp} className="md:pl-16">
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
                </motion.div>
              )}
            </div>
          </motion.section>
        )}

        {/* PERFORMANCE & ENGAJAMENTO */}
        {showPerformance && (
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mt-28"
          >
            <SectionMark index="02" title={<>Performance <span className="text-[#FF9A86]">e engajamento</span></>} />

            <div className="grid grid-cols-1 gap-x-16 gap-y-14 md:grid-cols-2 md:divide-x md:divide-slate-200/70">
              {showIgPerf && (
                <motion.div variants={fadeUp} className="md:pr-16">
                  <div className="mb-6 flex items-center gap-3">
                    <InstagramIcon className="h-4 w-4 text-[#FF9A86]" />
                    <span className="text-sm uppercase tracking-[0.2em] text-slate-400">Instagram</span>
                  </div>
                  {igEng > 0 && (
                    <div className="flex items-end gap-3">
                      <p className="font-display text-7xl font-light italic text-slate-800">
                        <AnimatedNumber value={igEng} decimals={1} />
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
                </motion.div>
              )}

              {showTkPerf && (
                <motion.div variants={fadeUp} className="md:pl-16">
                  <div className="mb-6 flex items-center gap-3">
                    <TikTokIcon className="h-4 w-4 text-slate-700" />
                    <span className="text-sm uppercase tracking-[0.2em] text-slate-400">TikTok</span>
                  </div>
                  {tkEng > 0 && (
                    <div className="flex items-end gap-3">
                      <p className="font-display text-7xl font-light italic text-slate-800">
                        <AnimatedNumber value={tkEng} decimals={1} />
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
                </motion.div>
              )}
            </div>
          </motion.section>
        )}
      </div>

      {/* LOOKBOOK — faixa de fotografia full-bleed com parallax */}
      {influencer.moodboard.length >= 3 && (
        <section ref={lookbookRef} className="relative overflow-hidden bg-[#F7F2EC] py-20 md:py-28">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-6 md:grid-cols-12 md:px-12">
            <motion.div
              style={{ y: y1 }}
              initial={reduce ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative aspect-[3/4] overflow-hidden rounded-[1.5rem] md:col-span-5"
            >
              <Image
                src={influencer.moodboard[0]}
                alt="Conteúdo editorial 1"
                fill
                sizes="(min-width: 768px) 42vw, 100vw"
                className="object-cover"
              />
            </motion.div>
            <motion.div
              initial={reduce ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] md:col-span-7 md:mt-16"
            >
              <Image
                src={influencer.moodboard[1]}
                alt="Conteúdo editorial 2"
                fill
                sizes="(min-width: 768px) 58vw, 100vw"
                className="object-cover"
              />
            </motion.div>
            <motion.div
              style={{ y: y2 }}
              initial={reduce ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] md:col-span-12"
            >
              <Image
                src={influencer.moodboard[2]}
                alt="Conteúdo editorial 3"
                fill
                sizes="(min-width: 768px) 1152px, 100vw"
                className="object-cover"
              />
            </motion.div>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-6xl px-6 py-20 md:px-12 md:py-28">

        {/* DEMOGRAFIA / PÚBLICO-ALVO */}
        {showDemografia && (
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <SectionMark index="03" title={<>Público <span className="text-[#FF9A86]">alvo</span></>} />

            {influencer.publicoAlvo && (
              <motion.p variants={fadeUp} className="mb-12 max-w-[60ch] text-lg font-light leading-relaxed text-slate-500">
                {influencer.publicoAlvo}
              </motion.p>
            )}

            <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-16">
              {influencer.audienciaGenero.length > 0 && (
                <motion.div variants={fadeUp}>
                  <h3 className="mb-6 text-xs uppercase tracking-[0.2em] text-slate-400">Gênero</h3>
                  <div className="space-y-6">
                    {influencer.audienciaGenero.map((g, i) => (
                      <DistRow key={g.label} label={g.label} pct={g.pct} color={i === 0 ? "#FF9A86" : "#cbd5e1"} delay={0.15 * i} />
                    ))}
                  </div>
                </motion.div>
              )}

              {influencer.audienciaIdade.length > 0 && (
                <motion.div variants={fadeUp}>
                  <h3 className="mb-6 text-xs uppercase tracking-[0.2em] text-slate-400">Faixa etária</h3>
                  <div className="space-y-6">
                    {influencer.audienciaIdade.map((f, i) => (
                      <DistRow key={f.faixa} label={f.faixa} pct={f.pct} color={idadeColors[i % idadeColors.length]} delay={0.15 * i} />
                    ))}
                  </div>
                </motion.div>
              )}

              {influencer.topEstados.length > 0 && (
                <motion.div variants={fadeUp}>
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
                </motion.div>
              )}
            </div>
          </motion.section>
        )}

        {/* FORMATOS & ENTREGAS — lista editorial (sem 6 cards iguais) */}
        {influencer.formatos.length > 0 && (
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mt-28"
          >
            <SectionMark index="04" title={<>Formatos <span className="text-[#FF9A86]">e entregas</span></>} />

            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-16">
              {influencer.formatos.map((f, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="group flex items-baseline gap-5 border-t border-slate-200/70 py-6"
                >
                  <span className="font-display text-sm italic text-[#FF9A86]">{String(i + 1).padStart(2, "0")}</span>
                  <div className="flex-1">
                    <p className="font-display text-2xl font-light italic text-slate-800">{f.nome}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{f.descricao}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* CASES / SUCESSO — citações editoriais */}
        {influencer.cases.length > 0 && (
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mt-28"
          >
            <SectionMark index="05" title={<>Casos de <span className="text-[#FF9A86]">sucesso</span></>} />

            <div className="space-y-10">
              {influencer.cases.map((c, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="grid grid-cols-1 gap-3 border-t border-slate-200/70 pt-8 md:grid-cols-[0.25fr_0.75fr] md:gap-8"
                >
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-[#FF9A86]">{c.marca}</p>
                    <p className="mt-1 text-xs text-slate-400">{c.periodo}</p>
                  </div>
                  <p className="font-display text-2xl font-light italic leading-snug text-slate-800 md:text-3xl">
                    {c.resultado}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </div>

      {/* CTA FINAL */}
      {(influencer.contato.email || influencer.contato.whatsapp) && (
        <section className="px-6 pb-16 md:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-[#FF9A86] px-8 py-16 md:px-16 md:py-24"
          >
            <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-white/15 blur-[90px]" />
            <div className="absolute bottom-0 left-1/3 h-60 w-60 rounded-full bg-[#FF7A60]/30 blur-[70px]" />

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
                    <Phone className="h-4 w-4" />
                    <span className="font-medium">{fmtWhatsapp(influencer.contato.whatsapp)}</span>
                    <ArrowUpRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </section>
      )}
    </div>
  );
}
