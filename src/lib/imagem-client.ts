// Compressão no browser, antes do envio. Fotos de celular chegam com 10–15 MB:
// isso estoura o bodySizeLimit da Server Action, demora pra subir e ainda faria o
// servidor baixar o arquivo cheio só pra jogar fora no resize. Aqui o arquivo já
// sai reduzido (~200–400 KB) — o processarImagem() do servidor continua rodando,
// é ele que valida a origem (não dá pra confiar no que o client manda).
//
// Mesmas dimensão/qualidade do servidor (src/lib/upload.ts) — reprocessar depois
// não perde nada além de um reencode.

const MAX_DIMENSAO = 1600;
const QUALIDADE = 0.8;

// Teto do arquivo ORIGINAL (antes de comprimir). Só existe pra barrar absurdo —
// um RAW de 80 MB trava o browser no decode. O limite que importa é o do
// servidor, aplicado no arquivo já comprimido.
export const MAX_ORIGINAL_BYTES = 30 * 1024 * 1024;

async function paraBlob(canvas: HTMLCanvasElement, tipo: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, tipo, QUALIDADE));
}

export async function comprimirImagem(file: File): Promise<File> {
  if (file.size > MAX_ORIGINAL_BYTES) {
    throw new Error(`"${file.name}" é grande demais (máximo 30 MB).`);
  }

  // imageOrientation: respeita o EXIF de fotos de celular (o createImageBitmap
  // cru ignora e a foto sai deitada).
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const escala = Math.min(1, MAX_DIMENSAO / Math.max(bitmap.width, bitmap.height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  // Safari antigo não codifica WebP e devolve PNG silenciosamente (pesado) —
  // nesse caso cai pra JPEG, que ele codifica.
  let blob = await paraBlob(canvas, "image/webp");
  if (blob?.type !== "image/webp") blob = await paraBlob(canvas, "image/jpeg");
  if (!blob) throw new Error(`Não foi possível processar "${file.name}".`);

  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.${ext}`, { type: blob.type });
}

// Comprime todo arquivo de imagem do FormData no lugar. Genérico de propósito:
// pega os 7 campos do perfil e o logo do cupom sem lista de nomes pra manter.
// Lança com mensagem pronta pra tela se algum arquivo não puder ser lido
// (formato que o browser não decodifica, ex.: HEIC fora do Safari).
export async function comprimirImagensDoForm(fd: FormData): Promise<void> {
  for (const [campo, valor] of Array.from(fd.entries())) {
    if (!(valor instanceof File) || valor.size === 0) continue;
    if (!valor.type.startsWith("image/")) continue;
    try {
      fd.set(campo, await comprimirImagem(valor));
    } catch (e) {
      throw e instanceof Error && e.message
        ? e
        : new Error(`Não foi possível ler "${valor.name}". Envie JPG, PNG ou WebP.`);
    }
  }
}
