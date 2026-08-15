/** @type {import('next').NextConfig} */
const nextConfig = {
  // O Chromium do @sparticuz/chromium é um binário de ~50MB empacotado em brotli.
  // Sem isso o webpack tenta bundlar e o build quebra. Vale para a rota que gera
  // o PDF do mídia kit (src/app/api/midia-kit/pdf/route.ts).
  experimental: {
    serverComponentsExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
    // O @sparticuz/chromium abre os .br de bin/ por caminho montado em runtime, e
    // o rastreamento de arquivos do Next não enxerga isso — sem esta linha a
    // função sobe SEM o binário e quebra em produção com "file not found"
    // (localmente passa despercebido porque o dev usa o Chrome da máquina).
    outputFileTracingIncludes: {
      "/api/midia-kit/pdf": ["./node_modules/@sparticuz/chromium/bin/**"],
    },
  },
  images: {
    // Otimização on-the-fly do Vercel (/_next/image) reabilitada na homologação
    // para validar se a cota restaurada aguenta. Foi desligada porque estourava a
    // cota e retornava 402 (OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED). Se voltar a
    // dar 402, volte para `unoptimized: true` — processarImagem() (src/lib/upload.ts)
    // já entrega WebP leve servido direto pelo CDN do Supabase.
    unoptimized: false,
    // Cache da imagem otimizada por 31 dias (o padrão herdaria o max-age=3600 do
    // Supabase Storage e re-transformaria a cada hora — lento e gasta cota). Os
    // arquivos têm nome UUID (imutáveis no mesmo path), então cache longo é seguro.
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
