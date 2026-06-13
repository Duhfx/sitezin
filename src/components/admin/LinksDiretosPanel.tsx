"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import CopiarLink from "@/components/admin/CopiarLink";
import {
  gerarLinkDireto,
  revogarAcesso,
} from "@/app/admin/(protected)/solicitacoes/actions";
import type { MediaKitAccess } from "@/types/database";

function validadePadrao() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function LinkDiretoItem({
  link,
  appUrl,
  onRevoke,
}: {
  link: MediaKitAccess;
  appUrl: string;
  onRevoke: (id: string) => void;
}) {
  const [confirmRevogar, setConfirmRevogar] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const ativo = !link.revoked_at;
  const linkUrl = `${appUrl}/midia-kit/acesso/${link.slug ?? link.token}`;

  function handleRevogar() {
    setError("");
    startTransition(async () => {
      const result = await revogarAcesso(link.id);
      if (result.ok) {
        onRevoke(link.id);
      } else {
        setError(result.error ?? "Erro desconhecido.");
      }
    });
  }

  return (
    <div className="rounded-md border border-border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">
            {link.label || "Sem identificação"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Criado em {formatarData(link.created_at)}
            {link.expires_at && ` · Expira em ${formatarData(link.expires_at)}`}
          </p>
        </div>
        <span
          className={`text-[10px] font-semibold rounded-full px-2 py-0.5 leading-none shrink-0 ${
            ativo
              ? "bg-success/15 text-success"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {ativo ? "Ativo" : "Revogado"}
        </span>
      </div>

      {ativo && (
        <>
          <CopiarLink link={linkUrl} />
          <div>
            {confirmRevogar ? (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-2 space-y-2">
                <p className="text-xs font-medium text-foreground">
                  Revogar este link?
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleRevogar}
                    disabled={isPending}
                  >
                    {isPending ? "Revogando…" : "Sim, revogar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmRevogar(false)}
                    disabled={isPending}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmRevogar(true)}
                className="text-xs text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
              >
                Revogar
              </button>
            )}
            {error && (
              <p className="text-xs text-destructive mt-1">{error}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function LinksDiretosPanel({
  linksIniciais,
  appUrl,
}: {
  linksIniciais: MediaKitAccess[];
  appUrl: string;
}) {
  const [links, setLinks] = useState(linksIniciais);
  const [label, setLabel] = useState("");
  const [validade, setValidade] = useState(validadePadrao());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [aberto, setAberto] = useState(false);

  function handleGerar() {
    setError("");
    startTransition(async () => {
      const result = await gerarLinkDireto(label.trim(), validade);
      if (result.ok) {
        setLinks((prev) => [result.data, ...prev]);
        setLabel("");
        setValidade(validadePadrao());
        setAberto(false);
      } else {
        setError(result.error ?? "Erro desconhecido.");
      }
    });
  }

  function handleRevoke(id: string) {
    setLinks((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, revoked_at: new Date().toISOString() } : l,
      ),
    );
  }

  return (
    <div className="mb-6 rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Links de acesso direto
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Compartilhe o mídia kit sem precisar de uma solicitação.
          </p>
        </div>
        {!aberto && (
          <Button size="sm" onClick={() => setAberto(true)}>
            + Gerar link
          </Button>
        )}
      </div>

      {aberto && (
        <div className="rounded-md border border-border bg-background p-3 space-y-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted-foreground">
              Identificação{" "}
              <span className="font-normal">(para quem é este link?)</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: João Silva, Evento X…"
              maxLength={80}
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted-foreground">
              Validade{" "}
              <span className="font-normal">
                (deixe em branco para não expirar)
              </span>
            </label>
            <input
              type="date"
              value={validade}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setValidade(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button
              onClick={handleGerar}
              disabled={isPending || !label.trim()}
            >
              {isPending ? "Gerando…" : "Gerar link"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setAberto(false);
                setError("");
              }}
              disabled={isPending}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {links.length === 0 && !aberto && (
        <p className="text-xs text-muted-foreground">
          Nenhum link direto gerado ainda.
        </p>
      )}

      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((link) => (
            <LinkDiretoItem
              key={link.id}
              link={link}
              appUrl={appUrl}
              onRevoke={handleRevoke}
            />
          ))}
        </div>
      )}
    </div>
  );
}
