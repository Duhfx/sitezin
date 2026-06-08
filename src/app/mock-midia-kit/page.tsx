"use client";

import { Camera, Video, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function MockMidiaKitPage() {
  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <main className="min-h-screen bg-[#dce6e1] py-12 px-4 selection:bg-[#4F796B] selection:text-white flex flex-col items-center gap-12 text-[#2C3E38] pb-32">
      
      {/* ─── FLOATING CTA (Sticky Button) ─────────────────────────────────────── */}
      <motion.a 
        href="#contato"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="fixed bottom-8 right-8 z-50 bg-[#2C3E38] text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 hover:scale-105 hover:bg-[#1f2b27] transition-all"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="font-bold text-sm tracking-wide">Falar no WhatsApp</span>
      </motion.a>

      {/* ─── SINGLE CONTINUOUS EDITORIAL PAGE ─────────────────────────────────────── */}
      <div className="w-full max-w-4xl bg-[#fbfdfc] shadow-2xl p-6 md:p-16 relative overflow-hidden rounded-2xl flex flex-col gap-16 md:gap-24">
        {/* Subtle noise/texture overlay for the paper effect */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-multiply" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}></div>

        <motion.div 
          initial="hidden" animate="visible" variants={fadeUp}
          className="grid md:grid-cols-12 gap-8 md:gap-12 relative z-10"
        >
          
          {/* Left Column */}
          <div className="md:col-span-5 space-y-10 md:space-y-12">
            {/* Hero Image */}
            <div className="aspect-square md:aspect-[3/4] max-w-[280px] md:max-w-none mx-auto bg-[#EAF2EF] relative overflow-hidden rounded-t-full shadow-inner">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop" 
                alt="Portrait" 
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>

            {/* Demographics */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp}>
              <h3 className="text-xs tracking-[0.2em] font-bold uppercase mb-6 border-b border-[#EAF2EF] pb-2 text-[#4F796B]">
                Estatísticas & Demografia
              </h3>
              
              <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-center">
                <div>
                  <p className="text-3xl font-serif text-[#2C3E38]">18-34</p>
                  <p className="text-[10px] uppercase tracking-wider text-[#6CA592] mt-1 font-medium">Idade Principal</p>
                </div>
                <div>
                  <p className="text-3xl font-serif text-[#2C3E38]">85%</p>
                  <p className="text-[10px] uppercase tracking-wider text-[#6CA592] mt-1 font-medium">Mulheres</p>
                </div>
              </div>

              <div className="mt-8 bg-[#EAF2EF]/50 p-5 rounded-lg border border-[#EAF2EF]">
                <p className="text-[10px] uppercase tracking-wider text-[#4F796B] mb-3 text-center font-bold">Top Estados</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-serif">São Paulo</span>
                    <span className="text-sm font-serif font-bold text-[#4F796B]">40%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-serif">Rio de Janeiro</span>
                    <span className="text-sm font-serif font-bold text-[#4F796B]">20%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-serif">Minas Gerais</span>
                    <span className="text-sm font-serif font-bold text-[#4F796B]">15%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="md:col-span-7 flex flex-col text-center md:text-left">
            {/* About Me */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-12">
              <h1 className="text-4xl md:text-6xl font-serif tracking-tight mb-3 md:mb-4 text-[#2C3E38]">Sobre Mim</h1>
              <p className="text-xs tracking-[0.2em] font-bold uppercase mb-6 text-[#6CA592]">Criadora & Lifestyle</p>
              
              <div className="space-y-4 text-sm leading-relaxed text-[#4F796B]">
                <p>
                  Sou criadora de conteúdo há 4 anos com foco em Lifestyle e Beleza. Minha abordagem é sempre de "amiga para amiga", o que me garante uma das maiores taxas de retenção e cliques do meu nicho.
                </p>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                </p>
              </div>
            </motion.div>

            {/* Social Media */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} className="mt-auto">
              <h3 className="text-xs tracking-[0.2em] font-bold uppercase mb-8 border-b border-[#EAF2EF] pb-2 text-[#4F796B]">
                Redes Sociais
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 text-center mb-10">
                <div className="bg-[#EAF2EF] p-6 rounded-2xl flex flex-col items-center justify-center">
                  <p className="text-4xl font-serif mb-2 text-[#2C3E38]">850K</p>
                  <p className="text-[10px] tracking-widest uppercase text-[#4F796B] font-bold flex items-center justify-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" /> Instagram
                  </p>
                </div>
                <div className="bg-[#EAF2EF] p-6 rounded-2xl flex flex-col items-center justify-center">
                  <p className="text-4xl font-serif mb-2 text-[#2C3E38]">1.2M</p>
                  <p className="text-[10px] tracking-widest uppercase text-[#4F796B] font-bold flex items-center justify-center gap-1.5">
                    <Video className="w-3.5 h-3.5" /> TikTok
                  </p>
                </div>
              </div>

              {/* Pill Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 md:gap-4">
                {[
                  { value: "8.5%", label: "Engajamento IG" },
                  { value: "2.1M", label: "Alcance IG (30d)" },
                  { value: "450K", label: "Views Médias TK" },
                  { value: "14%", label: "Engajamento TK" },
                ].map((stat, i) => (
                  <div key={i} className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full border border-[#4F796B]/20 bg-white shadow-sm flex items-center justify-center mb-3 text-[#4F796B] hover:bg-[#EAF2EF] transition-colors">
                      <span className="font-serif text-lg">{stat.value}</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider text-[#6CA592] max-w-[60px] leading-tight font-medium">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

        </motion.div>

        {/* ─── Services, Moodboard & Contact ─────────────────────────────── */}
        <div className="relative z-10 flex flex-col">
          
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif tracking-tight mb-8 text-[#2C3E38]">Serviços Disponíveis</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-[#4F796B] max-w-2xl mx-auto text-left bg-[#EAF2EF]/50 p-8 rounded-2xl border border-[#EAF2EF]">
              <ul className="space-y-3 list-disc list-inside marker:text-[#6CA592]">
                <li>Sequência de Stories (3x)</li>
                <li>Publipost no Feed</li>
                <li>Reels Dedicado</li>
              </ul>
              <ul className="space-y-3 list-disc list-inside marker:text-[#6CA592]">
                <li>TikTok Integrado</li>
                <li>TikTok Dedicado</li>
                <li>UGC (User Generated Content)</li>
              </ul>
            </div>
          </motion.div>

          {/* Minimalist Image Grid / Moodboard */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
            <div className="aspect-square md:aspect-[4/5] bg-[#EAF2EF] md:mt-8 rounded-3xl md:rounded-tl-3xl md:rounded-br-3xl overflow-hidden shadow-md">
              <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="aspect-square bg-[#EAF2EF] rounded-3xl md:rounded-tr-3xl md:rounded-bl-3xl overflow-hidden shadow-md">
              <img src="https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="aspect-square md:aspect-[4/5] bg-[#EAF2EF] md:mt-16 rounded-3xl md:rounded-tl-3xl md:rounded-br-3xl overflow-hidden shadow-md">
              <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
          </motion.div>

          <motion.div id="contato" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} className="mt-auto text-center border-t border-[#EAF2EF] pt-16">
            <h2 className="text-4xl font-serif tracking-tight mb-8 text-[#2C3E38]">Contato</h2>
            <div className="flex flex-wrap justify-center gap-6 text-xs tracking-widest uppercase text-[#4F796B] font-bold">
              <a href="#" className="hover:text-[#2C3E38] transition-colors bg-[#EAF2EF] px-6 py-3 rounded-full flex items-center gap-2"><Camera className="w-4 h-4" /> Instagram</a>
              <a href="#" className="hover:text-[#2C3E38] transition-colors bg-[#EAF2EF] px-6 py-3 rounded-full flex items-center gap-2"><Video className="w-4 h-4" /> TikTok</a>
              <a href="#" className="hover:text-[#2C3E38] transition-colors bg-[#EAF2EF] px-6 py-3 rounded-full">E-mail Comercial</a>
              <a href="#" className="hover:text-[#2C3E38] transition-colors bg-[#EAF2EF] px-6 py-3 rounded-full">WhatsApp Direto</a>
            </div>
          </motion.div>

        </div>
      </div>

    </main>
  );
}
