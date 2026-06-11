"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  MapPin, Users, Mail, Phone, Film, LayoutGrid, Layers, Play, Sparkles, Radio,
} from "lucide-react";
import {
  motion, useScroll, useTransform, useSpring, useMotionValue, useInView, useReducedMotion,
} from "framer-motion";
import type {
  TopEstado, Formato, Case, AudienciaGenero, AudienciaIdade,
} from "@/types/database";

// ─── Tipos das props ──────────────────────────────────────────────────────────
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
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

// ─── Helpers de formatação ────────────────────────────────────────────────────
// Divide um número em { value, suffix, decimals } para alimentar o AnimatedNumber.
// Ex.: 1_200_000 → { value: 1.2, suffix: "M", decimals: 1 }; 450_000 → { 450, "K", 0 }.
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

// Quebra o nicho ("Lifestyle & Viagens") em tags individuais.
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

const FORMAT_ICONS = [Film, LayoutGrid, Layers, Play, Sparkles, Radio];

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

// Número grande com sufixo (M/K) estilizado.
function BigNumber({ n, suffixClassName }: { n: number; suffixClassName?: string }) {
  const { value, suffix, decimals } = splitNum(n);
  return (
    <>
      <AnimatedNumber value={value} decimals={decimals} />
      {suffix && (
        <span className={suffixClassName ?? "not-italic font-sans text-2xl text-slate-400"}>{suffix}</span>
      )}
    </>
  );
}

