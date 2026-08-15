// Check da compressão no browser (src/lib/imagem-client.ts) — o caminho que
// impede uma foto de 10–15 MB de estourar o bodySizeLimit da Server Action.
// Roda num Chrome headless de verdade porque a lógica é canvas + toBlob: não dá
// pra checar isso no Node.
//
//   node scripts/check-imagem-client.mjs
//
// Precisa do Chrome instalado (usa puppeteer-core + sharp, já dependências).

import puppeteer from "puppeteer-core";
import sharp from "sharp";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "check-imagem-"));

try {
  // Transpila o módulo TS pra ESM que o browser importa.
  execFileSync("npx", [
    "tsc", "src/lib/imagem-client.ts",
    "--target", "es2020", "--module", "es2020",
    "--lib", "es2020,dom,dom.iterable", "--types", "--skipLibCheck",
    "--outDir", tmp,
  ], { stdio: "inherit" });

  // Ruído suavizado: detalhe alto de verdade, ~6 MB em 4032x3024 (foto de celular).
  const raw = crypto.randomBytes(4032 * 3024 * 3);
  const jpg = await sharp(raw, { raw: { width: 4032, height: 3024, channels: 3 } })
    .blur(1.1)
    .jpeg({ quality: 92 })
    .toBuffer();
  const foto = path.join(tmp, "IMG_1234.jpeg");
  fs.writeFileSync(foto, jpg);

  const js = fs.readFileSync(path.join(tmp, "imagem-client.js"), "utf8");
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
  const page = await browser.newPage();
  await page.setContent('<input id="f" type="file">');
  await (await page.$("#f")).uploadFile(foto);

  const out = await page.evaluate(async (jsSrc) => {
    const mod = await import(URL.createObjectURL(new Blob([jsSrc], { type: "text/javascript" })));
    const original = document.querySelector("#f").files[0];

    // Campo de texto no mesmo FormData não pode ser tocado.
    const fd = new FormData();
    fd.set("nome", "Aline");
    fd.set("foto", original);
    const t = performance.now();
    await mod.comprimirImagensDoForm(fd);
    const ms = Math.round(performance.now() - t);

    const f = fd.get("foto");
    const bmp = await createImageBitmap(f);
    return { entrada: original.size, bytes: f.size, nome: f.name, tipo: f.type, w: bmp.width, h: bmp.height, texto: fd.get("nome"), ms };
  }, js);
  await browser.close();

  assert.strictEqual(out.texto, "Aline", "campo de texto foi alterado");
  assert.strictEqual(out.tipo, "image/webp");
  assert.strictEqual(out.nome, "IMG_1234.webp", "extensão deve acompanhar o formato");
  assert.strictEqual(out.w, 1600, "lado maior deve virar 1600");
  assert.strictEqual(out.h, 1200, "proporção deve ser preservada");
  assert.ok(out.bytes < 1024 * 1024, `saída deveria ficar abaixo de 1 MB, veio ${out.bytes}`);

  console.log(`OK — ${(out.entrada / 1024 / 1024).toFixed(1)} MB -> ${(out.bytes / 1024).toFixed(0)} KB em ${out.ms} ms`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
