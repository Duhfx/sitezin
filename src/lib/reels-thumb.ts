import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Reel } from "@/types/database";
import { processarBytes } from "./upload";

// Materializa a capa dos reels: baixa a `thumbSource` (URL do CDN do Instagram,
// que expira) e salva no bucket público `media` — permanente. Chamada nos dois
// gatilhos de sync (manual e cron), logo antes de gravar os reels no perfil.
//
// - Idempotente: só age em reels SEM `thumb` própria; re-syncs não rebaixam nada.
// - Resiliente: falha por reel deixa o reel sem `thumb` (a apresentação filtra
//   reels sem capa), nunca derruba o sync.
// - `thumbSource` é sempre removida do reel salvo — é transitória, nunca persiste.
export async function materializarThumbsReels(
  supabase: SupabaseClient<Database>,
  reels: Reel[],
): Promise<Reel[]> {
  const out: Reel[] = [];
  for (const reel of reels) {
    const { thumbSource, ...limpo } = reel;

    // Já tem capa própria ou o sync não trouxe origem → segue sem baixar.
    if (limpo.thumb || !thumbSource) {
      out.push(limpo);
      continue;
    }

    try {
      const resp = await fetch(thumbSource);
      if (!resp.ok) throw new Error(`download falhou (status ${resp.status})`);
      const proc = await processarBytes(Buffer.from(await resp.arrayBuffer()));
      if ("error" in proc) throw new Error(proc.error);

      const path = `reels/${crypto.randomUUID()}.${proc.ext}`;
      const { data, error } = await supabase.storage
        .from("media")
        .upload(path, proc.bytes, { contentType: proc.contentType });
      if (error) throw error;

      const { data: urlData } = supabase.storage.from("media").getPublicUrl(data.path);
      out.push({ ...limpo, thumb: urlData.publicUrl });
    } catch {
      out.push(limpo); // não conseguiu a capa → segue sem thumb
    }
  }
  return out;
}
