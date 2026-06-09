"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import { salvarMetricas, editarMetricas } from "@/app/admin/(protected)/perfil/metricas/actions";
import type { InfluencerMetrics } from "@/types/database";

type Props = { initialData?: InfluencerMetrics };

const CAMPOS_INSTAGRAM = [
  { name: "instagram_followers", label: "Seguidores" },
  { name: "instagram_reach", label: "Alcance (30d)" },
  { name: "instagram_impressions", label: "Impressões (30d)" },
  { name: "instagram_engagement", label: "Taxa de Engajamento (%)", isFloat: true },
] as const;

const CAMPOS_TIKTOK = [
  { name: "tiktok_followers", label: "Seguidores" },
  { name: "tiktok_views", label: "Views Médias" },
  { name: "tiktok_likes", label: "Curtidas Totais" },
  { name: "tiktok_engagement", label: "Taxa de Engajamento (%)", isFloat: true },
] as const;

export default function MetricasForm({ initialData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!initialData;

  const monthValue = initialData?.reference_month?.slice(0, 7);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    if (!String(formData.get("reference_month") ?? "").trim()) {
      setError("Selecione o mês de referência.");
      return;
    }

    setLoading(true);
    const result = isEdit
      ? await editarMetricas(initialData.id, formData)
      : await salvarMetricas(formData);
    setLoading(false);

    if (result?.ok) {
      router.push("/admin/perfil?tab=metricas");
    } else if (result) {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8 max-w-3xl">
      <div className="max-w-sm space-y-1.5">
        <Label htmlFor="reference_month">Mês de referência</Label>
        <Input
          id="reference_month"
          name="reference_month"
          type="month"
          defaultValue={monthValue}
        />
      </div>

      <div className="space-y-4">
        <h3 className="border-b pb-2 text-lg font-medium text-foreground">Instagram</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {CAMPOS_INSTAGRAM.map((c) => (
            <div key={c.name} className="space-y-1.5">
              <Label htmlFor={c.name}>{c.label}</Label>
              <Input
                id={c.name}
                name={c.name}
                type="number"
                min="0"
                step={"isFloat" in c && c.isFloat ? "0.01" : "1"}
                defaultValue={initialData?.[c.name] ?? ""}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="border-b pb-2 text-lg font-medium text-foreground">TikTok</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {CAMPOS_TIKTOK.map((c) => (
            <div key={c.name} className="space-y-1.5">
              <Label htmlFor={c.name}>{c.label}</Label>
              <Input
                id={c.name}
                name={c.name}
                type="number"
                min="0"
                step={"isFloat" in c && c.isFloat ? "0.01" : "1"}
                defaultValue={initialData?.[c.name] ?? ""}
              />
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-sm bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando…" : isEdit ? "Salvar alterações" : "Registrar métricas"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/admin/perfil?tab=metricas")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
