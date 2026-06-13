// Validação de upload de imagens. O bucket "media" é público, então aceitar
// qualquer tipo permitiria SVG com script (XSS) ou abuso de armazenamento.
// A extensão é derivada do MIME confiável (não do nome do arquivo).

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

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
