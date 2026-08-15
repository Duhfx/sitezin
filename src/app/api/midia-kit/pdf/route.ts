import { existsSync } from "node:fs";
import { type NextRequest } from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteer, { type Browser } from "puppeteer-core";
import { requireUser } from "@/lib/supabase/server";
import { PAGE_W, PAGE_H } from "@/components/midia-kit/MediaKitDeckPdf";

// Gera o PDF do mídia kit abrindo /admin/midia-kit-pdf num Chrome headless.
//
// Por que headless e não window.print(): o diálogo de impressão do navegador
// controla margem, escala e o checkbox "gráficos de plano de fundo" (que vem
// DESMARCADO por padrão), então a mesma página podia sair de dois jeitos e o mais
// provável era sem cor nenhuma. Aqui a saída é sempre a mesma, e o clique baixa o
// arquivo direto, já nomeado.
//
// A rota não renderiza nada por conta própria: ela abre a página de
// pré-visualização, que continua sendo a única fonte de verdade do layout.
export const maxDuration = 60;

// puppeteer-core e @sparticuz/chromium têm as versões FIXAS (sem ^) e pareadas:
// cada release do puppeteer fala o protocolo de uma versão específica do Chrome, e
// o @sparticuz/chromium entrega o binário. Hoje: puppeteer-core 25.1.0 ↔ Chromium
// 149. Ao subir um, confira o par em https://pptr.dev/chromium-support e suba o
// outro junto — descasar é falha só em produção, porque o dev usa o Chrome local.

// O @sparticuz/chromium é um binário Linux — na Vercel é ele; no dev local quem
// faz o papel é o Chrome instalado na máquina.
const CHROMES_LOCAIS = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];

async function abrirNavegador(): Promise<Browser> {
  if (process.env.VERCEL) {
    // headless: "shell" (e não true) porque o binário do @sparticuz é o
    // chrome-headless-shell; o headless novo do Chrome não sobe nele.
    return puppeteer.launch({
      args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
      executablePath: await chromium.executablePath(),
      headless: "shell",
    });
  }

  const executablePath = CHROMES_LOCAIS.find((p) => p && existsSync(p));
  if (!executablePath) {
    throw new Error(
      "Chrome não encontrado para gerar o PDF. Defina CHROME_PATH no .env.local " +
        "apontando para o executável do Chrome (ver .env.example)."
    );
  }
  return puppeteer.launch({ executablePath, headless: true });
}

export async function GET(request: NextRequest) {
  if (!(await requireUser())) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  // A origem sai do próprio request em vez de NEXT_PUBLIC_APP_URL: assim o dev
  // local não tenta gerar o PDF do site em produção, e cada deploy de preview
  // renderiza a si mesmo.
  const origem = new URL(request.url).origin;
  const alvo = `${origem}/admin/midia-kit-pdf`;

  let browser: Browser | undefined;
  try {
    browser = await abrirNavegador();
    const page = await browser.newPage();
    await page.setViewport({ width: PAGE_W, height: PAGE_H, deviceScaleFactor: 2 });

    // A página está atrás do middleware (/admin/:path*). Repassar o cookie do
    // request reaproveita a sessão de quem clicou — sem inventar outro mecanismo
    // de autenticação só para o Chrome headless.
    const cabecalhos: Record<string, string> = {};
    const cookie = request.headers.get("cookie");
    if (cookie) cabecalhos.cookie = cookie;

    // Em deploy de preview com Deployment Protection ligada, a função chamando a
    // própria URL leva 401. A Vercel injeta este segredo quando "Protection Bypass
    // for Automation" está ativo no projeto; sem ele a variável não existe e a
    // linha não faz nada (produção nunca precisa disso).
    const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    if (bypass) cabecalhos["x-vercel-protection-bypass"] = bypass;

    await page.setExtraHTTPHeaders(cabecalhos);

    const resposta = await page.goto(alvo, { waitUntil: "networkidle0", timeout: 45_000 });
    if (!resposta?.ok() || page.url().includes("/admin/login")) {
      throw new Error("A página do mídia kit não carregou (sessão não repassada?).");
    }

    // networkidle0 diz que a rede parou, não que dá para fotografar: fonte ainda
    // em fallback muda todo o espaçamento e imagem não decodificada sai em branco.
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        Array.from(document.images).map((img) => img.decode().catch(() => {}))
      );
    });

    const arquivo =
      (await page.$eval(".deck-root", (el) => (el as HTMLElement).dataset.arquivo).catch(() => null)) ??
      "midia-kit.pdf";

    const pdf = await page.pdf({
      width: `${PAGE_W}px`,
      height: `${PAGE_H}px`,
      printBackground: true,
    });

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${arquivo}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Falha ao gerar o PDF.";
    return Response.json({ error: mensagem }, { status: 500 });
  } finally {
    await browser?.close();
  }
}
