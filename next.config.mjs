/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Desliga a otimização on-the-fly do Vercel (/_next/image): a cota do plano
    // estava estourando e retornando 402 (OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED),
    // quebrando todas as imagens. Não é mais necessária porque processarImagem()
    // (src/lib/upload.ts) já redimensiona + converte para WebP no upload, então os
    // arquivos no Storage já são leves e servidos direto pelo CDN do Supabase.
    unoptimized: true,
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
