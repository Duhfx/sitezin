"use client";

import { Camera, Video, MessageCircle, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

type Influencer = any;
type Metrics = any[];

function fmtNum(n: number) {
  if (n == null) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("pt-BR");
}

function fmtMonth(dateStr: string) {
  const [year, month] = dateStr.split("-");
  return new Date(Number(year), Number(month) - 1)
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "");
}

// Textura de papel — SVG de ruído inline (sem dependência externa).
const NOISE_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// ─── Gráfico de crescimento (sparkline SVG) ───────────────────────────────────
function GrowthChart({ values }: { values: number[] }) {
  if (values.length < 2) return null;

  const w = 100;
  const h = 36;
  const pad = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return [x, y] as const;
  });

  const line = pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${h - pad} L${pts[0][0].toFixed(1)},${h - pad} Z`;
  const [lastX, lastY] = pts[pts.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="w-full h-12"
      aria-hidden
    >
      <defs>
        <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#growthFill)" />
      <path
        d={line}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX} cy={lastY} r="2.2" fill="hsl(var(--primary))" />
    </svg>
  );
}

export default function MediaKitPresentation({
  influencer,
  metricas,
}: {
  influencer: Influencer;
  metricas: Metrics;
}) {
  const ultimaMetrica = metricas.length > 0 ? metricas[metricas.length - 1] : null;

  const igSeries = metricas.map((m) => m.instagram_followers ?? 0);
  const igGrowthPct =
    igSeries.length >= 2 && igSeries[0] > 0
      ? ((igSeries[igSeries.length - 1] - igSeries[0]) / igSeries[0]) * 100
      : null;
  const periodoLabel =
    metricas.length >= 2
      ? `${fmtMonth(metricas[0].reference_month)}–${fmtMonth(metricas[metricas.length - 1].reference_month)}`
      : null;

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  const whatsappUrl = `https://wa.me/${influencer.contato.whatsapp.replace(/\D/g, "")}`;

  return (
    <main className="min-h-screen bg-background py-12 px-4 selection:bg-primary selection:text-white flex flex-col items-center gap-12 text-foreground pb-32">

      {/* ─── FLOATING CTA (Sticky Button) ─────────────────────────────────────── */}
      <motion.a
        href="#contato"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="fixed bottom-8 right-8 z-50 bg-primary text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 hover:scale-105 hover:bg-primary/90 transition-all"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="font-bold text-sm tracking-wide">Falar no WhatsApp</span>
      </motion.a>

      {/* ─── SINGLE CONTINUOUS EDITORIAL PAGE ─────────────────────────────────────── */}
      <div className="w-full max-w-4xl bg-card shadow-2xl p-6 md:p-16 relative overflow-hidden rounded-2xl flex flex-col gap-16 md:gap-24">
        {/* Textura de papel sutil */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none mix-blend-multiply"
          style={{ backgroundImage: NOISE_BG }}
        />

        <motion.div
          initial="hidden" animate="visible" variants={fadeUp}
          className="grid md:grid-cols-12 gap-8 md:gap-12 relative z-10"
        >

          {/* Left Column */}
          {/* Hero Image — coluna esquerda, linha 1 */}
          <div className="md:col-span-5 md:col-start-1 md:row-start-1">
            <div className="aspect-square md:aspect-[3/4] max-w-[280px] md:max-w-none mx-auto bg-muted relative overflow-hidden rounded-t-full shadow-inner">
              <img
                src={influencer.foto}
                alt={influencer.nome}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>

          {/* About Me — coluna direita, linha 1 */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="md:col-span-7 md:col-start-6 md:row-start-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4 justify-center md:justify-start">
              <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight text-foreground">{influencer.nome}</h1>
            </div>
            <p className="text-xs tracking-[0.2em] font-bold uppercase mb-6 text-primary">{influencer.nicho}</p>

            <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>{influencer.biografia}</p>
            </div>
          </motion.div>

          {/* Demographics — coluna esquerda, linha 2 */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} className="md:col-span-5 md:col-start-1 md:row-start-2">
            <h3 className="text-xs tracking-[0.2em] font-bold uppercase mb-6 border-b border-border pb-2 text-primary">
              Público-Alvo
            </h3>

            <div className="text-center bg-muted/50 p-5 rounded-lg border border-border">
              <p className="text-lg font-bold text-foreground leading-tight">
                {influencer.publicoAlvo}
              </p>
            </div>

            {/* Top Estados — dados vindos do config */}
            {influencer.topEstados?.length > 0 && (
              <div className="mt-8">
                <p className="text-[10px] uppercase tracking-wider text-primary mb-3 text-center font-bold">Top Estados</p>
                <div className="space-y-3">
                  {influencer.topEstados.map((estado: any) => (
                    <div key={estado.uf} className="bg-card p-3 rounded-lg border border-border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-foreground">{estado.uf}</span>
                        <span className="text-sm font-bold text-primary">{estado.pct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${estado.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Social Media & Metrics — coluna direita, linha 2 */}
          {ultimaMetrica && (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} className="md:col-span-7 md:col-start-6 md:row-start-2 text-center md:text-left">
                <h3 className="text-xs tracking-[0.2em] font-bold uppercase mb-8 border-b border-border pb-2 text-primary">
                  Redes Sociais
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 text-center mb-10">
                  <div className="bg-muted p-6 rounded-2xl flex flex-col items-center justify-center">
                    <p className="font-display text-5xl font-semibold mb-2 text-foreground">{fmtNum(ultimaMetrica.instagram_followers)}</p>
                    <p className="text-[10px] tracking-widest uppercase text-primary font-bold flex items-center justify-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" /> Instagram
                    </p>
                  </div>
                  <div className="bg-muted p-6 rounded-2xl flex flex-col items-center justify-center">
                    <p className="font-display text-5xl font-semibold mb-2 text-foreground">{fmtNum(ultimaMetrica.tiktok_followers)}</p>
                    <p className="text-[10px] tracking-widest uppercase text-primary font-bold flex items-center justify-center gap-1.5">
                      <Video className="w-3.5 h-3.5" /> TikTok
                    </p>
                  </div>
                </div>

                {/* Growth Chart — evolução de seguidores no Instagram */}
                {igSeries.length >= 2 && (
                  <div className="mb-10 bg-muted/50 border border-border rounded-2xl p-5 text-left">
                    <div className="flex items-end justify-between mb-1">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-primary font-bold">Crescimento Instagram</p>
                        {periodoLabel && (
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{periodoLabel}</p>
                        )}
                      </div>
                      {igGrowthPct !== null && (
                        <span className="flex items-center gap-1 text-sm font-bold text-success">
                          <TrendingUp className="w-4 h-4" />
                          {igGrowthPct >= 0 ? "+" : ""}{igGrowthPct.toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <GrowthChart values={igSeries} />
                  </div>
                )}

                {/* Pill Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 md:gap-4">
                  {[
                    { value: `${ultimaMetrica.instagram_engagement ?? 0}%`, label: "Engajamento IG" },
                    { value: fmtNum(ultimaMetrica.instagram_reach), label: "Alcance IG (30d)" },
                    { value: fmtNum(ultimaMetrica.tiktok_views), label: "Views Médias TK" },
                    { value: `${ultimaMetrica.tiktok_engagement ?? 0}%`, label: "Engajamento TK" },
                  ].map((stat, i) => (
                    <div key={i} className="flex flex-col items-center text-center">
                      <div className="px-5 py-3 min-w-[5.5rem] rounded-full border border-primary/20 bg-card shadow-sm flex items-center justify-center mb-3 text-primary hover:bg-muted transition-colors">
                        <span className="font-bold text-xl tracking-tight whitespace-nowrap">{stat.value}</span>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground max-w-[80px] leading-tight font-medium">
                        {stat.label}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

        </motion.div>

        {/* ─── Services, Moodboard & Contact ─────────────────────────────── */}
        <div className="relative z-10 flex flex-col">

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-8 text-foreground">Formatos Disponíveis</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-foreground max-w-2xl mx-auto text-left bg-muted/50 p-8 rounded-2xl border border-border">
              <ul className="space-y-3 list-disc list-inside marker:text-primary">
                {influencer.formatos.slice(0, Math.ceil(influencer.formatos.length / 2)).map((f: any, i: number) => (
                  <li key={i}><span className="font-bold text-foreground">{f.nome}</span><span className="text-muted-foreground">: {f.descricao}</span></li>
                ))}
              </ul>
              <ul className="space-y-3 list-disc list-inside marker:text-primary">
                {influencer.formatos.slice(Math.ceil(influencer.formatos.length / 2)).map((f: any, i: number) => (
                  <li key={i}><span className="font-bold text-foreground">{f.nome}</span><span className="text-muted-foreground">: {f.descricao}</span></li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Minimalist Image Grid / Moodboard */}
          {influencer.moodboard?.length >= 3 && (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
              <div className="aspect-square md:aspect-[4/5] bg-muted md:mt-8 rounded-3xl md:rounded-tl-3xl md:rounded-br-3xl overflow-hidden shadow-md">
                <img src={influencer.moodboard[0]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="aspect-square bg-muted rounded-3xl md:rounded-tr-3xl md:rounded-bl-3xl overflow-hidden shadow-md">
                <img src={influencer.moodboard[1]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="aspect-square md:aspect-[4/5] bg-muted md:mt-16 rounded-3xl md:rounded-tl-3xl md:rounded-br-3xl overflow-hidden shadow-md">
                <img src={influencer.moodboard[2]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </div>
            </motion.div>
          )}

          <motion.div id="contato" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} className="mt-auto text-center border-t border-border pt-16">
            <h2 className="font-display text-4xl font-semibold tracking-tight mb-8 text-foreground">Contato</h2>
            <div className="flex flex-wrap justify-center gap-6 text-xs tracking-widest uppercase text-primary font-bold">
              <a href={influencer.redes.instagram} target="_blank" className="hover:text-foreground transition-colors bg-muted px-6 py-3 rounded-full flex items-center gap-2"><Camera className="w-4 h-4" /> Instagram</a>
              <a href={influencer.redes.tiktok} target="_blank" className="hover:text-foreground transition-colors bg-muted px-6 py-3 rounded-full flex items-center gap-2"><Video className="w-4 h-4" /> TikTok</a>
              <a href={`mailto:${influencer.contato.email}`} className="hover:text-foreground transition-colors bg-muted px-6 py-3 rounded-full">E-mail Comercial</a>
              <a href={whatsappUrl} target="_blank" className="hover:text-foreground transition-colors bg-muted px-6 py-3 rounded-full">WhatsApp Direto</a>
            </div>
          </motion.div>

        </div>
      </div>

    </main>
  );
}
