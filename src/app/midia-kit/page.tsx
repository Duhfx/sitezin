import type { Metadata } from "next";
import RequestForm from "@/components/public/RequestForm";
import PublicHeader from "@/components/public/PublicHeader";

export const metadata: Metadata = { title: "Mídia Kit" };
import { createServiceClient } from "@/lib/supabase/server";
import { PROFILE_ID, profileFromConfig } from "@/lib/influencer-profile";
import { Lock } from "lucide-react";

const dentroDoKit = [
  "Seguidores no Instagram",
  "Alcance mensal",
  "Taxa de engajamento",
  "Crescimento (histórico)",
];

export default async function MidiaKitPage() {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("influencer_profile")
    .select("nome, foto_url, nicho")
    .eq("id", PROFILE_ID)
    .maybeSingle();
  if (error) console.error("[influencer_profile] erro na query:", error);
  if (!data) {
    console.warn("[influencer_profile] data é null, usando fallback");
    const { data: todos } = await supabase.from("influencer_profile").select("id");
    console.warn("[influencer_profile] linhas existentes:", todos);
  }
  const perfil = data ?? profileFromConfig();
  return (
    <main className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      <PublicHeader />
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern [mask-image:linear-gradient(to_bottom,white,transparent)] opacity-5" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-40 w-[500px] h-[500px] bg-accent2/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 pt-28 pb-12 lg:pb-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Left Column: Copy & Teaser */}
          <div className="max-w-2xl mx-auto lg:mx-0">
            {/* Identidade da influenciadora */}
            <div className="inline-flex items-center gap-3 mb-8">
              <img
                src={perfil.foto_url ?? ""}
                alt={perfil.nome}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20 shadow-sm"
              />
              <div className="text-left">
                <p className="font-bold text-foreground leading-tight">{perfil.nome}</p>
                <p className="text-xs uppercase tracking-wider text-primary font-semibold">{perfil.nicho}</p>
              </div>
            </div>

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground mb-6 leading-[1.05]">
              Acesso Exclusivo <br className="hidden lg:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent2">Mídia Kit</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
              Preencha seus dados para receber o link com as métricas de crescimento, engajamento e formatos de publicidade.
            </p>

            {/* Faixa de valor — visível no mobile (onde o teaser fica oculto) */}
            <div className="flex flex-wrap gap-2 mb-2 md:hidden">
              {dentroDoKit.map((item) => (
                <span key={item} className="rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 ring-1 ring-primary/20">
                  {item}
                </span>
              ))}
            </div>

            {/* Teaser — métricas reais rotuladas, valores bloqueados */}
            <div className="relative hidden md:block select-none pointer-events-none">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent2/20 rounded-3xl blur-xl opacity-50" />
              <div className="relative glass-card rounded-2xl p-8 border border-border/50 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-background/30 backdrop-blur-[3px] z-10 flex items-center justify-center">
                  <span className="px-6 py-2 rounded-full bg-foreground text-background font-bold text-sm shadow-xl tracking-wide uppercase flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Conteúdo Fechado
                  </span>
                </div>

                <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold mb-6">Dentro do mídia kit</p>
                <div className="space-y-4 opacity-70 blur-[2px]">
                  {dentroDoKit.map((item) => (
                    <div key={item} className="flex items-center justify-between border-b border-border/60 pb-3 last:border-0">
                      <span className="text-sm font-medium text-foreground">{item}</span>
                      <span className="h-5 w-16 rounded bg-foreground/15" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="relative z-20">
            <RequestForm />
          </div>

        </div>
      </div>
    </main>
  );
}
