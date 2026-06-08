"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Image from "next/image";
import { criarCupom, editarCupom } from "@/app/admin/(protected)/cupons/actions";
import type { Coupon } from "@/types/database";

type Props = { initialData?: Coupon };

export default function CupomForm({ initialData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!initialData;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const get = (k: string) => String(formData.get(k) ?? "").trim();

    if (!get("marca") || !get("descricao") || !get("cupom")) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    const result = isEdit
      ? await editarCupom(initialData.id, formData)
      : await criarCupom(formData);
    setLoading(false);

    if (result && !result.ok) {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 max-w-lg">
      {isEdit && (
        <input type="hidden" name="logo_url_atual" value={initialData.logo_url ?? ""} />
      )}

      <div className="space-y-1.5">
        <Label htmlFor="marca">Marca</Label>
        <Input id="marca" name="marca" defaultValue={initialData?.marca} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="descricao">Descrição</Label>
        <Input id="descricao" name="descricao" defaultValue={initialData?.descricao} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cupom">Código do cupom</Label>
        <Input id="cupom" name="cupom" defaultValue={initialData?.cupom} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="affiliate_url">URL de afiliado (Opcional)</Label>
        <Input
          id="affiliate_url"
          name="affiliate_url"
          type="url"
          defaultValue={initialData?.affiliate_url}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="logo">
          Logo
          {isEdit && (
            <span className="ml-1 text-muted-foreground">(deixe em branco para manter a atual)</span>
          )}
        </Label>
        {isEdit && initialData.logo_url && (
          <Image
            src={initialData.logo_url}
            alt="Logo atual"
            width={48}
            height={48}
            className="h-12 w-12 rounded border border-border object-contain mb-2"
          />
        )}
        <input
          id="logo"
          name="logo"
          type="file"
          accept="image/*"
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-secondary-foreground"
        />
      </div>

      {error && (
        <p className="rounded-sm bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar cupom"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/cupons")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
