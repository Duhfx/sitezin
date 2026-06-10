"use client";

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { MapPin, Users, Mail, Phone, Film, LayoutGrid, Layers, Play, Sparkles, Radio } from 'lucide-react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useInView } from 'framer-motion';

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: 1800, bounce: 0 });
  const [display, setDisplay] = useState(value.toFixed(decimals));

  useEffect(() => {
    if (isInView) motionValue.set(value);
  }, [isInView, motionValue, value]);

  useEffect(() => {
    return springValue.on("change", (v) => setDisplay(v.toFixed(decimals)));
  }, [springValue, decimals]);

  return <span ref={ref}>{display}</span>;
}

const FORMATS = [
  { icon: Film,       label: "Reels",    desc: "Vídeos autorais de 15–90s com roteiro e edição" },
  { icon: LayoutGrid, label: "Carrossel", desc: "Posts de múltiplos slides com alto índice de salvamento" },
  { icon: Layers,     label: "Stories",  desc: "Sequência imersiva com enquetes e links diretos" },
  { icon: Play,       label: "TikTok",   desc: "Vídeos nativos verticais otimizados para o algoritmo" },
  { icon: Sparkles,   label: "UGC",      desc: "Conteúdo criado para uso nas redes da própria marca" },
  { icon: Radio,      label: "Live",     desc: "Transmissão ao vivo com engajamento em tempo real" },
];

