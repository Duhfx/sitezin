import type { Metadata } from "next";
import { Mail, Film, CalendarClock } from "lucide-react";
import WhatsappIcon from "@/components/icons/WhatsappIcon";
import { createClient } from "@/lib/supabase/server";
import { PROFILE_ID, profileFromConfig, toPresentation } from "@/lib/influencer-profile";
import PrintButton from "./PrintButton";

export const metadata: Metadata = { title: "Preços" };

// ─── Tabela de pacotes ────────────────────────────────────────────────────────
// Escada de volume (Reel + stories) com desconto progressivo 5/10/15/20%.
// PRECO_UNITARIO é a fonte da verdade do reel avulso; porReel e economia são
// derivados de `valor` (o preço fechado de cada pacote). Editar aqui quando mudar.
const PRECO_UNITARIO = 400;

const PACOTES: { reels: number; valor: number; destaque?: boolean }[] = [
  { reels: 1, valor: 400 },
  { reels: 2, valor: 760 },
  { reels: 3, valor: 1080 },
  { reels: 4, valor: 1360 },
  { reels: 5, valor: 1600, destaque: true },
];

// Etapas do que a contratação envolve (fluxo do trabalho).
const ETAPAS: { titulo: string; descricao: string }[] = [
  { titulo: "Roteiro", descricao: "Alinhamento da mensagem e roteiro, quando necessário." },
  { titulo: "Captação", descricao: "Gravação do conteúdo." },
  { titulo: "Edição", descricao: "Montagem e finalização do vídeo." },
  { titulo: "Aprovação", descricao: "Você revisa o material antes de publicar." },
  { titulo: "Ajuste", descricao: "Uma rodada de ajustes, caso necessário." },
  { titulo: "Publicação", descricao: "Reel no ar, com 2 a 3 stories de apoio." },
];

