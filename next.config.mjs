/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Otimização on-the-fly do Vercel (/_next/image) reabilitada na homologação
    // para validar se a cota restaurada aguenta. Foi desligada porque estourava a
    // cota e retornava 402 (OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED). Se voltar a
    // dar 402, volte para `unoptimized: true` — processarImagem() (src/lib/upload.ts)
    // já entrega WebP leve servido direto pelo CDN do Supabase.
    unoptimized: false,
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
