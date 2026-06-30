// Validação e processamento de upload de imagens. O bucket "media" é público,
// então aceitar qualquer tipo permitiria SVG com script (XSS) ou abuso de
// armazenamento. A extensão é derivada do MIME confiável (não do nome do
// arquivo). Após a validação, a imagem é redimensionada e recomprimida para
// WebP — evita que fotos de 4–5 MB direto da câmera entrem no Storage e tenham
// de ser baixadas/otimizadas em tamanho cheio.

import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

// Maior dimensão (largura ou altura) que uma imagem pode ter depois de
// processada. Imagens menores não são ampliadas (withoutEnlargement).
const MAX_DIMENSAO = 1600;
const WEBP_QUALIDADE = 80;

const EXT_POR_MIME = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export function validarImagem(file: File): { ext: string } | { error: string } {
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "Imagem muito grande (máximo 5 MB)." };
  }
  const ext = EXT_POR_MIME.get(file.type);
  if (!ext) {
    return { error: "Formato inválido. Envie JPG, PNG ou WebP." };
  }
  return { ext };
}

// Valida e processa a imagem para upload: redimensiona para no máximo
// MAX_DIMENSAO px no lado maior e recomprime em WebP. Retorna os bytes prontos
// já com o contentType/ext corretos para gravar no Storage.
export async function processarImagem(
  file: File,
): Promise<{ bytes: Buffer; ext: string; contentType: string } | { error: string }> {
  const validacao = validarImagem(file);
  if ("error" in validacao) return validacao;

  try {
    const entrada = Buffer.from(await file.arrayBuffer());
    const bytes = await sharp(entrada)
      .rotate() // respeita a orientação EXIF (fotos de celular)
      .resize(MAX_DIMENSAO, MAX_DIMENSAO, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALIDADE })
      .toBuffer();

    return { bytes, ext: "webp", contentType: "image/webp" };
  } catch {
    return { error: "Não foi possível processar a imagem. Tente outro arquivo." };
  }
}