function brl(n: number) {
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// Rótulo de seção (título editorial + fio).
function SectionMark({ title }: { title: React.ReactNode }) {
  return (
    <div className="mb-10 flex items-baseline gap-4 print:mb-5">
      <h2 className="font-display text-3xl font-light italic leading-[1.1] text-slate-800 md:text-4xl print:text-2xl">
        {title}
      </h2>
      <div className="h-px flex-1 bg-slate-200/70" />
    </div>
  );
}

export default async function PrecosPage() {
  // Mesmo chain do mídia kit ao vivo: lê o perfil (nome/contato) e cai no config
  // estático se a linha não existir ou a RLS bloquear a leitura.
  // ponytail: sem métricas aqui — foco é reels+stories; dá pra puxar de
  // influencer_metrics depois, igual o mídia kit faz.
  const supabase = await createClient();
  const { data: perfilRow } = await supabase
    .from("influencer_profile")
    .select("*")
    .eq("id", PROFILE_ID)
    .maybeSingle();

  const influencer = toPresentation(perfilRow ?? profileFromConfig());

  const whatsappDigits = influencer.contato.whatsapp.replace(/\D/g, "");
  const whatsappUrl = whatsappDigits ? `https://wa.me/${whatsappDigits}` : "";
  const emailUrl = influencer.contato.email ? `mailto:${influencer.contato.email}` : "";

  return (
    <div className="font-sans text-slate-700">
      <div className="mb-6 flex justify-end print:hidden">
        <PrintButton />
      </div>

      {/* Cabeçalho */}
      <header className="relative overflow-hidden rounded-[1.5rem] bg-[#F7F2EC] px-8 py-12 md:px-12 md:py-16 print:break-inside-avoid print:py-6">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#FF9A86]/15 blur-[110px]" />
        <div className="relative z-10">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Proposta de parceria</p>
          <h1 className="mt-4 font-display text-[clamp(2.5rem,7vw,4.5rem)] font-light italic leading-[1.05] text-slate-800 print:mt-2 print:text-4xl">
            Tabela de <span className="text-[#FF9A86]">Investimento</span>
          </h1>
          {(influencer.nome || influencer.nicho) && (
            <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
              <span className="font-medium text-slate-700">{influencer.nome}</span>
              {influencer.nicho && (
                <>
                  <span className="h-1 w-1 rounded-full bg-[#FF9A86]/60" />
                  <span>{influencer.nicho}</span>
                </>
              )}
            </p>
          )}
        </div>
      </header>

      {/* Pacotes */}
      <section className="mt-16 print:mt-8">
        <SectionMark title={<>Pacotes <span className="text-[#FF9A86]">e valores</span></>} />

        {/* Incluso em todo pacote */}
        <div className="mb-10 grid grid-cols-1 gap-4 border-y border-slate-200/70 py-5 sm:grid-cols-2 print:mb-5 print:py-3 print:grid-cols-2">
          <div className="flex items-center gap-3">
            <Film className="h-4 w-4 shrink-0 text-[#FF9A86]" />
            <p className="text-sm text-slate-500">
              Cada Reel acompanha <span className="text-slate-700">2 a 3 stories de apoio</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CalendarClock className="h-4 w-4 shrink-0 text-[#FF9A86]" />
            <p className="text-sm text-slate-500">
              Cronograma <span className="text-slate-700">combinado entre marca e criadora</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:gap-3">
          {PACOTES.map((p) => {
            const porReel = Math.round(p.valor / p.reels);
            const economia = p.reels * PRECO_UNITARIO - p.valor;
            const label = `${p.reels} ${p.reels === 1 ? "Reel" : "Reels"}`;

            if (p.destaque) {
              return (
                <div
                  key={p.reels}
                  className="relative flex flex-col overflow-hidden rounded-[1.5rem] bg-[#FF9A86] p-7 text-white print:break-inside-avoid print:p-4"
                >
                  <span className="mb-5 inline-flex w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-medium print:mb-3">
                    5 pelo preço de 4
                  </span>
                  <p className="font-display text-2xl font-light italic leading-[1.1] print:text-xl">{label}</p>
                  <p className="mt-6 pb-1 font-display text-5xl font-light italic leading-[1.1] print:mt-3 print:text-3xl">
                    {brl(p.valor)}
                  </p>
                  <p className="mt-1 text-sm text-white/75">{brl(porReel)} por reel</p>
                  {economia > 0 && (
                    <span className="mt-4 inline-flex w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                      Economia de {brl(economia)}
                    </span>
                  )}
                </div>
              );
            }

            return (
              <div
                key={p.reels}
                className="flex flex-col rounded-[1.5rem] border border-slate-200/80 bg-white p-7 print:break-inside-avoid print:p-4"
              >
                <p className="font-display text-2xl font-light italic leading-[1.1] text-slate-800 print:text-xl">{label}</p>
                <p className="mt-6 pb-1 font-display text-5xl font-light italic leading-[1.1] text-slate-800 print:mt-3 print:text-3xl">
                  {brl(p.valor)}
                </p>
                <p className="mt-1 text-sm text-slate-400">{brl(porReel)} por reel</p>
                {economia > 0 && (
                  <span className="mt-4 inline-flex w-fit rounded-full bg-[#FFF1EC] px-3 py-1 text-xs font-medium text-[#B4482E]">
                    Economia de {brl(economia)}
                  </span>
                )}
              </div>
            );
          })}

          {/* 6+ sob consulta */}
          <div className="flex flex-col rounded-[1.5rem] border border-dashed border-slate-300 p-7 print:break-inside-avoid print:p-4">
            <p className="font-display text-2xl font-light italic leading-[1.1] text-slate-800 print:text-xl">6+ Reels</p>
            <p className="mt-1 text-sm text-slate-400">Campanha personalizada</p>
            <p className="mt-6 pb-1 font-display text-4xl font-light italic leading-[1.1] text-slate-800 print:mt-3 print:text-2xl">
              Sob consulta
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Montamos um pacote sob medida para o volume e o período da campanha.
            </p>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="mt-20 print:mt-8 print:break-inside-avoid">
        <SectionMark title={<>Como <span className="text-[#FF9A86]">funciona</span></>} />

        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-16">
          {ETAPAS.map((etapa, i) => (
            <div key={etapa.titulo} className="flex items-baseline gap-5 border-t border-slate-200/70 py-6 print:py-3">
              <span className="font-display text-sm italic text-[#FF9A86]">{String(i + 1).padStart(2, "0")}</span>
              <div className="flex-1">
                <p className="font-display text-2xl font-light italic leading-[1.1] text-slate-800 print:text-lg">{etapa.titulo}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{etapa.descricao}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      {(influencer.contato.email || influencer.contato.whatsapp) && (
        <section className="mt-20 print:mt-8 print:break-inside-avoid">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#FF9A86] px-8 py-14 text-white md:px-14 md:py-16 print:py-8">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-white/15 blur-[90px]" />
            <div className="relative z-10 flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-end print:flex-row print:items-end">
              <div>
                <p className="mb-4 text-xs uppercase tracking-[0.22em] text-white/70">Vamos fechar parceria?</p>
                <h2 className="font-display text-4xl font-light italic leading-[1.1] md:text-5xl print:text-3xl">
                  Pronta para começar.
                </h2>
              </div>
              <div className="flex flex-col gap-4 lg:items-end">
                {influencer.contato.email && (
                  <a href={emailUrl} className="flex items-center gap-3 font-medium text-white transition-opacity hover:opacity-80">
                    <Mail className="h-4 w-4" />
                    {influencer.contato.email}
                  </a>
                )}
                {influencer.contato.whatsapp && (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 font-medium text-white transition-opacity hover:opacity-80">
                    <WhatsappIcon className="h-4 w-4" />
                    {influencer.contato.whatsapp}
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
