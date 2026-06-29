import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DashboardSyncButton from "@/components/admin/DashboardSyncButton";
import MetricasCharts, { type MetricaChartRow } from "@/components/admin/MetricasCharts";
import SyncHistory from "@/components/admin/SyncHistory";
import type { AudienciaGenero, AudienciaIdade, TopEstado, InfluencerMetrics, SyncLog } from "@/types/database";

const PROFILE_ID = "00000000-0000-0000-0000-000000000001";

// ─── Formatação ───────────────────────────────────────────────────────────────

function fmtNum(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("pt-BR");
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${n.toFixed(2)}%`;
}

function tempoAtras(dateStr: string | null | undefined): string {
  if (!dateStr) return "nunca";
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "há menos de 1h";
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days} dia${days > 1 ? "s" : ""}`;
}

function mesLabel(referenceMonth: string): string {
  const [year, month] = referenceMonth.split("-");
  const d = new Date(Number(year), Number(month) - 1);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

// ─── Componentes de card ──────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  growth,
  compareMonth,
  comparePrev,
  hint,
}: {
  label: string;
  value: string;
  sub?: string;
  growth?: number | null;
  compareMonth?: string;
  comparePrev?: string;
  hint?: string;
}) {
  const growthLabel =
    growth != null ? `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%` : null;

  // Contexto da comparação: "vs mai/26 · era 203" — deixa explícito de quando é
  // a métrica anterior e quanto era, evitando dúvida ao olhar o card.
  const compareLabel =
    growth != null
      ? `vs ${compareMonth ?? "mês anterior"}${comparePrev ? ` · era ${comparePrev}` : ""}`
      : null;

  const growthColor =
    growth == null
      ? ""
      : growth > 0
        ? "text-success"
        : growth < 0
          ? "text-destructive"
          : "text-muted-foreground";

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">
        {label}
        {hint && (
          <span title={hint} className="ml-1 cursor-help text-[10px] text-muted-foreground/60">
            ⓘ
          </span>
        )}
      </p>
      <p className="mt-1.5 text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      {growthLabel && (
        <p className={`mt-1 text-xs font-medium ${growthColor}`}>{growthLabel}</p>
      )}
      {compareLabel && (
        <p className="mt-0.5 text-[11px] text-muted-foreground">{compareLabel}</p>
      )}
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

function AlertaBanner({
  tipo,
  mensagem,
  href,
  cta,
}: {
  tipo: "aviso" | "erro";
  mensagem: string;
  href?: string;
  cta?: string;
}) {
  const cls =
    tipo === "erro"
      ? "bg-destructive/8 border-destructive/20 text-destructive"
      : "bg-warning/8 border-warning/20 text-warning";

  return (
    <div className={`flex items-center justify-between rounded-lg border px-4 py-3 ${cls}`}>
      <p className="text-sm font-medium">{mensagem}</p>
      {href && cta && (
        <Link href={href} className="ml-4 shrink-0 text-xs font-semibold underline underline-offset-2">
          {cta}
        </Link>
      )}
    </div>
  );
}

// Barra de progresso simples para distribuição de audiência
function AudienciaBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ─── Cálculo de crescimento ───────────────────────────────────────────────────

