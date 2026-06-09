"use client";

import { Camera, Video, MessageCircle, TrendingUp, Users, MapPin } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { TopEstado, Formato, Case } from "@/types/database";

type InfluencerPresentation = {
  nome: string;
  foto: string;
  biografia: string;
  nicho: string;
  publicoAlvo: string;
  topEstados: TopEstado[];
  redes: { instagram: string; tiktok: string; youtube: string };
  formatos: Formato[];
  cases: Case[];
  moodboard: string[];
  contato: { email: string; whatsapp: string };
};

type Metrics = {
  reference_month: string;
  instagram_followers?: number;
  instagram_reach?: number;
  instagram_engagement?: number;
  tiktok_followers?: number;
  tiktok_views?: number;
  tiktok_engagement?: number;
}[];

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

function fmtWhatsapp(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 13) {
    // +55 (XX) 9 XXXX-XXXX
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 5)} ${digits.slice(5, 9)}-${digits.slice(9)}`;
  }
  return raw;
}

const NOISE_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const TK_COLOR = "#6366f1";  // indigo — funciona como atributo SVG
const IG_COLOR = "#16a34a";  // green-700, espelha --primary sem CSS var

function buildPath(
  values: number[],
  min: number,
  max: number,
  w: number,
  h: number,
  pad: number,
) {
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
  return { line, area, last: pts[pts.length - 1] };
}

// ─── Gráfico de crescimento com duas séries ───────────────────────────────────
function GrowthChart({
  ig, tk, labels,
}: {
  ig: number[];
  tk: number[];
  labels: string[];
}) {
  const hasIg = ig.length >= 2;
  const hasTk = tk.length >= 2 && tk.some((v) => v > 0);
  if (!hasIg) return null;

  const w = 100;
  const h = 52;
  const pad = 3;

  // Escala compartilhada: ambas as séries normalizadas pelo mesmo máximo,
  // partindo de 0, para que as linhas fiquem em posições absolutas distintas.
  const sharedMin = 0;
  const sharedMax = Math.max(...ig, ...(hasTk ? tk : [0])) || 1;

  const igPath = buildPath(ig, sharedMin, sharedMax, w, h, pad);
  const tkPath = hasTk ? buildPath(tk, sharedMin, sharedMax, w, h, pad) : null;

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="w-full h-24"
        aria-hidden
      >
        <defs>
          <linearGradient id="igFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={IG_COLOR} stopOpacity="0.18" />
            <stop offset="100%" stopColor={IG_COLOR} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="tkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TK_COLOR} stopOpacity="0.15" />
            <stop offset="100%" stopColor={TK_COLOR} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Áreas de preenchimento — ambas primeiro, para não cobrir nenhuma linha */}
        <path d={igPath.area} fill="url(#igFill)" />
        {tkPath && <path d={tkPath.area} fill="url(#tkFill)" />}

        {/* Linhas por cima das áreas — TK mais fina, IG mais grossa */}
        {tkPath && (
          <>
            <path d={tkPath.line} fill="none" stroke={TK_COLOR} strokeWidth="1"
              strokeLinecap="round" strokeLinejoin="round"
            />
            <circle cx={tkPath.last[0]} cy={tkPath.last[1]} r="2" fill={TK_COLOR} />
          </>
        )}
        <path d={igPath.line} fill="none" stroke={IG_COLOR} strokeWidth="1"
          strokeLinecap="round" strokeLinejoin="round"
        />
        <circle cx={igPath.last[0]} cy={igPath.last[1]} r="2.5" fill={IG_COLOR} />
      </svg>

      {/* Valores inicial → final por rede */}
      <div className="flex flex-col gap-1 text-xs font-medium px-0.5">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-0.5 rounded-full" style={{ background: IG_COLOR }} />
            <span className="text-muted-foreground">Instagram</span>
          </span>
          <span className="text-muted-foreground">{labels[0]} · {fmtNum(ig[0])} → {labels[labels.length - 1]} · {fmtNum(ig[ig.length - 1])}</span>
        </div>
        {hasTk && tk && (
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-0.5 rounded-full" style={{ borderTop: `2px dashed ${TK_COLOR}` }} />
              <span className="text-muted-foreground">TikTok</span>
            </span>
            <span className="text-muted-foreground">{labels[0]} · {fmtNum(tk[0])} → {labels[labels.length - 1]} · {fmtNum(tk[tk.length - 1])}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MediaKitPresentation({
  influencer,
  metricas,
}: {
  influencer: InfluencerPresentation;
  metricas: Metrics;
}) {
  const shouldReduceMotion = useReducedMotion();

  const ultimaMetrica = metricas.length > 0 ? metricas[metricas.length - 1] : null;

  const igSeries = metricas.map((m) => m.instagram_followers ?? 0);
  const tkSeries = metricas.map((m) => m.tiktok_followers ?? 0);
  const chartLabels = metricas.map((m) => fmtMonth(m.reference_month));

  function growthPct(series: number[]) {
    if (series.length < 2 || series[0] === 0) return null;
    return ((series[series.length - 1] - series[0]) / series[0]) * 100;
  }
  const igGrowthPct = growthPct(igSeries);
  const tkGrowthPct = tkSeries.some((v) => v > 0) ? growthPct(tkSeries) : null;

  const periodoLabel =
    metricas.length >= 2
      ? `${fmtMonth(metricas[0].reference_month)}–${fmtMonth(metricas[metricas.length - 1].reference_month)}`
      : null;

  const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  const whatsappUrl = `https://wa.me/${influencer.contato.whatsapp.replace(/\D/g, "")}`;

  return (
    <main className="min-h-screen bg-background py-12 px-4 selection:bg-primary selection:text-white flex flex-col items-center gap-12 text-foreground pb-32">

      {/* ─── FLOATING CTA (Sticky Button) ─────────────────────────────────────── */}
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Falar com ${influencer.nome} no WhatsApp`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="fixed bottom-8 right-8 z-50 bg-primary text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 hover:scale-105 hover:bg-primary/90 transition-all"
      >
        <MessageCircle className="w-5 h-5" aria-hidden />
        <span className="font-bold text-sm tracking-wide">Falar no WhatsApp</span>
      </motion.a>

      {/* ─── CARD PRINCIPAL ─────────────────────────────────────────────────────── */}
      <div className="w-full max-w-4xl bg-card shadow-2xl p-6 md:p-16 relative overflow-hidden rounded-2xl flex flex-col gap-16 md:gap-24">
        {/* Textura de papel sutil */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none mix-blend-multiply"
          style={{ backgroundImage: NOISE_BG }}
        />

        {/* ── HERO + SOBRE + PÚBLICO + MÉTRICAS ──────────────────────────────── */}
        <motion.div
          initial={shouldReduceMotion ? false : "hidden"}
          animate="visible"
          variants={fadeUp}
          className="grid md:grid-cols-12 gap-8 md:gap-12 relative z-10"
        >

          {/* Foto — coluna esquerda */}
          <div className="md:col-span-5 md:col-start-1 md:row-start-1">
            <div className="aspect-square md:aspect-[3/4] max-w-[280px] md:max-w-none mx-auto bg-muted relative overflow-hidden rounded-t-full shadow-inner">
              <img
                src={influencer.foto}
                alt={`Foto de ${influencer.nome}`}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>

          {/* Sobre — coluna direita */}
          <motion.div
            initial={shouldReduceMotion ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="md:col-span-7 md:col-start-6 md:row-start-1 text-center md:text-left"
          >
            <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight text-foreground mb-4">
              {influencer.nome}
            </h1>
            <p className="text-xs tracking-[0.2em] font-bold uppercase mb-6 text-primary">{influencer.nicho}</p>
            <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>{influencer.biografia}</p>
            </div>
          </motion.div>

          {/* Público-Alvo — coluna esquerda, linha 2 */}
          <motion.div
            initial={shouldReduceMotion ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp}
            className="md:col-span-5 md:col-start-1 md:row-start-2"
          >
            <h3 className="text-xs tracking-[0.2em] font-bold uppercase mb-6 border-b border-border pb-2 text-primary">
              Público-Alvo
            </h3>

            <div className="bg-muted/50 p-5 rounded-lg border border-border flex items-start gap-3">
              <Users className="w-5 h-5 text-primary mt-0.5 shrink-0" aria-hidden />
              <p className="text-base font-semibold text-foreground leading-snug">
                {influencer.publicoAlvo}
              </p>
            </div>

            {influencer.topEstados?.length > 0 && (
              <div className="mt-8">
                <p className="text-xs uppercase tracking-wider text-primary mb-3 flex items-center gap-1.5 font-bold">
                  <MapPin className="w-3.5 h-3.5" aria-hidden /> Top Estados
                </p>
                <div className="space-y-3">
                  {influencer.topEstados.map((estado) => (
                    <div key={estado.uf} className="bg-card p-3 rounded-lg border border-border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-foreground">{estado.uf}</span>
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

          {/* Redes Sociais & Métricas — coluna direita, linha 2 */}
          {ultimaMetrica && (
            <motion.div
              initial={shouldReduceMotion ? false : "hidden"}
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUp}
              className="md:col-span-7 md:col-start-6 md:row-start-2 text-center md:text-left"
            >
              <h3 className="text-xs tracking-[0.2em] font-bold uppercase mb-8 border-b border-border pb-2 text-primary">
                Redes Sociais
              </h3>

              {/* Seguidores */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 text-center mb-10">
                <div className="bg-muted p-6 rounded-2xl flex flex-col items-center justify-center">
                  <p className="font-display text-5xl font-semibold mb-2 text-foreground">
                    {fmtNum(ultimaMetrica.instagram_followers ?? 0)}
                  </p>
                  <p className="text-xs tracking-widest uppercase text-primary font-bold flex items-center justify-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" aria-hidden /> Instagram
                  </p>
                </div>
                <div className="bg-muted p-6 rounded-2xl flex flex-col items-center justify-center">
                  <p className="font-display text-5xl font-semibold mb-2 text-foreground">
                    {fmtNum(ultimaMetrica.tiktok_followers ?? 0)}
                  </p>
                  <p className="text-xs tracking-widest uppercase text-primary font-bold flex items-center justify-center gap-1.5">
                    <Video className="w-3.5 h-3.5" aria-hidden /> TikTok
                  </p>
                </div>
              </div>

              {/* Gráfico de crescimento */}
              {igSeries.length >= 2 && (
                <div className="mb-10 bg-muted/50 border border-border rounded-2xl p-5 text-left">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between mb-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-primary font-bold">Crescimento de Seguidores</p>
                      {periodoLabel && (
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mt-0.5">{periodoLabel}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {igGrowthPct !== null && (
                        <span className="flex items-center gap-1 text-sm font-bold text-success">
                          <TrendingUp className="w-3.5 h-3.5" aria-hidden />
                          IG {igGrowthPct >= 0 ? "+" : ""}{igGrowthPct.toFixed(1)}%
                        </span>
                      )}
                      {tkGrowthPct !== null && (
                        <span className="flex items-center gap-1 text-sm font-bold" style={{ color: TK_COLOR }}>
                          <TrendingUp className="w-3.5 h-3.5" aria-hidden />
                          TK {tkGrowthPct >= 0 ? "+" : ""}{tkGrowthPct.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <GrowthChart ig={igSeries} tk={tkSeries} labels={chartLabels} />
                </div>
              )}

            </motion.div>
          )}

          {/* Stats Cards — linha 3, span 12 colunas para evitar espaço vazio no desktop */}
          {ultimaMetrica && (
            <div className="md:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: `${ultimaMetrica.instagram_engagement ?? 0}%`, label: "Engajamento", sub: "Instagram", note: null },
                { value: fmtNum(ultimaMetrica.instagram_reach ?? 0), label: "Alcance mensal", sub: "Instagram", note: null },
                { value: fmtNum(ultimaMetrica.tiktok_views ?? 0), label: "Views médias", sub: "TikTok", note: null },
                { value: `${ultimaMetrica.tiktok_engagement ?? 0}%`, label: "Engajamento", sub: "TikTok", note: null },
              ].map((stat, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1">
                  <p className="font-bold text-2xl text-foreground tracking-tight">{stat.value}</p>
                  <p className="text-xs font-semibold text-foreground">{stat.label}</p>
                  <p className="text-xs text-primary font-medium">{stat.sub}</p>
                  {stat.note && <p className="text-[11px] text-muted-foreground mt-0.5">{stat.note}</p>}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── MOODBOARD ─────────────────────────────────────────────────────────── */}
        {influencer.moodboard?.length >= 3 && (
          <motion.div
            initial={shouldReduceMotion ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="aspect-square md:aspect-[4/5] bg-muted md:mt-8 rounded-2xl overflow-hidden shadow-md">
              <img src={influencer.moodboard[0]} alt="Foto de conteúdo 1" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="aspect-square bg-muted rounded-2xl overflow-hidden shadow-md">
              <img src={influencer.moodboard[1]} alt="Foto de conteúdo 2" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="aspect-square md:aspect-[4/5] bg-muted md:mt-16 rounded-2xl overflow-hidden shadow-md">
              <img src={influencer.moodboard[2]} alt="Foto de conteúdo 3" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
          </motion.div>
        )}

        {/* ── FORMATOS DISPONÍVEIS ───────────────────────────────────────────────── */}
        <motion.div
          initial={shouldReduceMotion ? undefined : "hidden"}
          whileInView={shouldReduceMotion ? undefined : "visible"}
          viewport={{ once: true, margin: "-100px" }}
          variants={shouldReduceMotion ? {} : fadeUp}
          className="relative z-10"
        >
          <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-8 text-foreground text-center">
            Formatos Disponíveis
          </h2>
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {influencer.formatos.map((f, i) => (
              <div key={i} className="bg-muted/50 border border-border rounded-xl p-5">
                <p className="font-bold text-foreground mb-1">{f.nome}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.descricao}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── CASES / RESULTADOS ─────────────────────────────────────────────────── */}
        {influencer.cases?.length > 0 && (
          <motion.div
            initial={shouldReduceMotion ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="relative z-10"
          >
            <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground text-center mb-8">
              Casos de Sucesso
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {influencer.cases.map((c, i) => (
                <div key={i} className="bg-muted/50 border border-border rounded-xl p-6 flex flex-col gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">{c.marca}</p>
                  <p className="font-display text-2xl font-semibold text-foreground leading-snug">{c.resultado}</p>
                  <p className="text-xs text-muted-foreground mt-auto">{c.periodo}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── CONTATO ───────────────────────────────────────────────────────────── */}
        <motion.div
          id="contato"
          initial={shouldReduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={fadeUp}
          className="relative z-10 text-center border-t border-border pt-16"
        >
          <h2 className="font-display text-4xl font-semibold tracking-tight mb-8 text-foreground">Contato</h2>

          {/* Dados visíveis */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-8 text-sm text-foreground font-medium">
            {influencer.contato.email && (
              <span className="bg-muted px-4 py-2 rounded-full text-foreground">{influencer.contato.email}</span>
            )}
            {influencer.contato.whatsapp && (
              <span className="bg-muted px-4 py-2 rounded-full text-foreground">{fmtWhatsapp(influencer.contato.whatsapp)}</span>
            )}
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-4 text-xs tracking-widest uppercase text-primary font-bold">
            <a
              href={influencer.redes.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors bg-muted px-6 py-3 rounded-full flex items-center gap-2"
            >
              <Camera className="w-4 h-4" aria-hidden /> Instagram
            </a>
            <a
              href={influencer.redes.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors bg-muted px-6 py-3 rounded-full flex items-center gap-2"
            >
              <Video className="w-4 h-4" aria-hidden /> TikTok
            </a>
            <a
              href={`mailto:${influencer.contato.email}`}
              className="hover:text-foreground transition-colors bg-muted px-6 py-3 rounded-full"
            >
              E-mail Comercial
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors bg-muted px-6 py-3 rounded-full"
            >
              WhatsApp Direto
            </a>
          </div>
        </motion.div>

      </div>
    </main>
  );
}
