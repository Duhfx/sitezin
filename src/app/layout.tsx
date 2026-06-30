import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    template: "Aline — %s",
    default: "Aline",
  },
  description: "Cupons e oportunidades de parceria",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${lora.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        {/* Marca o documento como "com JS" antes do paint. Os reveals de entrada
            (.reveal em globals.css) só escondem conteúdo quando html.js existe —
            sem JS / antes da hidratação, tudo permanece visível (nunca em branco). */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
