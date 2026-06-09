"use client";

import { useState } from "react";

export default function CopiarLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-stretch gap-2">
      <p className="flex-1 break-all rounded-md bg-muted px-3 py-2 font-mono text-xs text-foreground">
        {link}
      </p>
      <button
        onClick={handleCopy}
        className="shrink-0 rounded-md border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {copied ? "Copiado!" : "Copiar"}
      </button>
    </div>
  );
}
