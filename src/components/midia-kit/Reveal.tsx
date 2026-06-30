"use client";

// Reveal de entrada leve, sem framer-motion. Adiciona a classe `is-visible`
// quando o elemento entra na viewport; a animação em si é 100% CSS (.reveal em
// globals.css). O estado base é visível, então conteúdo nunca fica em branco
// esperando o JS — a animação é apenas enriquecimento progressivo.

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

export default function Reveal({
  children,
  as,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
}) {
  const Tag = (as ?? "div") as ElementType;
  // Tag é dinâmico, então o tipo do ref não é estático.
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Se já estiver visível na carga (acima da dobra), revela de imediato.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -80px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal${shown ? " is-visible" : ""}${className ? " " + className : ""}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
