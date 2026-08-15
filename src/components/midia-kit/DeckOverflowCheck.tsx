"use client";

import { useEffect, useState } from "react";

// As páginas do deck têm altura FIXA (720px) e overflow:hidden — se um perfil
// tiver bio gigante, 9 formatos ou um nome muito longo, o excedente sai cortado
// do PDF sem avisar ninguém. Este componente é a checagem executável da lógica de
// paginação de MediaKitDeckPdf: mede cada página na pré-visualização e denuncia
// as que estouraram, com contorno vermelho e um aviso fixo.
//
// Só existe na tela: tudo aqui está sob @media screen ou print:hidden, então não
// vaza para o PDF (o page.pdf() do Puppeteer renderiza em media type "print").
export default function DeckOverflowCheck() {
  const [estouradas, setEstouradas] = useState<number[]>([]);

  useEffect(() => {
    let cancelado = false;

    async function medir() {
      // Fonte e imagens mudam a altura do conteúdo — medir antes disso dá falso
      // negativo (texto em fallback ocupa menos) e falso positivo (imagem sem
      // dimensão ainda). Mesma espera que a rota de geração do PDF faz.
      await document.fonts.ready;
      await Promise.all(
        Array.from(document.images).map((img) => img.decode().catch(() => {}))
      );
      if (cancelado) return;

      const ruins: number[] = [];
      document.querySelectorAll<HTMLElement>(".deck-page").forEach((page, i) => {
        const excedeu =
          page.scrollHeight > page.clientHeight + 1 ||
          page.scrollWidth > page.clientWidth + 1;
        page.classList.toggle("deck-overflow", excedeu);
        if (excedeu) ruins.push(i + 1);
      });
      setEstouradas(ruins);
    }

    medir();
    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `@media screen { .deck-overflow { outline: 3px solid #dc2626; outline-offset: -3px; } }`,
        }}
      />
      {estouradas.length > 0 && (
        <div className="print:hidden fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg">
          Conteúdo cortado {estouradas.length === 1 ? "na página" : "nas páginas"}{" "}
          {estouradas.join(", ")} — reduza o texto ou divida em mais itens.
        </div>
      )}
    </>
  );
}