export default function MediaKitMockup() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const y1 = useTransform(smoothProgress, [0, 1], [60, -60]);
  const y2 = useTransform(smoothProgress, [0, 1], [-20, 20]);
  const y3 = useTransform(smoothProgress, [0, 1], [120, -120]);

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
            Mídia Kit 2026
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="font-display italic font-light text-6xl md:text-8xl lg:text-9xl text-slate-800 leading-none mb-6"
          >
            Aline
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-slate-500 text-base md:text-lg font-light mb-16 flex items-center gap-3 flex-wrap"
          >
            <span>Lifestyle</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span>Gastronomia</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span>Viagens</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span>Moda</span>
            <span className="ml-4 flex items-center gap-1.5 text-slate-400">
              <MapPin className="w-3.5 h-3.5" /> Blumenau, SC · São Paulo, SP
            </span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-10 md:gap-20"
          >
            <div>
              <p className="font-display italic font-light text-4xl md:text-5xl text-slate-800">
                <AnimatedNumber value={1.2} decimals={1} /><span className="not-italic font-sans text-2xl text-slate-400">M</span>
              </p>
              <p className="text-xs text-slate-400 uppercase tracking-widest mt-1.5">Instagram</p>
            </div>
            <div>
              <p className="font-display italic font-light text-4xl md:text-5xl text-slate-800">
                <AnimatedNumber value={3.5} decimals={1} /><span className="not-italic font-sans text-2xl text-slate-400">M</span>
              </p>
              <p className="text-xs text-slate-400 uppercase tracking-widest mt-1.5">TikTok</p>
            </div>
            <div>
              <p className="font-display italic font-light text-4xl md:text-5xl text-[#FF9A86]">
                <AnimatedNumber value={10} decimals={0} /><span className="not-italic font-sans text-2xl">M+</span>
              </p>
              <p className="text-xs text-slate-400 uppercase tracking-widest mt-1.5">Alcance combinado</p>
            </div>
          </motion.div>
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
          <div className="bg-white rounded-3xl p-3 aspect-square shadow-sm border border-slate-100 relative group overflow-hidden">
            <Image src="/perfil.jpeg" alt="Profile" fill className="object-cover rounded-[1.25rem] group-hover:scale-105 transition-transform duration-700" />
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col gap-6 text-sm">
            <h3 className="font-medium text-sm text-slate-400 uppercase tracking-widest">Contato</h3>

            <div className="flex flex-col gap-5">
              <a href="#" className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#FF9A86] group-hover:text-white transition-colors duration-300">
                  <InstagramIcon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">Instagram</span>
                  <span className="text-slate-700 font-medium group-hover:text-[#FF9A86] transition-colors">@aline</span>
                </div>
              </a>

              <a href="#" className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
                  <TikTokIcon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">TikTok</span>
                  <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors">@aline.tiktok</span>
                </div>
              </a>

              <div className="w-full h-px bg-slate-100 my-1" />

              <a href="mailto:contato@influencer.com" className="flex items-center gap-4 group">
                <div className="w-10 h-10 shrink-0 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#FFB399] group-hover:text-white transition-colors duration-300">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-slate-400">Email</span>
                  <span className="text-xs text-slate-700 font-medium">contato@influencer.com</span>
                </div>
              </a>

              <a href="#" className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#86efac] group-hover:text-white transition-colors duration-300">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">WhatsApp</span>
                  <span className="text-slate-700 font-medium">+55 11 99999-9999</span>
                </div>
              </a>
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
              Muito prazer, sou a <span className="text-[#FF9A86]">Aline!</span>
            </h2>
            <div className="text-base md:text-lg text-slate-500 leading-relaxed max-w-4xl font-light space-y-4">
              <p>
                Sou uma paulistana que escolheu Blumenau como lar desde 2017. Apaixonada por descobrir novos lugares, experimentar a gastronomia local e viver novas experiências, compartilho tudo de forma autêntica, leve e com uma pitada de humor.
              </p>
              <p>
                Minha trajetória profissional como Product Owner, com foco em experiência do usuário e storytelling, me ajudou a desenvolver um olhar estratégico para criar conteúdos que conectam pessoas por meio de histórias reais.
              </p>
              <p>
                Hoje compartilho viagens, gastronomia, compras e o meu dia a dia, mostrando tanto as descobertas quanto os perrengues que fazem parte da jornada. Meu objetivo é inspirar pessoas a explorarem novos lugares e experiências através de conteúdos genuínos, divertidos e cheios de personalidade.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Instagram — simplificado */}
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
                <AnimatedNumber value={1.2} decimals={1} /><span className="not-italic font-sans text-3xl text-slate-400">M</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-50">
              <div>
                <p className="text-xs text-slate-400 mb-2">Views médias</p>
                <p className="text-2xl font-light text-slate-700">450<span className="text-lg text-slate-400">K</span></p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2">Alcance total</p>
                <p className="text-2xl font-medium text-[#FF9A86]">2.5<span className="text-lg">M</span></p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* TikTok — dark */}
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
                <AnimatedNumber value={3.5} decimals={1} /><span className="not-italic font-sans text-3xl text-slate-400">M</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200">
              <div>
                <p className="text-xs text-slate-400 mb-2">Views médias</p>
                <p className="text-2xl font-light text-slate-700">1.2<span className="text-lg text-slate-400">M</span></p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2">Alcance total</p>
                <p className="text-2xl font-medium text-[#FF9A86]">8.5<span className="text-lg">M</span></p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Performance & Engajamento */}
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
            {/* Instagram */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <InstagramIcon className="w-4 h-4 text-[#FF9A86]" />
                <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">Instagram</span>
              </div>

              <div className="flex items-end gap-4">
                <p className="font-display italic font-light text-6xl text-slate-800"><AnimatedNumber value={7.1} decimals={1} /></p>
                <div className="mb-3">
                  <p className="text-2xl font-light text-slate-400">%</p>
                  <p className="text-xs text-slate-400 mt-0.5">taxa de engajamento</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-50">
                <div>
                  <p className="text-xs text-slate-400 mb-2">Interações</p>
                  <p className="text-xl font-light text-slate-700">85<span className="text-sm text-slate-400">K</span></p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-2">Compartilhamentos</p>
                  <p className="text-xl font-light text-slate-700">12<span className="text-sm text-slate-400">K</span></p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-2">Salvamentos</p>
                  <p className="text-xl font-light text-slate-700">25<span className="text-sm text-slate-400">K</span></p>
                </div>
              </div>
            </div>

            {/* TikTok */}
            <div className="space-y-8 lg:pl-10">
              <div className="flex items-center gap-3">
                <TikTokIcon className="w-4 h-4 text-slate-700" />
                <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">TikTok</span>
              </div>

              <div className="flex items-end gap-4">
                <p className="font-display italic font-light text-6xl text-slate-800"><AnimatedNumber value={9.1} decimals={1} /></p>
                <div className="mb-3">
                  <p className="text-2xl font-light text-slate-400">%</p>
                  <p className="text-xs text-slate-400 mt-0.5">taxa de engajamento</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-50">
                <div>
                  <p className="text-xs text-slate-400 mb-2">Interações</p>
                  <p className="text-xl font-light text-slate-700">320<span className="text-sm text-slate-400">K</span></p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-2">Compartilhamentos</p>
                  <p className="text-xl font-light text-slate-700">45<span className="text-sm text-slate-400">K</span></p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-2">Salvamentos</p>
                  <p className="text-xl font-light text-slate-700">80<span className="text-sm text-slate-400">K</span></p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Fotos Grid com Parallax */}
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
              <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop" alt="Foto 1" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            </motion.div>
            <motion.div style={{ y: y2 }} variants={fadeUp} className="relative aspect-square bg-slate-100 rounded-[2rem] overflow-hidden shadow-md group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=600&auto=format&fit=crop" alt="Foto 2" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            </motion.div>
            <motion.div style={{ y: y3 }} variants={fadeUp} className="relative aspect-square md:aspect-[4/5] bg-slate-100 md:mt-16 rounded-[2rem] overflow-hidden shadow-md group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop" alt="Foto 3" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            </motion.div>
          </div>
        </motion.div>

        {/* Demografia e Público-Alvo */}
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
              <p className="text-slate-500 text-sm leading-relaxed">
                Um perfil engajado e fiel, composto majoritariamente por pessoas que buscam inspiração diária em lifestyle, moda e dicas de bem-estar.
              </p>
            </div>

            <div className="lg:w-3/4 grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-10">
              {/* Gênero */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 mb-8 flex items-center gap-3 uppercase tracking-widest">
                  <Users className="w-4 h-4 text-[#FF9A86]" /> Gênero
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-xs mb-3">
                      <span className="font-medium text-slate-600">Feminino</span>
                      <span className="font-semibold text-slate-800">78%</span>
                    </div>
                    <div className="w-full bg-slate-50 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: "78%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
                        className="bg-[#FF9A86] h-2.5 rounded-full"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-3">
                      <span className="font-medium text-slate-600">Masculino</span>
                      <span className="font-semibold text-slate-800">22%</span>
                    </div>
                    <div className="w-full bg-slate-50 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: "22%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
                        className="bg-slate-300 h-2.5 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Faixa Etária */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 mb-8 flex items-center gap-3 uppercase tracking-widest">
                  <Users className="w-4 h-4 text-[#FF9A86]" /> Faixa Etária
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-xs mb-3">
                      <span className="font-medium text-slate-600">18–24 anos</span>
                      <span className="font-semibold text-slate-800">45%</span>
                    </div>
                    <div className="w-full bg-slate-50 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: "45%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                        className="bg-[#FF9A86] h-2.5 rounded-full"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-3">
                      <span className="font-medium text-slate-600">25–34 anos</span>
                      <span className="font-semibold text-slate-800">30%</span>
                    </div>
                    <div className="w-full bg-slate-50 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: "30%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                        className="bg-[#FFB399] h-2.5 rounded-full"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-3">
                      <span className="font-medium text-slate-600">13–17 anos</span>
                      <span className="font-semibold text-slate-800">15%</span>
                    </div>
                    <div className="w-full bg-slate-50 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: "15%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                        className="bg-[#FFD6A6] h-2.5 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Localização */}
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
                  <motion.div variants={fadeUp} className="flex items-center gap-5">
                    <div className="text-[#FF9A86] font-medium text-xs tracking-widest">01</div>
                    <div className="flex-1"><p className="font-medium text-sm text-slate-700">São Paulo</p></div>
                    <div className="text-xs font-semibold text-slate-500">35%</div>
                  </motion.div>
                  <div className="w-full h-px bg-slate-50" />
                  <motion.div variants={fadeUp} className="flex items-center gap-5">
                    <div className="text-[#FFB399] font-medium text-xs tracking-widest">02</div>
                    <div className="flex-1"><p className="font-medium text-sm text-slate-700">Rio de Janeiro</p></div>
                    <div className="text-xs font-semibold text-slate-500">20%</div>
                  </motion.div>
                  <div className="w-full h-px bg-slate-50" />
                  <motion.div variants={fadeUp} className="flex items-center gap-5">
                    <div className="text-[#FFD6A6] font-medium text-xs tracking-widest">03</div>
                    <div className="flex-1"><p className="font-medium text-sm text-slate-700">Minas Gerais</p></div>
                    <div className="text-xs font-semibold text-slate-500">12%</div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Formatos & Entregas */}
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
            {FORMATS.map(({ icon: Icon, label, desc }) => (
              <motion.div
                key={label}
                variants={fadeUp}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm group hover:border-[#FF9A86]/30 hover:shadow-md transition-all duration-300 flex flex-col gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#FF9A86]/10 group-hover:text-[#FF9A86] transition-colors duration-300">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-800 text-sm mb-1.5">{label}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Final */}
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
              <a href="mailto:contato@influencer.com" className="flex items-center gap-4 group lg:flex-row-reverse">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-[#FF9A86] transition-colors duration-300">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-white font-medium">contato@influencer.com</span>
              </a>
              <a href="#" className="flex items-center gap-4 group lg:flex-row-reverse">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-[#FF9A86] transition-colors duration-300">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-white font-medium">+55 11 99999-9999</span>
              </a>
            </div>
          </div>
        </motion.div>

        <div className="lg:col-span-12 h-8" />
      </motion.div>
    </div>
  );
}
