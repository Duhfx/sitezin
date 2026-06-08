"use client";

import { useState, useMemo } from "react";
import { Search, TicketPercent } from "lucide-react";
import CouponCard from "@/components/public/CouponCard";
import type { Coupon } from "@/types/database";

export default function CouponList({ cupons }: { cupons: Coupon[] }) {
  const [query, setQuery] = useState("");

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cupons;
    return cupons.filter(
      (c) =>
        c.marca.toLowerCase().includes(q) ||
        c.descricao.toLowerCase().includes(q)
    );
  }, [query, cupons]);

  return (
    <>
      {/* Busca */}
      <div className="w-full max-w-xl mx-auto relative group mb-16">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent2/20 rounded-3xl blur-md opacity-50 transition-opacity group-focus-within:opacity-100" />
        <div className="relative glass-card flex items-center rounded-2xl p-2 border border-border/50">
          <div className="pl-4 pr-3">
            <Search className="w-5 h-5 text-muted-foreground" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar marca ou loja..."
            className="w-full bg-transparent py-3 pr-4 outline-none text-foreground placeholder:text-muted-foreground font-medium"
          />
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="glass-card rounded-3xl border border-border/50 p-24 text-center max-w-2xl mx-auto">
          <TicketPercent className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            {query.trim()
              ? `Nenhuma parceria encontrada para "${query.trim()}".`
              : "Nenhuma parceria disponível no momento."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((cupom, index) => (
            <CouponCard key={cupom.id} coupon={cupom} index={index} />
          ))}
        </div>
      )}
    </>
  );
}