function crescimento(curr: number, prev?: number | null): number | null {
  if (!prev || prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}

// Monta as props de comparação do StatCard: variação %, mês de referência da
// métrica anterior e o valor anterior já formatado (com o mesmo formatador do card).
function compara(
  curr: number | null | undefined,
  prev: number | null | undefined,
  fmt: (n: number | null | undefined) => string,
  prevMonth: string | undefined,
): { growth: number | null; compareMonth?: string; comparePrev?: string } {
  const growth = crescimento(curr ?? 0, prev);
  if (growth == null) return { growth };
  return { growth, compareMonth: prevMonth, comparePrev: fmt(prev) };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { data: perfil },
    { data: todasMetricas },
    { count: pendentes },
    { count: aprovados },
    { count: reprovados },
    { count: totalViews },
    { data: acessos },
    { data: solicitacoes },
    { data: views },
    { data: syncLogs },
  ] = await Promise.all([
    supabase
      .from("influencer_profile")
      .select(
        "instagram_followers, instagram_synced_at, instagram_username, meta_access_token, meta_token_expires_at, tiktok_followers, tiktok_synced_at, tiktok_username, tiktok_refresh_token, tiktok_refresh_expires_at, audiencia_genero, audiencia_idade, top_estados",
      )
      .eq("id", PROFILE_ID)
      .maybeSingle(),
    supabase
      .from("influencer_metrics")
      .select("*")
      .order("reference_month", { ascending: true })
      .limit(12),
    supabase.from("media_kit_requests").select("*", { count: "exact", head: true }).eq("status", "pendente"),
    supabase.from("media_kit_requests").select("*", { count: "exact", head: true }).eq("status", "aprovado"),
    supabase.from("media_kit_requests").select("*", { count: "exact", head: true }).eq("status", "reprovado"),
    supabase.from("media_kit_views").select("*", { count: "exact", head: true }),
    supabase.from("media_kit_access").select("id, request_id, revoked_at"),
    supabase.from("media_kit_requests").select("id, empresa, nome"),
    supabase.from("media_kit_views").select("access_id"),
    supabase
      .from("sync_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // Métricas mais recentes e anterior para cálculo de crescimento
  const metricas = todasMetricas ?? [];
  const atual = metricas.at(-1) as InfluencerMetrics | undefined;
  const anterior = metricas.at(-2) as InfluencerMetrics | undefined;
  const anteriorMes = anterior ? mesLabel(anterior.reference_month) : undefined;

  // Dados de audiência do perfil
  const genero: AudienciaGenero[] = (perfil?.audiencia_genero as AudienciaGenero[]) ?? [];
  const idade: AudienciaIdade[] = (perfil?.audiencia_idade as AudienciaIdade[]) ?? [];
  const estados: TopEstado[] = (perfil?.top_estados as TopEstado[]) ?? [];

  // Status das conexões
  const igConectado = !!perfil?.meta_access_token;
  const igExpirado =
    igConectado &&
    !!perfil?.meta_token_expires_at &&
    new Date(perfil.meta_token_expires_at) < new Date();

  const tkConectado = !!perfil?.tiktok_refresh_token;
  const tkExpirado =
    tkConectado &&
    !!perfil?.tiktok_refresh_expires_at &&
    new Date(perfil.tiktok_refresh_expires_at) < new Date();

  // Top empresas por visualizações (mídia kit)
  const viewCount: Record<string, number> = {};
  for (const v of views ?? []) {
    viewCount[v.access_id] = (viewCount[v.access_id] ?? 0) + 1;
  }
  const reqMap: Record<string, { empresa: string; nome: string }> = {};
  for (const r of solicitacoes ?? []) {
    reqMap[r.id] = { empresa: r.empresa, nome: r.nome };
  }
  const topEmpresas = (acessos ?? [])
    .filter((a) => a.request_id !== null)
    .map((a) => ({
      empresa: reqMap[a.request_id!]?.empresa ?? "—",
      views: viewCount[a.id] ?? 0,
      ativo: !a.revoked_at,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  // Dados para os gráficos (serializáveis)
  const chartData: MetricaChartRow[] = metricas.map((m) => ({
    mes: mesLabel(m.reference_month),
    igSeguidores: m.instagram_followers,
    tkSeguidores: m.tiktok_followers,
    igEngajamento: m.instagram_engagement ?? 0,
    tkEngajamento: m.tiktok_engagement ?? 0,
    igAlcance: m.instagram_reach,
    tkViews: m.tiktok_views,
  }));

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-xl font-semibold text-foreground">Métricas</h1>
        <div className="flex flex-wrap items-center gap-3">
          <SyncHistory logs={(syncLogs as SyncLog[]) ?? []} />
          <DashboardSyncButton
            igSyncedAt={perfil?.instagram_synced_at ?? null}
            tkSyncedAt={perfil?.tiktok_synced_at ?? null}
          />
        </div>
      </div>

      {/* Alertas de conexão */}
      {(!igConectado || igExpirado || !tkConectado || tkExpirado) && (
        <div className="space-y-2">
          {!igConectado && (
            <AlertaBanner
              tipo="aviso"
              mensagem="Instagram não conectado — os dados do IG não serão sincronizados."
              href="/admin/perfil"
              cta="Conectar"
            />
          )}
          {igConectado && igExpirado && (
            <AlertaBanner
              tipo="erro"
              mensagem="Token do Instagram expirou — reconecte para retomar o sync automático."
              href="/admin/perfil"
              cta="Reconectar"
            />
          )}
          {!tkConectado && (
            <AlertaBanner
              tipo="aviso"
              mensagem="TikTok não conectado — os dados do TikTok não serão sincronizados."
              href="/admin/perfil"
              cta="Conectar"
            />
          )}
          {tkConectado && tkExpirado && (
            <AlertaBanner
              tipo="erro"
              mensagem="Conexão com TikTok expirou — reconecte para retomar o sync automático."
              href="/admin/perfil"
              cta="Reconectar"
            />
          )}
        </div>
      )}

      {/* Instagram */}
      <section>
        <SectionHeader
          title={`Instagram${perfil?.instagram_username ? ` · @${perfil.instagram_username}` : ""}`}
          icon={
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-primary" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          }
        />

        {!igConectado ? (
          <p className="text-sm text-muted-foreground">
            Conecte o Instagram em{" "}
            <Link href="/admin/perfil" className="text-primary underline underline-offset-2">
              Perfil
            </Link>{" "}
            para ver as métricas.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            <StatCard
              label="Seguidores"
              value={fmtNum(atual?.instagram_followers ?? perfil?.instagram_followers)}
              sub={`Sync ${tempoAtras(perfil?.instagram_synced_at)}`}
              {...compara(atual?.instagram_followers, anterior?.instagram_followers, fmtNum, anteriorMes)}
            />
            <StatCard
              label="Alcance"
              value={fmtNum(atual?.instagram_reach)}
              sub="Últimos 30 dias"
              hint="Contas únicas que viram ao menos um conteúdo"
              {...compara(atual?.instagram_reach, anterior?.instagram_reach, fmtNum, anteriorMes)}
            />
            <StatCard
              label="Engajamento"
              value={fmtPct(atual?.instagram_engagement)}
              sub="Interações ÷ alcance"
              hint="Taxa calculada sobre o alcance do período"
              {...compara(atual?.instagram_engagement, anterior?.instagram_engagement, fmtPct, anteriorMes)}
            />
            <StatCard
              label="Interações"
              value={fmtNum(atual?.instagram_interactions)}
              sub="Últimos 30 dias"
              hint="Curtidas + comentários + saves + shares (exceto Stories)"
              {...compara(atual?.instagram_interactions, anterior?.instagram_interactions, fmtNum, anteriorMes)}
            />
            <StatCard
              label="Salvamentos"
              value={fmtNum(atual?.instagram_saves)}
              sub="Últimos 30 dias"
              hint="Posts salvos pelos seguidores — indica conteúdo de valor"
              {...compara(atual?.instagram_saves, anterior?.instagram_saves, fmtNum, anteriorMes)}
            />
            <StatCard
              label="Compartilhamentos"
              value={fmtNum(atual?.instagram_shares)}
              sub="Últimos 30 dias"
              {...compara(atual?.instagram_shares, anterior?.instagram_shares, fmtNum, anteriorMes)}
            />
          </div>
        )}
      </section>

      {/* TikTok */}
      <section>
        <SectionHeader
          title={`TikTok${perfil?.tiktok_username ? ` · @${perfil.tiktok_username}` : ""}`}
          icon={
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
            </svg>
          }
        />

        {!tkConectado ? (
          <p className="text-sm text-muted-foreground">
            Conecte o TikTok em{" "}
            <Link href="/admin/perfil" className="text-primary underline underline-offset-2">
              Perfil
            </Link>{" "}
            para ver as métricas.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard
              label="Seguidores"
              value={fmtNum(atual?.tiktok_followers ?? perfil?.tiktok_followers)}
              sub={`Sync ${tempoAtras(perfil?.tiktok_synced_at)}`}
              {...compara(atual?.tiktok_followers, anterior?.tiktok_followers, fmtNum, anteriorMes)}
            />
            <StatCard
              label="Views"
              value={fmtNum(atual?.tiktok_views)}
              sub="Últimos 28 dias"
              hint="Soma das visualizações dos vídeos publicados no período"
              {...compara(atual?.tiktok_views, anterior?.tiktok_views, fmtNum, anteriorMes)}
            />
            <StatCard
              label="Engajamento"
              value={fmtPct(atual?.tiktok_engagement)}
              sub="Interações ÷ views"
              hint="Curtidas + comentários + compartilhamentos sobre total de views"
              {...compara(atual?.tiktok_engagement, anterior?.tiktok_engagement, fmtPct, anteriorMes)}
            />
            <StatCard
              label="Curtidas"
              value={fmtNum(atual?.tiktok_likes)}
              sub="Últimos 28 dias"
              {...compara(atual?.tiktok_likes, anterior?.tiktok_likes, fmtNum, anteriorMes)}
            />
            <StatCard
              label="Compartilhamentos"
              value={fmtNum(atual?.tiktok_shares)}
              sub="Últimos 28 dias"
              {...compara(atual?.tiktok_shares, anterior?.tiktok_shares, fmtNum, anteriorMes)}
            />
          </div>
        )}
      </section>

      {/* Gráficos de tendência */}
      {metricas.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-semibold text-foreground">Tendências mensais</h2>
          <MetricasCharts data={chartData} />
        </section>
      )}

      {/* Audiência */}
      {(genero.length > 0 || idade.length > 0 || estados.length > 0) && (
        <section>
          <h2 className="mb-4 text-sm font-semibold text-foreground">Audiência</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {genero.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Gênero
                </p>
                <div className="space-y-3">
                  {genero.map((g) => (
                    <AudienciaBar key={g.label} label={g.label} pct={g.pct} />
                  ))}
                </div>
              </div>
            )}

            {idade.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Faixa etária
                </p>
                <div className="space-y-3">
                  {idade.map((a) => (
                    <AudienciaBar key={a.faixa} label={a.faixa} pct={a.pct} />
                  ))}
                </div>
              </div>
            )}

            {estados.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Top cidades
                </p>
                <div className="space-y-3">
                  {estados.map((e) => (
                    <AudienciaBar key={e.uf} label={e.uf} pct={e.pct} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Mídia Kit */}
      <section>
        <h2 className="mb-4 text-sm font-semibold text-foreground">Mídia Kit</h2>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">Pendentes</p>
            <p className="mt-1.5 text-2xl font-bold text-warning">{pendentes ?? 0}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">Aprovadas</p>
            <p className="mt-1.5 text-2xl font-bold text-success">{aprovados ?? 0}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">Reprovadas</p>
            <p className="mt-1.5 text-2xl font-bold text-muted-foreground">{reprovados ?? 0}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">Visualizações</p>
            <p className="mt-1.5 text-2xl font-bold text-primary">{fmtNum(totalViews ?? 0)}</p>
          </div>
        </div>

        {topEmpresas.length > 0 && (
          <>
            <p className="mb-3 text-xs font-semibold text-muted-foreground">
              Empresas com mais acessos
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[400px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Empresa
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Acesso
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                      Views
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topEmpresas.map((e, i) => (
                    <tr
                      key={i}
                      className="border-b border-border last:border-0 transition-colors hover:bg-muted/40"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{e.empresa}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            e.ativo
                              ? "bg-success/10 text-success"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {e.ativo ? "Ativo" : "Revogado"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-primary">
                        {e.views}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
