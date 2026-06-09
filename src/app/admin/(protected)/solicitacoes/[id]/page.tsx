import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import SolicitacaoAcoes from "@/components/admin/SolicitacaoAcoes";
import CopiarLink from "@/components/admin/CopiarLink";

type Status = "pendente" | "aprovado" | "reprovado";

const badgeVariant: Record<Status, "warning" | "success" | "destructive"> = {
  pendente: "warning",
  aprovado: "success",
  reprovado: "destructive",
};

const statusLabel: Record<Status, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
};

function Campo({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  );
}

export default async function DetalheSolicitacaoPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const { data: req } = await supabase
    .from("media_kit_requests")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!req) notFound();

  const { data: acesso } = await supabase
    .from("media_kit_access")
    .select("*")
    .eq("request_id", params.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const linkMidiaKit = acesso ? `${appUrl}/midia-kit/acesso/${acesso.token}` : null;
  const acessoAtivo = acesso && !acesso.revoked_at;
  const status = req.status as Status;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/solicitacoes"
          className="inline-flex items-center justify-center rounded px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          ← Voltar
        </Link>
        <h1 className="text-xl font-semibold text-foreground">{req.empresa}</h1>
        <Badge variant={badgeVariant[status]}>
          {statusLabel[status] ?? req.status}
        </Badge>
      </div>

      <div className="space-y-4 max-w-2xl">
        {/* Dados da solicitação */}
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-foreground">Dados da solicitação</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo label="Nome" value={req.nome} />
            <Campo label="Empresa" value={req.empresa} />
            <Campo label="Cargo" value={req.cargo} />
            <Campo label="E-mail" value={req.email} />
            <Campo label="WhatsApp" value={req.whatsapp} />
            <Campo label="Instagram da empresa" value={req.instagram_empresa} />
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-muted-foreground">Descrição</dt>
              <dd className="mt-0.5 text-sm text-foreground whitespace-pre-wrap">{req.descricao}</dd>
            </div>
            <Campo
              label="Data de envio"
              value={new Date(req.created_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            />
          </dl>
        </Card>

        {/* Acesso ao mídia kit */}
        {acesso && linkMidiaKit && (
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-foreground">Acesso ao mídia kit</h2>
            <div className="space-y-4">
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Link exclusivo</p>
                <CopiarLink link={linkMidiaKit} />
              </div>
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Status do acesso</p>
                  <p className="mt-0.5 text-sm">
                    {acessoAtivo ? (
                      <span className="font-medium text-success">
                        Ativo{" "}
                        {acesso.expires_at &&
                          `(Expira em ${new Date(acesso.expires_at).toLocaleDateString("pt-BR")})`}
                      </span>
                    ) : (
                      <span className="font-medium text-destructive">Inativo / Revogado</span>
                    )}
                  </p>
                </div>
                {acessoAtivo && req.whatsapp && (
                  <a
                    href={`https://wa.me/${req.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Olá ${req.nome}, recebemos sua solicitação pela ${req.empresa}. O seu Mídia Kit exclusivo foi liberado!\n\nAcesse aqui: ${linkMidiaKit}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#20b858]"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                    </svg>
                    Avisar pelo WhatsApp
                  </a>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Ações */}
        {req.status === "pendente" && (
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-foreground">Ações</h2>
            <SolicitacaoAcoes tipo="pendente" requestId={req.id} />
          </Card>
        )}

        {req.status === "aprovado" && acessoAtivo && (
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-foreground">Ações</h2>
            <SolicitacaoAcoes tipo="revogar" accessId={acesso!.id} requestId={req.id} />
          </Card>
        )}
      </div>
    </div>
  );
}
