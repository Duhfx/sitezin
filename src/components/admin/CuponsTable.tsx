"use client";

import { useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { toggleAtivoCupom, removerCupom } from "@/app/admin/(protected)/cupons/actions";
import type { Coupon } from "@/types/database";

type Props = { cupons: Coupon[] };

export default function CuponsTable({ cupons }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleToggle(id: string, ativo: boolean) {
    startTransition(async () => {
      await toggleAtivoCupom(id, !ativo);
    });
  }

  function handleRemover(id: string) {
    if (!window.confirm("Remover este cupom? Esta ação não pode ser desfeita.")) return;
    startTransition(async () => {
      await removerCupom(id);
    });
  }

  if (cupons.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Nenhum cupom cadastrado.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted">
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Logo</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Marca</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Cupom</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {cupons.map((c) => (
            <tr
              key={c.id}
              className="border-b border-border last:border-0 transition-colors hover:bg-muted/40"
            >
              <td className="px-4 py-3">
                {c.logo_url ? (
                  <Image
                    src={c.logo_url}
                    alt={c.marca}
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded object-contain"
                  />
                ) : (
                  <div className="h-9 w-9 rounded bg-muted" />
                )}
              </td>
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">{c.marca}</p>
                <p className="max-w-xs truncate text-xs text-muted-foreground">{c.descricao}</p>
              </td>
              <td className="px-4 py-3">
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {c.cupom}
                </code>
              </td>
              <td className="px-4 py-3">
                <Badge variant={c.ativo ? "success" : "neutral"}>
                  {c.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={isPending}
                    onClick={() => handleToggle(c.id, c.ativo)}
                  >
                    {c.ativo ? "Desativar" : "Ativar"}
                  </Button>
                  <Link
                    href={`/admin/cupons/${c.id}/editar`}
                    className="inline-flex items-center justify-center rounded px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    Editar
                  </Link>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={isPending}
                    onClick={() => handleRemover(c.id)}
                  >
                    Remover
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
