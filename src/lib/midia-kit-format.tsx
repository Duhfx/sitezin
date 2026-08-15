// ─────────────────────────────────────────────────────────────────────────────
// Formatação e ícones compartilhados pelas três versões do mídia kit:
// MediaKitPresentation (modal do admin), MediaKitPresentationEditorial (o que
// está no ar) e MediaKitDeckPdf (a exportação em PDF). Antes isso estava
// copiado nos três — mudar a regra de "120500 → 120.5K" exigia lembrar dos três.
//
// Sem "use client" de propósito: são funções puras e componentes sem hook, então
// servem tanto no componente client quanto no server component do PDF.
// ─────────────────────────────────────────────────────────────────────────────

// Janela considerada nas métricas de publicações do TikTok (views/curtidas):
// soma dos vídeos dos últimos N dias. Espelha JANELA_DIAS em src/lib/tiktok-sync.ts.
export const TIKTOK_JANELA_DIAS = 28;

export function splitNum(n: number): { value: number; suffix: string; decimals: number } {
  if (n >= 1_000_000) {
    const v = parseFloat((n / 1_000_000).toFixed(1));
    return { value: v, suffix: "M", decimals: Number.isInteger(v) ? 0 : 1 };
  }
  if (n >= 1_000) {
    const v = parseFloat((n / 1_000).toFixed(1));
    return { value: v, suffix: "K", decimals: Number.isInteger(v) ? 0 : 1 };
  }
  return { value: n, suffix: "", decimals: 0 };
}

export function fmtCompact(n: number) {
  const { value, suffix, decimals } = splitNum(n);
  return { value: value.toFixed(decimals), suffix };
}

export function splitNicho(nicho: string): string[] {
  return nicho.split(/[,&·/|]+/).map((s) => s.trim()).filter(Boolean);
}

export function fmtWhatsapp(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 13) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  return raw;
}

// Quebra uma lista em blocos de tamanho fixo. No deck do PDF é o que transforma
// "7 cases" em duas páginas de 4 + 3, em vez de uma página com conteúdo cortado.
export function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

// Número grande com sufixo K/M em tamanho menor (sem count-up animado —
// renderiza o valor final no primeiro paint).
export function BigNumber({ n, suffixClassName }: { n: number; suffixClassName?: string }) {
  const { value, suffix, decimals } = splitNum(n);
  return (
    <>
      {value.toFixed(decimals)}
      {suffix && (
        <span className={suffixClassName ?? "not-italic font-sans text-[0.45em] text-slate-400"}>
          {suffix}
        </span>
      )}
    </>
  );
}

// ─── Ícones de marca ──────────────────────────────────────────────────────────
export const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);
