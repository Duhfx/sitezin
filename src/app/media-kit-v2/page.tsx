import type { Metadata } from "next";
import MediaKitPresentationEditorial from "@/components/midia-kit/MediaKitPresentationEditorial";

export const metadata: Metadata = { title: "Mídia Kit · Preview Editorial" };

// ─────────────────────────────────────────────────────────────────────────────
// Rota de PREVIEW (validação de ideia) da direção editorial / lookbook.
// Dados fictícios, no mesmo formato das props que o componente real recebe.
// Não usa banco nem token. Reverter = apagar esta pasta + o componente editorial.
// ─────────────────────────────────────────────────────────────────────────────

const INFLUENCER = {
  nome: "Aline Carreiro",
  foto: "/perfil.jpeg",
  biografia:
    "Sou uma paulistana que escolheu Blumenau como lar desde 2017. Apaixonada por descobrir novos lugares, experimentar a gastronomia local e viver novas experiências, compartilho tudo de forma autêntica, leve e com uma pitada de humor.\nMinha trajetória como Product Owner, com foco em experiência do usuário e storytelling, me deu um olhar estratégico para criar conteúdos que conectam pessoas por meio de histórias reais.\nHoje compartilho viagens, gastronomia, compras e o meu dia a dia, mostrando tanto as descobertas quanto os perrengues que fazem parte da jornada.",
  nicho: "Lifestyle · Gastronomia · Viagens · Moda",
  publicoAlvo:
    "Um perfil engajado e fiel, composto majoritariamente por mulheres que buscam inspiração diária em lifestyle, gastronomia, moda e viagens pelo Sul e Sudeste do país.",
  localizacao: "Blumenau, SC · São Paulo, SP",
  topEstados: [
    { uf: "São Paulo", pct: 38 },
    { uf: "Rio de Janeiro", pct: 22 },
    { uf: "Santa Catarina", pct: 12 },
  ],
  audienciaGenero: [
    { label: "Feminino", pct: 78 },
    { label: "Masculino", pct: 22 },
  ],
  audienciaIdade: [
    { faixa: "18–24 anos", pct: 43 },
    { faixa: "25–34 anos", pct: 34 },
    { faixa: "35–44 anos", pct: 15 },
  ],
  redes: {
    instagram: "https://instagram.com/alinecp",
    tiktok: "https://tiktok.com/@lineeec",
    youtube: "https://youtube.com/@alinecp",
  },
  handles: { instagram: "@alinecp", tiktok: "@lineeec" },
  formatos: [
    { nome: "Reels", descricao: "Vídeos autorais de 15 a 90s com roteiro e edição próprios." },
    { nome: "Carrossel", descricao: "Posts de múltiplos slides com alto índice de salvamento." },
    { nome: "Stories", descricao: "Sequência imersiva com enquetes e links diretos." },
    { nome: "TikTok", descricao: "Vídeos nativos verticais otimizados para o algoritmo." },
    { nome: "UGC", descricao: "Conteúdo criado para uso nas redes da própria marca." },
    { nome: "Publipost", descricao: "Post fixo no feed com alta durabilidade e visibilidade." },
  ],
  cases: [
    { marca: "Natura", resultado: "15% de aumento nas vendas durante a campanha.", periodo: "Jan 2026" },
    { marca: "Farm Rio", resultado: "2,3M de impressões em 7 dias de ativação.", periodo: "Mar 2026" },
    { marca: "O Boticário", resultado: "4.800 cliques no link da bio em 48 horas.", periodo: "Mai 2026" },
  ],
  moodboard: [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=900&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1100&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1400&auto=format&fit=crop",
  ],
  contato: { email: "contato@alinecarreiro.com", whatsapp: "5511999998888" },
};

const METRICAS = [
  {
    reference_month: "2026-06-01",
    instagram_followers: 1_200_000,
    instagram_reach: 2_500_000,
    instagram_impressions: 3_100_000,
    instagram_engagement: 7.1,
    instagram_interactions: 85_000,
    instagram_shares: 12_000,
    instagram_saves: 25_000,
    tiktok_followers: 3_500_000,
    tiktok_views: 1_200_000,
    tiktok_likes: 850_000,
    tiktok_engagement: 9.1,
    tiktok_interactions: 320_000,
    tiktok_shares: 45_000,
    tiktok_saves: 80_000,
  },
];

export default function MediaKitV2PreviewPage() {
  return (
    <div className="relative">
      <div className="sticky top-0 z-50 bg-[#FF9A86] px-6 py-2 text-center text-xs font-medium text-white">
        Pré-visualização da direção editorial. Dados fictícios, não representam valores reais.
      </div>
      <MediaKitPresentationEditorial influencer={INFLUENCER} metricas={METRICAS} />
    </div>
  );
}
