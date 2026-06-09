"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Textarea from "@/components/ui/Textarea";
import { salvarPerfil } from "@/app/admin/(protected)/perfil/actions";
import type { Case, Formato, InfluencerProfile, TopEstado } from "@/types/database";

type Props = { initialData: InfluencerProfile };

export default function PerfilForm({ initialData }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [topEstados, setTopEstados] = useState<TopEstado[]>(initialData.top_estados ?? []);
  const [formatos, setFormatos] = useState<Formato[]>(initialData.formatos ?? []);
  const [cases, setCases] = useState<Case[]>(initialData.cases ?? []);

  const moodboardInicial = initialData.moodboard ?? [];
  const [fotoPreview, setFotoPreview] = useState<string | null>(initialData.foto_url ?? null);
  const [moodboardPreviews, setMoodboardPreviews] = useState<(string | null)[]>([
    moodboardInicial[0] ?? null,
    moodboardInicial[1] ?? null,
    moodboardInicial[2] ?? null,
  ]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    if (!String(formData.get("nome") ?? "").trim()) {
      setError("Informe o nome.");
      return;
    }

    setLoading(true);
    const result = await salvarPerfil(formData);
    setLoading(false);

    if (result?.ok) {
      setSuccess(true);
    } else if (result) {
      setError(result.error ?? "Erro ao salvar o perfil.");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-10 max-w-3xl">
      {/* Listas serializadas */}
      <input type="hidden" name="top_estados" value={JSON.stringify(topEstados)} />
      <input type="hidden" name="formatos" value={JSON.stringify(formatos)} />
      <input type="hidden" name="cases" value={JSON.stringify(cases)} />
      <input type="hidden" name="foto_url_atual" value={initialData.foto_url ?? ""} />

      {/* ── Identidade ──────────────────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="border-b pb-2 text-lg font-medium text-foreground">Identidade</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" defaultValue={initialData.nome} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nicho">Nicho</Label>
            <Input id="nicho" name="nicho" defaultValue={initialData.nicho} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="biografia">Biografia</Label>
          <Textarea id="biografia" name="biografia" rows={3} defaultValue={initialData.biografia} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="publico_alvo">Público-alvo</Label>
          <Input id="publico_alvo" name="publico_alvo" defaultValue={initialData.publico_alvo} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="foto">
            Foto de perfil
            <span className="ml-1 font-normal text-muted-foreground">(deixe em branco para manter a atual)</span>
          </Label>
          {fotoPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fotoPreview}
              alt="Foto de perfil"
              className="mb-2 h-16 w-16 rounded border border-border object-cover"
            />
          )}
          <input
            id="foto"
            name="foto"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setFotoPreview(URL.createObjectURL(file));
            }}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-secondary-foreground"
          />
        </div>
      </section>

      {/* ── Redes & Contato ─────────────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="border-b pb-2 text-lg font-medium text-foreground">Redes & Contato</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="instagram_url">Instagram (URL)</Label>
            <Input id="instagram_url" name="instagram_url" type="url" defaultValue={initialData.instagram_url ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tiktok_url">TikTok (URL)</Label>
            <Input id="tiktok_url" name="tiktok_url" type="url" defaultValue={initialData.tiktok_url ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="youtube_url">YouTube (URL)</Label>
            <Input id="youtube_url" name="youtube_url" type="url" defaultValue={initialData.youtube_url ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail comercial</Label>
            <Input id="email" name="email" type="email" defaultValue={initialData.email ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input id="whatsapp" name="whatsapp" defaultValue={initialData.whatsapp ?? ""} placeholder="+55 47 99999-9999" />
          </div>
        </div>
      </section>

      {/* ── Top Estados ─────────────────────────────────────────── */}
      <ListEditor
        titulo="Top Estados"
        itens={topEstados}
        onAdd={() => setTopEstados([...topEstados, { uf: "", pct: 0 }])}
        onRemove={(i) => setTopEstados(topEstados.filter((_, idx) => idx !== i))}
        render={(estado, i) => (
          <div className="grid grid-cols-[1fr_7rem] gap-3">
            <div className="space-y-1">
              <Input
                placeholder="SP"
                value={estado.uf}
                onChange={(e) => {
                  const next = [...topEstados];
                  next[i] = { ...next[i], uf: e.target.value };
                  setTopEstados(next);
                }}
              />
            </div>
            <Input
              type="number"
              min="0"
              max="100"
              placeholder="%"
              value={estado.pct}
              onChange={(e) => {
                const next = [...topEstados];
                next[i] = { ...next[i], pct: Number(e.target.value) };
                setTopEstados(next);
              }}
            />
          </div>
        )}
      />

      {/* ── Formatos ────────────────────────────────────────────── */}
      <ListEditor
        titulo="Formatos disponíveis"
        itens={formatos}
        onAdd={() => setFormatos([...formatos, { nome: "", descricao: "" }])}
        onRemove={(i) => setFormatos(formatos.filter((_, idx) => idx !== i))}
        render={(formato, i) => (
          <div className="space-y-2">
            <Input
              placeholder="Nome (ex: Reels)"
              value={formato.nome}
              onChange={(e) => {
                const next = [...formatos];
                next[i] = { ...next[i], nome: e.target.value };
                setFormatos(next);
              }}
            />
            <Input
              placeholder="Descrição"
              value={formato.descricao}
              onChange={(e) => {
                const next = [...formatos];
                next[i] = { ...next[i], descricao: e.target.value };
                setFormatos(next);
              }}
            />
          </div>
        )}
      />

      {/* ── Cases ───────────────────────────────────────────────── */}
      <ListEditor
        titulo="Cases"
        itens={cases}
        onAdd={() => setCases([...cases, { marca: "", resultado: "", periodo: "" }])}
        onRemove={(i) => setCases(cases.filter((_, idx) => idx !== i))}
        render={(caso, i) => (
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Input
                placeholder="Marca"
                value={caso.marca}
                onChange={(e) => {
                  const next = [...cases];
                  next[i] = { ...next[i], marca: e.target.value };
                  setCases(next);
                }}
              />
              <Input
                placeholder="Período (ex: Jan 2024)"
                value={caso.periodo}
                onChange={(e) => {
                  const next = [...cases];
                  next[i] = { ...next[i], periodo: e.target.value };
                  setCases(next);
                }}
              />
            </div>
            <Input
              placeholder="Resultado"
              value={caso.resultado}
              onChange={(e) => {
                const next = [...cases];
                next[i] = { ...next[i], resultado: e.target.value };
                setCases(next);
              }}
            />
          </div>
        )}
      />

      {/* ── Moodboard (3 imagens fixas) ─────────────────────────── */}
      <section className="space-y-4">
        <h3 className="border-b pb-2 text-lg font-medium text-foreground">Moodboard</h3>

        <div className="flex items-start gap-2 rounded-md bg-warning/10 px-3 py-2.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 h-4 w-4 shrink-0 text-warning">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="text-xs text-warning">
            A galeria do mídia kit só aparece quando as 3 imagens estiverem preenchidas.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Imagem {i + 1} de 3</p>
              <input type="hidden" name={`moodboard_url_atual_${i}`} value={moodboardInicial[i] ?? ""} />
              {moodboardPreviews[i] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={moodboardPreviews[i]!}
                  alt={`Moodboard ${i + 1}`}
                  className="h-28 w-full rounded border border-border object-cover"
                />
              )}
              <input
                name={`moodboard_${i}`}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const next = [...moodboardPreviews];
                    next[i] = URL.createObjectURL(file);
                    setMoodboardPreviews(next);
                  }
                }}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-secondary-foreground"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── Barra de salvar sticky ───────────────────────────────── */}
      <div className="sticky bottom-0 z-10 flex items-center gap-4 border-t border-border bg-background/95 py-4 backdrop-blur-sm">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando…" : "Salvar alterações"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm font-medium text-success">Perfil salvo com sucesso!</p>}
      </div>
    </form>
  );
}

// ── Editor genérico de lista ──────────────────────────────────────
function ListEditor<T>({
  titulo,
  itens,
  onAdd,
  onRemove,
  render,
}: {
  titulo: string;
  itens: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  render: (item: T, index: number) => React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="text-lg font-medium text-foreground">{titulo}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onAdd}>
          + Adicionar
        </Button>
      </div>
      {itens.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum item.</p>
      ) : (
        <div className="space-y-3">
          {itens.map((item, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
              <div className="flex-1">{render(item, i)}</div>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="shrink-0 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
