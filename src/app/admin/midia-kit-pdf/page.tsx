import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PROFILE_ID, profileFromConfig, toPresentation } from "@/lib/influencer-profile";
import MediaKitDeckPdf from "@/components/midia-kit/MediaKitDeckPdf";
import DeckOverflowCheck from "@/components/midia-kit/DeckOverflowCheck";

// Fonte única do PDF do mídia kit. Cumpre dois papéis:
//   • no navegador, é a pré-visualização folha a folha (chamada pelo link em
//     /admin/perfil);
//   • no servidor, é a página que o Chrome headless de /api/midia-kit/pdf abre
//     para gerar o arquivo.
//
// Fora do grupo (protected) de propósito: não queremos a AdminSidebar nas páginas
// do deck. Continua protegida pelo middleware (/admin/:path*) — e é justamente
// essa sessão que a rota de geração repassa via cookie. Lê os MESMOS dados que a
// página do mídia kit por token.
export const metadata: Metadata = {
  title: { absolute: "Mídia Kit — PDF" },
  robots: { index: false, follow: false },
};

export default async function MidiaKitPdfPage() {
  const supabase = await createClient();

  const [{ data: perfilRow }, { data: metricas }] = await Promise.all([
    supabase.from("influencer_profile").select("*").eq("id", PROFILE_ID).maybeSingle(),
    supabase.from("influencer_metrics").select("*").order("reference_month", { ascending: true }),
  ]);

  const influencer = toPresentation(perfilRow ?? profileFromConfig());

  return (
    <>
      <MediaKitDeckPdf influencer={influencer} metricas={metricas ?? []} />
      <DeckOverflowCheck />
    </>
  );
}
