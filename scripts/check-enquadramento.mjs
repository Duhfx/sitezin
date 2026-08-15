// Check do enquadramento do moodboard: estiloFoto (o que o mídia kit e o PDF
// aplicam) e pxPorCento (o que o editor usa pra converter arraste em %). As duas
// TÊM que ser inversas — se divergirem, arrastar "foge" do cursor e o corte do
// admin não bate com o que sai no PDF.
//
//   node scripts/check-enquadramento.mjs

import { execFileSync } from "node:child_process";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

// Dentro do repo (e não em /tmp) porque o JSX transpilado importa
// "react/jsx-runtime": fora daqui o Node não acha o node_modules do projeto.
const tmp = fs.mkdtempSync(path.join(process.cwd(), ".check-enquadramento-"));
try {
  execFileSync("npx", [
    "tsc", "src/lib/midia-kit-format.tsx",
    "--target", "es2020", "--module", "es2020", "--jsx", "react-jsx",
    "--lib", "es2020,dom", "--skipLibCheck", "--outDir", tmp,
  ], { stdio: "inherit" });

  const { estiloFoto, pxPorCento } = await import(path.join(tmp, "midia-kit-format.js"));

  // ── estiloFoto ────────────────────────────────────────────────────────────
  // Sem zoom não emite transform: uma matriz de identidade em toda foto do deck
  // criaria camada de composição à toa no Chrome que gera o PDF.
  assert.deepStrictEqual(estiloFoto("50% 30%", 1), { objectPosition: "50% 30%" });
  assert.deepStrictEqual(estiloFoto("50% 30%", undefined), { objectPosition: "50% 30%" });
  assert.deepStrictEqual(estiloFoto("40% 20%", 1.5), {
    objectPosition: "40% 20%",
    transform: "scale(1.5)",
    // origem = pos: ampliar não pode tirar do quadro o que já estava enquadrado.
    transformOrigin: "40% 20%",
  });

  // ── pxPorCento ────────────────────────────────────────────────────────────
  // Foto 1000x1000 numa célula 100x200: o cover escala por 0.2 (200/1000), então
  // a imagem vira 200x200 — sobra 100px na horizontal, nada na vertical.
  const cover = Math.max(100 / 1000, 200 / 1000);
  assert.strictEqual(pxPorCento(1000, 100, cover, 1), 1, "100px de sobra = 1px por %");
  assert.strictEqual(pxPorCento(1000, 200, cover, 1), 0, "sem sobra = eixo travado");

  // Com zoom 2: a sobra dobra (2*100) e o transform-origin acrescenta (2-1)*moldura.
  assert.strictEqual(pxPorCento(1000, 100, cover, 2), (2 * 100 + 100) / 100);
  // O eixo antes travado passa a andar — é o que faz o pan funcionar com zoom.
  assert.strictEqual(pxPorCento(1000, 200, cover, 2), (0 + 200) / 100);

  // Zoom abaixo de 1 é tratado como 1 (o slider não desce disso; o servidor também barra).
  assert.strictEqual(pxPorCento(1000, 100, cover, 0.5), pxPorCento(1000, 100, cover, 1));

  console.log("OK — estiloFoto e pxPorCento consistentes");
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
