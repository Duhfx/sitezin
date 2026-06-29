import MetricasCharts, { type MetricaChartRow } from "@/components/admin/MetricasCharts";
import type { AudienciaGenero, AudienciaIdade, TopEstado } from "@/types/database";

// ─── Dados fictícios ──────────────────────────────────────────────────────────

const ATUAL = {
  instagram_followers: 47800,
  instagram_reach: 312400,
  instagram_engagement: 4.23,
  instagram_interactions: 13218,
  instagram_saves: 2841,
  instagram_shares: 1934,
  tiktok_followers: 31200,
  tiktok_views: 428700,
  tiktok_engagement: 5.87,
  tiktok_likes: 21435,
  tiktok_shares: 3841,
};

const ANTERIOR = {
  instagram_followers: 44200,
  instagram_reach: 278000,
  instagram_engagement: 3.87,
  instagram_interactions: 10762,
  instagram_saves: 2110,
  instagram_shares: 1720,
  tiktok_followers: 28400,
  tiktok_views: 374200,
  tiktok_engagement: 5.12,
  tiktok_likes: 17890,
  tiktok_shares: 3200,
};

const CHART_DATA: MetricaChartRow[] = [
  { mes: "jan/25", igSeguidores: 38000, tkSeguidores: 22000, igEngajamento: 3.1, tkEngajamento: 4.2, igAlcance: 180000, tkViews: 210000 },
  { mes: "fev/25", igSeguidores: 40000, tkSeguidores: 24000, igEngajamento: 3.4, tkEngajamento: 4.5, igAlcance: 205000, tkViews: 248000 },
  { mes: "mar/25", igSeguidores: 42000, tkSeguidores: 25500, igEngajamento: 3.7, tkEngajamento: 4.8, igAlcance: 232000, tkViews: 285000 },
  { mes: "abr/25", igSeguidores: 44200, tkSeguidores: 27000, igEngajamento: 3.9, tkEngajamento: 5.1, igAlcance: 254000, tkViews: 312000 },
  { mes: "mai/25", igSeguidores: 45500, tkSeguidores: 28400, igEngajamento: 4.0, tkEngajamento: 5.4, igAlcance: 278000, tkViews: 374000 },
  { mes: "jun/25", igSeguidores: 47800, tkSeguidores: 31200, igEngajamento: 4.23, tkEngajamento: 5.87, igAlcance: 312400, tkViews: 428700 },
];

const GENERO: AudienciaGenero[] = [
  { label: "Feminino", pct: 78 },
  { label: "Masculino", pct: 22 },
];

const IDADE: AudienciaIdade[] = [
  { faixa: "18–24 anos", pct: 43 },
  { faixa: "25–34 anos", pct: 34 },
];

const ESTADOS: TopEstado[] = [
  { uf: "São Paulo", pct: 38 },
  { uf: "Rio de Janeiro", pct: 22 },
  { uf: "Blumenau", pct: 12 },
];

const TOP_EMPRESAS = [
  { empresa: "Natura", views: 14, ativo: true },
  { empresa: "Farm Rio", views: 11, ativo: true },
  { empresa: "Renner", views: 8, ativo: false },
  { empresa: "O Boticário", views: 7, ativo: true },
  { empresa: "Riachuelo", views: 5, ativo: true },
];

// ─── Formatação ───────────────────────────────────────────────────────────────

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("pt-BR");
}

function fmtPct(n: number): string {
  return `${n.toFixed(2)}%`;
}

function crescimento(curr: number, prev: number): number {
  return ((curr - prev) / prev) * 100;
}

// ─── Componentes internos ─────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  growth,
  hint,
}: {
  label: string;
  value: string;
  sub?: string;
  growth?: number;
  hint?: string;
}) {
  const growthLabel = growth != null
    ? `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}% vs mês anterior`
    : null;

  const growthColor =
    growth == null ? "" : growth > 0 ? "text-success" : growth < 0 ? "text-destructive" : "text-muted-foreground";

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">
        {label}
        {hint && (
          <span title={hint} className="ml-1 cursor-help text-[10px] text-muted-foreground/60">ⓘ</span>
        )}
      </p>
      <p className="mt-1.5 text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      {growthLabel && <p className={`mt-1 text-xs font-medium ${growthColor}`}>{growthLabel}</p>}
    </div>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      {icon}
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    </div>
  );
}

function AudienciaBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// Sidebar estática de preview
function MockSidebar() {
  const items = [
    { label: "Solicitações", active: false },
    { label: "Cupons", active: false },
    { label: "Perfil", active: false },
    { label: "Dashboard", active: true },
  ];

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <div className="border-b border-border px-5 py-6">
        <span className="text-sm font-semibold text-foreground">Painel Admin</span>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {items.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm ${
              item.active
                ? "bg-secondary font-medium text-primary"
                : "text-muted-foreground"
            }`}
          >
            {item.label}
          </div>
        ))}
      </nav>
    </aside>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PreviewPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <MockSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Banner de preview */}
        <div className="shrink-0 bg-warning/10 px-6 py-2 text-center text-xs font-medium text-warning">
          Modo de visualização — todos os dados são fictícios e não representam valores reais
        </div>

        {/* Conteúdo scrollável */}
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="mx-auto max-w-5xl space-y-8">

            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-xl font-semibold text-foreground">Métricas</h1>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Última sync: há 2h</span>
                <button
                  disabled
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground opacity-60"
                >
                  ↻ Atualizar agora
                </button>
              </div>
            </div>

            {/* Instagram */}
            <section>
              <SectionHeader
                title="Instagram · @alinecp"
                icon={
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-primary" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                }
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                <StatCard
                  label="Seguidores"
                  value={fmtNum(ATUAL.instagram_followers)}
                  sub="Sync há 2h"
                  growth={crescimento(ATUAL.instagram_followers, ANTERIOR.instagram_followers)}
                />
                <StatCard
                  label="Alcance"
                  value={fmtNum(ATUAL.instagram_reach)}
                  sub="Últimos 30 dias"
                  hint="Contas únicas que viram ao menos um conteúdo"
                  growth={crescimento(ATUAL.instagram_reach, ANTERIOR.instagram_reach)}
                />
                <StatCard
                  label="Engajamento"
                  value={fmtPct(ATUAL.instagram_engagement)}
                  sub="Interações ÷ alcance"
                  hint="Taxa calculada sobre o alcance do período"
                  growth={crescimento(ATUAL.instagram_engagement, ANTERIOR.instagram_engagement)}
                />
                <StatCard
                  label="Interações"
                  value={fmtNum(ATUAL.instagram_interactions)}
                  sub="Últimos 30 dias"
                  hint="Curtidas + comentários + saves + shares (exceto Stories)"
                  growth={crescimento(ATUAL.instagram_interactions, ANTERIOR.instagram_interactions)}
                />
                <StatCard
                  label="Salvamentos"
                  value={fmtNum(ATUAL.instagram_saves)}
                  sub="Últimos 30 dias"
                  hint="Posts salvos pelos seguidores — indica conteúdo de valor"
                  growth={crescimento(ATUAL.instagram_saves, ANTERIOR.instagram_saves)}
                />
                <StatCard
                  label="Compartilhamentos"
                  value={fmtNum(ATUAL.instagram_shares)}
                  sub="Últimos 30 dias"
                  growth={crescimento(ATUAL.instagram_shares, ANTERIOR.instagram_shares)}
                />
              </div>
            </section>

            {/* TikTok */}
            <section>
              <SectionHeader
                title="TikTok · @lineeec"
                icon={
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
                  </svg>
                }
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <StatCard
                  label="Seguidores"
                  value={fmtNum(ATUAL.tiktok_followers)}
                  sub="Sync há 2h"
                  growth={crescimento(ATUAL.tiktok_followers, ANTERIOR.tiktok_followers)}
                />
                <StatCard
                  label="Views"
                  value={fmtNum(ATUAL.tiktok_views)}
                  sub="Últimos 28 dias"
                  hint="Soma das visualizações dos vídeos publicados no período"
                  growth={crescimento(ATUAL.tiktok_views, ANTERIOR.tiktok_views)}
                />
                <StatCard
                  label="Engajamento"
                  value={fmtPct(ATUAL.tiktok_engagement)}
                  sub="Interações ÷ views"
                  hint="Curtidas + comentários + compartilhamentos sobre total de views"
                  growth={crescimento(ATUAL.tiktok_engagement, ANTERIOR.tiktok_engagement)}
                />
                <StatCard
                  label="Curtidas"
                  value={fmtNum(ATUAL.tiktok_likes)}
                  sub="Últimos 28 dias"
                  growth={crescimento(ATUAL.tiktok_likes, ANTERIOR.tiktok_likes)}
                />
                <StatCard
                  label="Compartilhamentos"
                  value={fmtNum(ATUAL.tiktok_shares)}
                  sub="Últimos 28 dias"
                  growth={crescimento(ATUAL.tiktok_shares, ANTERIOR.tiktok_shares)}
                />
              </div>
            </section>

            {/* Gráficos */}
            <section>
              <h2 className="mb-4 text-sm font-semibold text-foreground">Tendências mensais</h2>
              <MetricasCharts data={CHART_DATA} />
            </section>

            {/* Audiência */}
            <section>
              <h2 className="mb-4 text-sm font-semibold text-foreground">Audiência</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gênero</p>
                  <div className="space-y-3">
                    {GENERO.map((g) => <AudienciaBar key={g.label} label={g.label} pct={g.pct} />)}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Faixa etária</p>
                  <div className="space-y-3">
                    {IDADE.map((a) => <AudienciaBar key={a.faixa} label={a.faixa} pct={a.pct} />)}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top cidades</p>
                  <div className="space-y-3">
                    {ESTADOS.map((e) => <AudienciaBar key={e.uf} label={e.uf} pct={e.pct} />)}
                  </div>
                </div>
              </div>
            </section>

            {/* Mídia Kit */}
            <section>
              <h2 className="mb-4 text-sm font-semibold text-foreground">Mídia Kit</h2>

              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs font-medium text-muted-foreground">Pendentes</p>
                  <p className="mt-1.5 text-2xl font-bold text-warning">3</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs font-medium text-muted-foreground">Aprovadas</p>
                  <p className="mt-1.5 text-2xl font-bold text-success">18</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs font-medium text-muted-foreground">Reprovadas</p>
                  <p className="mt-1.5 text-2xl font-bold text-muted-foreground">4</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs font-medium text-muted-foreground">Visualizações</p>
                  <p className="mt-1.5 text-2xl font-bold text-primary">127</p>
                </div>
              </div>

              <p className="mb-3 text-xs font-semibold text-muted-foreground">Empresas com mais acessos</p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[400px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Empresa</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Acesso</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TOP_EMPRESAS.map((e) => (
                      <tr key={e.empresa} className="border-b border-border last:border-0 transition-colors hover:bg-muted/40">
                        <td className="px-4 py-3 font-medium text-foreground">{e.empresa}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${e.ativo ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                            {e.ativo ? "Ativo" : "Revogado"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-primary">{e.views}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}
