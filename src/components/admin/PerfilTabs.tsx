"use client";

import { useState } from "react";

type Tab = "conteudo" | "metricas";

export default function PerfilTabs({
  conteudo,
  metricas,
  defaultTab = "conteudo",
}: {
  conteudo: React.ReactNode;
  metricas: React.ReactNode;
  defaultTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(defaultTab);

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
      tab === t
        ? "border-primary text-primary"
        : "border-transparent text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div>
      <div className="mb-6 flex gap-2 border-b border-border">
        <button type="button" onClick={() => setTab("conteudo")} className={tabClass("conteudo")}>
          Conteúdo
        </button>
        <button type="button" onClick={() => setTab("metricas")} className={tabClass("metricas")}>
          Métricas
        </button>
      </div>

      <div className={tab === "conteudo" ? "" : "hidden"}>{conteudo}</div>
      <div className={tab === "metricas" ? "" : "hidden"}>{metricas}</div>
    </div>
  );
}
