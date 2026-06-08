import { getCuponsAtivos } from "@/lib/supabase/queries";
import CouponList from "@/components/public/CouponList";
import { TicketPercent } from "lucide-react";

export default async function CuponsPage() {
  const cupons = await getCuponsAtivos();

  return (
    <main className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern [mask-image:linear-gradient(to_bottom,white,transparent)] opacity-5" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-40 w-[500px] h-[500px] bg-accent2/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-5xl px-4 py-16 sm:py-24 w-full">
        <header className="mb-20 text-center flex flex-col items-center">
          <div className="inline-flex items-center justify-center p-3 mb-6 rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <TicketPercent className="w-8 h-8" />
          </div>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground mb-6 leading-tight">
            Minhas <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent2">Parcerias</span>
          </h1>
          <p className="max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed">
            As melhores marcas com descontos exclusivos para você aproveitar.
          </p>
        </header>

        <CouponList cupons={cupons} />
      </div>
    </main>
  );
}