// Estatística simples (sem animação) usada nos mini-cards.
function fmtCompact(n: number) {
  const { value, suffix, decimals } = splitNum(n);
  return { value: value.toFixed(decimals), suffix };
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function MediaKitPresentation({
  influencer,
  metricas,
}: {
  influencer: InfluencerPresentation;
  metricas: Metrics;
}) {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const y1 = useTransform(smoothProgress, [0, 1], [60, -60]);
  const y2 = useTransform(smoothProgress, [0, 1], [-20, 20]);
  const y3 = useTransform(smoothProgress, [0, 1], [120, -120]);

  const m = metricas.length > 0 ? metricas[metricas.length - 1] : null;

  // ── Derivações ──
  const igFollowers = m?.instagram_followers ?? 0;
  const tkFollowers = m?.tiktok_followers ?? 0;
  const alcanceCombinado = (m?.instagram_reach ?? 0) + (m?.tiktok_views ?? 0);

  const nichoTags = splitNicho(influencer.nicho);
  const bioParagrafos = influencer.biografia.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  const primeiroNome = influencer.nome.split(" ")[0] || influencer.nome;

  const whatsappDigits = influencer.contato.whatsapp.replace(/\D/g, "");
  const whatsappUrl = whatsappDigits ? `https://wa.me/${whatsappDigits}` : "";
  const emailUrl = influencer.contato.email ? `mailto:${influencer.contato.email}` : "";

  // Sub-stats de performance (só renderiza os > 0)
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
  const localColors = ["#FF9A86", "#FFB399", "#FFD6A6"];

  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-700 font-sans selection:bg-[#FF9A86] selection:text-white overflow-hidden">

      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative px-8 pt-16 pb-20 md:px-16 lg:px-24 bg-[#F7F2EC] overflow-hidden"
      >
        <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#FF9A86]/30 to-transparent rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-[300px] h-[300px] bg-gradient-to-tr from-[#FFD6A6]/20 to-transparent rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 text-[#FF9A86] text-xs font-medium tracking-widest uppercase mb-10 bg-[#FF9A86]/10 px-4 py-2 rounded-full"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF9A86]" />
            Mídia Kit
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="font-display italic font-light text-6xl md:text-8xl lg:text-9xl text-slate-800 leading-none mb-6"
          >
            {influencer.nome}
          </motion.h1>

          {(nichoTags.length > 0 || influencer.localizacao) && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-slate-500 text-base md:text-lg font-light mb-16 flex items-center gap-3 flex-wrap"
            >
              {nichoTags.map((tag, i) => (
                <React.Fragment key={tag}>
                  {i > 0 && <span className="w-1 h-1 rounded-full bg-slate-300" />}
                  <span>{tag}</span>
                </React.Fragment>
              ))}
              {influencer.localizacao && (
                <span className="ml-4 flex items-center gap-1.5 text-slate-400">
                  <MapPin className="w-3.5 h-3.5" /> {influencer.localizacao}
                </span>
              )}
            </motion.p>
          )}

          {m && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-10 md:gap-20"
            >
              {igFollowers > 0 && (
                <div>
                  <p className="font-display italic font-light text-4xl md:text-5xl text-slate-800">
                    <BigNumber n={igFollowers} />
                  </p>
                  <p className="text-xs text-slate-400 uppercase tracking-widest mt-1.5">Instagram</p>
                </div>
              )}
              {tkFollowers > 0 && (
                <div>
                  <p className="font-display italic font-light text-4xl md:text-5xl text-slate-800">
                    <BigNumber n={tkFollowers} />
                  </p>
                  <p className="text-xs text-slate-400 uppercase tracking-widest mt-1.5">TikTok</p>
                </div>
              )}
              {alcanceCombinado > 0 && (
                <div>
                  <p className="font-display italic font-light text-4xl md:text-5xl text-[#FF9A86]">
                    <BigNumber n={alcanceCombinado} suffixClassName="not-italic font-sans text-2xl" />
                  </p>
                  <p className="text-xs text-slate-400 uppercase tracking-widest mt-1.5">Alcance combinado</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── Bento Grid ── */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6 lg:gap-8 p-4 md:p-8 lg:p-12"
      >

        {/* Profile & Contact */}
        <motion.div variants={fadeUp} className="lg:col-span-3 flex flex-col gap-6">
          {influencer.foto && (
            <div className="bg-white rounded-3xl p-3 aspect-square shadow-sm border border-slate-100 relative group overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={influencer.foto} alt={`Foto de ${influencer.nome}`} className="absolute inset-3 w-[calc(100%-1.5rem)] h-[calc(100%-1.5rem)] object-cover rounded-[1.25rem] group-hover:scale-105 transition-transform duration-700" />
            </div>
          )}

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col gap-6 text-sm">
            <h3 className="font-medium text-sm text-slate-400 uppercase tracking-widest">Contato</h3>

            <div className="flex flex-col gap-5">
              {influencer.redes.instagram && (
                <a href={influencer.redes.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#FF9A86] group-hover:text-white transition-colors duration-300">
                    <InstagramIcon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400">Instagram</span>
                    <span className="text-slate-700 font-medium group-hover:text-[#FF9A86] transition-colors">{influencer.handles.instagram || "Instagram"}</span>
                  </div>
                </a>
              )}

              {influencer.redes.tiktok && (
                <a href={influencer.redes.tiktok} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
                    <TikTokIcon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400">TikTok</span>
                    <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors">{influencer.handles.tiktok || "TikTok"}</span>
                  </div>
                </a>
              )}

              {(influencer.contato.email || influencer.contato.whatsapp) && (
                <div className="w-full h-px bg-slate-100 my-1" />
              )}

              {influencer.contato.email && (
                <a href={emailUrl} className="flex items-center gap-4 group">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#FFB399] group-hover:text-white transition-colors duration-300">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-slate-400">Email</span>
                    <span className="text-xs text-slate-700 font-medium break-all">{influencer.contato.email}</span>
                  </div>
                </a>
              )}

              {influencer.contato.whatsapp && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#86efac] group-hover:text-white transition-colors duration-300">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400">WhatsApp</span>
                    <span className="text-slate-700 font-medium">{fmtWhatsapp(influencer.contato.whatsapp)}</span>
                  </div>
                </a>
              )}
            </div>
          </div>
        </motion.div>

        {/* Bio */}
        <motion.div variants={fadeUp} className="lg:col-span-9 bg-white rounded-3xl p-10 lg:p-14 shadow-sm border border-slate-100 flex flex-col justify-center relative overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-bl from-[#FF9A86]/20 to-transparent rounded-full blur-3xl"
          />
          <div className="relative z-10">
            <h2 className="font-display italic font-light text-3xl md:text-4xl lg:text-5xl text-slate-800 mb-6 leading-tight">
              Muito prazer, sou a <span className="text-[#FF9A86]">{primeiroNome}!</span>
            </h2>
            <div className="text-base md:text-lg text-slate-500 leading-relaxed max-w-4xl font-light space-y-4">
              {bioParagrafos.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Instagram */}
        {m && igFollowers > 0 && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp}
            className="lg:col-span-6 bg-[#FFF3F0] rounded-3xl p-10 shadow-sm border border-[#FFE4DE] relative group overflow-hidden"
          >
            <div className="absolute -right-10 -top-10 opacity-[0.06] group-hover:opacity-[0.09] transition-opacity duration-500">
              <InstagramIcon className="w-64 h-64 text-[#FF9A86]" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-[#FF9A86]/10 flex items-center justify-center text-[#FF9A86]">
                  <InstagramIcon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-medium text-slate-800 tracking-wide">Instagram</h2>
              </div>

              <div className="mb-10">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-medium mb-3">Seguidores</p>
                <p className="font-display italic font-light text-5xl md:text-6xl text-slate-800">
                  <BigNumber n={igFollowers} suffixClassName="not-italic font-sans text-3xl text-slate-400" />
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                <div>
                  <p className="text-xs text-slate-400 mb-2">Alcance (30d)</p>
                  <p className="text-2xl font-light text-slate-700">
                    {fmtCompact(m.instagram_reach ?? 0).value}
                    <span className="text-lg text-slate-400">{fmtCompact(m.instagram_reach ?? 0).suffix}</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-2">Impressões</p>
                  <p className="text-2xl font-medium text-[#FF9A86]">
                    {fmtCompact(m.instagram_impressions ?? 0).value}
                    <span className="text-lg">{fmtCompact(m.instagram_impressions ?? 0).suffix}</span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TikTok */}
        {m && tkFollowers > 0 && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp}
            className="lg:col-span-6 bg-[#F4F4F6] rounded-3xl p-10 shadow-sm border border-[#E8E8EC] relative group overflow-hidden"
          >
            <div className="absolute -right-10 -top-10 opacity-[0.05] group-hover:opacity-[0.08] transition-opacity duration-500">
              <TikTokIcon className="w-64 h-64 text-slate-500" />
            </div>
            <div className="absolute right-0 bottom-0 w-48 h-48 bg-gradient-to-tl from-[#FF9A86]/8 to-transparent rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-slate-200/70 flex items-center justify-center text-slate-600">
                  <TikTokIcon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-medium text-slate-800 tracking-wide">TikTok</h2>
              </div>

              <div className="mb-10">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-medium mb-3">Seguidores</p>
                <p className="font-display italic font-light text-5xl md:text-6xl text-slate-800">
                  <BigNumber n={tkFollowers} suffixClassName="not-italic font-sans text-3xl text-slate-400" />
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200">
                <div>
                  <p className="text-xs text-slate-400 mb-2">Views médias</p>
                  <p className="text-2xl font-light text-slate-700">
                    {fmtCompact(m.tiktok_views ?? 0).value}
                    <span className="text-lg text-slate-400">{fmtCompact(m.tiktok_views ?? 0).suffix}</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-2">Curtidas</p>
                  <p className="text-2xl font-medium text-[#FF9A86]">
                    {fmtCompact(m.tiktok_likes ?? 0).value}
                    <span className="text-lg">{fmtCompact(m.tiktok_likes ?? 0).suffix}</span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Performance & Engajamento */}
        {showPerformance && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp}
            className="lg:col-span-12 bg-white rounded-3xl p-10 md:p-14 shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="mb-10">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-medium mb-3">Últimos 30 dias</p>
              <h2 className="font-display italic font-light text-3xl text-slate-800">
                Performance <span className="text-[#FF9A86]">& Engajamento</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:divide-x divide-slate-50">
              {showIgPerf && (
                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <InstagramIcon className="w-4 h-4 text-[#FF9A86]" />
                    <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">Instagram</span>
                  </div>

                  {igEng > 0 && (
                    <div className="flex items-end gap-4">
                      <p className="font-display italic font-light text-6xl text-slate-800"><AnimatedNumber value={igEng} decimals={1} /></p>
                      <div className="mb-3">
                        <p className="text-2xl font-light text-slate-400">%</p>
                        <p className="text-xs text-slate-400 mt-0.5">taxa de engajamento</p>
                      </div>
                    </div>
                  )}

                  {igPerf.length > 0 && (
                    <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-50">
                      {igPerf.map((s) => (
                        <div key={s.label}>
                          <p className="text-xs text-slate-400 mb-2">{s.label}</p>
                          <p className="text-xl font-light text-slate-700">
                            {fmtCompact(s.n).value}<span className="text-sm text-slate-400">{fmtCompact(s.n).suffix}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {showTkPerf && (
                <div className="space-y-8 lg:pl-10">
                  <div className="flex items-center gap-3">
                    <TikTokIcon className="w-4 h-4 text-slate-700" />
                    <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">TikTok</span>
                  </div>

                  {tkEng > 0 && (
                    <div className="flex items-end gap-4">
                      <p className="font-display italic font-light text-6xl text-slate-800"><AnimatedNumber value={tkEng} decimals={1} /></p>
                      <div className="mb-3">
                        <p className="text-2xl font-light text-slate-400">%</p>
                        <p className="text-xs text-slate-400 mt-0.5">taxa de engajamento</p>
                      </div>
                    </div>
                  )}

                  {tkPerf.length > 0 && (
                    <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-50">
                      {tkPerf.map((s) => (
                        <div key={s.label}>
                          <p className="text-xs text-slate-400 mb-2">{s.label}</p>
                          <p className="text-xl font-light text-slate-700">
                            {fmtCompact(s.n).value}<span className="text-sm text-slate-400">{fmtCompact(s.n).suffix}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Fotos Grid com Parallax */}
        {influencer.moodboard.length >= 3 && (
          <motion.div
            ref={containerRef}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="lg:col-span-12 py-12 md:py-24 relative"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <motion.div style={{ y: y1 }} variants={fadeUp} className="relative aspect-square md:aspect-[4/5] bg-slate-100 md:mt-8 rounded-[2rem] overflow-hidden shadow-md group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={influencer.moodboard[0]} alt="Foto de conteúdo 1" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </motion.div>
              <motion.div style={{ y: y2 }} variants={fadeUp} className="relative aspect-square bg-slate-100 rounded-[2rem] overflow-hidden shadow-md group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={influencer.moodboard[1]} alt="Foto de conteúdo 2" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </motion.div>
              <motion.div style={{ y: y3 }} variants={fadeUp} className="relative aspect-square md:aspect-[4/5] bg-slate-100 md:mt-16 rounded-[2rem] overflow-hidden shadow-md group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={influencer.moodboard[2]} alt="Foto de conteúdo 3" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Demografia e Público-Alvo */}
        {showDemografia && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp}
            className="lg:col-span-12 bg-white rounded-3xl p-10 md:p-16 shadow-sm border border-slate-100 mt-4 relative overflow-hidden"
          >
            <div className="flex flex-col lg:flex-row gap-16 lg:gap-16">
              <div className="lg:w-1/4 flex flex-col justify-center">
                <h2 className="font-display italic font-light text-3xl text-slate-800 mb-6">
                  Público <span className="text-[#FF9A86]">Alvo</span>
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed">{influencer.publicoAlvo}</p>
              </div>

              <div className="lg:w-3/4 grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-10">
                {/* Gênero */}
                {influencer.audienciaGenero.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 mb-8 flex items-center gap-3 uppercase tracking-widest">
                      <Users className="w-4 h-4 text-[#FF9A86]" /> Gênero
                    </h3>
                    <div className="space-y-6">
                      {influencer.audienciaGenero.map((g, i) => (
                        <div key={g.label}>
                          <div className="flex justify-between text-xs mb-3">
                            <span className="font-medium text-slate-600">{g.label}</span>
                            <span className="font-semibold text-slate-800">{g.pct}%</span>
                          </div>
                          <div className="w-full bg-slate-50 rounded-full h-2.5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${g.pct}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1.2, delay: 0.2 + i * 0.2, ease: "easeOut" }}
                              className="h-2.5 rounded-full"
                              style={{ background: i === 0 ? "#FF9A86" : "#cbd5e1" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Faixa Etária */}
                {influencer.audienciaIdade.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 mb-8 flex items-center gap-3 uppercase tracking-widest">
                      <Users className="w-4 h-4 text-[#FF9A86]" /> Faixa Etária
                    </h3>
                    <div className="space-y-6">
                      {influencer.audienciaIdade.map((f, i) => (
                        <div key={f.faixa}>
                          <div className="flex justify-between text-xs mb-3">
                            <span className="font-medium text-slate-600">{f.faixa}</span>
                            <span className="font-semibold text-slate-800">{f.pct}%</span>
                          </div>
                          <div className="w-full bg-slate-50 rounded-full h-2.5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${f.pct}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, delay: 0.2 + i * 0.2, ease: "easeOut" }}
                              className="h-2.5 rounded-full"
                              style={{ background: idadeColors[i % idadeColors.length] }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Localização */}
                {influencer.topEstados.length > 0 && (
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                  >
                    <h3 className="text-xs font-semibold text-slate-400 mb-8 flex items-center gap-3 uppercase tracking-widest">
                      <MapPin className="w-4 h-4 text-[#FF9A86]" /> Localização
                    </h3>
                    <div className="space-y-5">
                      {influencer.topEstados.map((estado, i) => (
                        <React.Fragment key={estado.uf}>
                          {i > 0 && <div className="w-full h-px bg-slate-50" />}
                          <motion.div variants={fadeUp} className="flex items-center gap-5">
                            <div className="font-medium text-xs tracking-widest" style={{ color: localColors[i % localColors.length] }}>
                              {String(i + 1).padStart(2, "0")}
                            </div>
                            <div className="flex-1"><p className="font-medium text-sm text-slate-700">{estado.uf}</p></div>
                            <div className="text-xs font-semibold text-slate-500">{estado.pct}%</div>
                          </motion.div>
                        </React.Fragment>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Formatos & Entregas */}
        {influencer.formatos.length > 0 && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="lg:col-span-12 mt-4"
          >
            <motion.div variants={fadeUp} className="mb-10">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-medium mb-3">O que posso entregar</p>
              <h2 className="font-display italic font-light text-3xl text-slate-800">
                Formatos <span className="text-[#FF9A86]">& Entregas</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {influencer.formatos.map((f, i) => {
                const Icon = FORMAT_ICONS[i % FORMAT_ICONS.length];
                return (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm group hover:border-[#FF9A86]/30 hover:shadow-md transition-all duration-300 flex flex-col gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#FF9A86]/10 group-hover:text-[#FF9A86] transition-colors duration-300">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm mb-1.5">{f.nome}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{f.descricao}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Cases / Resultados */}
        {influencer.cases.length > 0 && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="lg:col-span-12 mt-4"
          >
            <motion.div variants={fadeUp} className="mb-10">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-medium mb-3">Resultados que entreguei</p>
              <h2 className="font-display italic font-light text-3xl text-slate-800">
                Casos de <span className="text-[#FF9A86]">Sucesso</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              {influencer.cases.map((c, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col gap-4 group hover:border-[#FF9A86]/30 hover:shadow-md transition-all duration-300"
                >
                  <div className="text-[#FF9A86] font-medium text-xs tracking-widest uppercase">{c.marca}</div>
                  <p className="font-display italic font-light text-2xl text-slate-800 leading-snug">{c.resultado}</p>
                  <p className="text-xs text-slate-400 mt-auto">{c.periodo}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA Final */}
        {(influencer.contato.email || influencer.contato.whatsapp) && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp}
            className="lg:col-span-12 bg-[#FF9A86] rounded-3xl p-12 md:p-16 mt-4 relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute left-1/2 bottom-0 w-60 h-60 bg-[#FF7A60]/30 rounded-full blur-[60px] pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-10">
              <div>
                <p className="text-white/70 text-xs uppercase tracking-widest font-medium mb-4">Vamos trabalhar juntos?</p>
                <h2 className="font-display italic font-light text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
                  Pronta para criar<br />algo incrível.
                </h2>
              </div>

              <div className="flex flex-col gap-5 lg:text-right">
                {influencer.contato.email && (
                  <a href={emailUrl} className="flex items-center gap-4 group lg:flex-row-reverse">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-[#FF9A86] transition-colors duration-300">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-white font-medium">{influencer.contato.email}</span>
                  </a>
                )}
                {influencer.contato.whatsapp && (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group lg:flex-row-reverse">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-[#FF9A86] transition-colors duration-300">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className="text-white font-medium">{fmtWhatsapp(influencer.contato.whatsapp)}</span>
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <div className="lg:col-span-12 h-8" />
      </motion.div>
    </div>
  );
}
