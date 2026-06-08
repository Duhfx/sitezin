"use client";

import { useState } from "react";
import Image from "next/image";
import { Copy, Check, ExternalLink, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import type { Coupon } from "@/types/database";

export default function CouponCard({ coupon, index = 0 }: { coupon: Coupon; index?: number }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(coupon.cupom);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Ignora silenciosamente.
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-3xl glass-card border border-border/50 p-6 sm:p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1"
    >
      {/* Glow effect on hover */}
      <div className="absolute -inset-2 bg-gradient-to-r from-primary/10 to-accent2/10 rounded-3xl blur-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />

      <div className="flex flex-col h-full gap-6 z-10">
        
        {/* Header: Logo & Brand */}
        <div className="flex items-center gap-5">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm overflow-hidden">
            {coupon.logo_url ? (
              <Image
                src={coupon.logo_url}
                alt={coupon.marca}
                fill
                className="object-contain p-2.5"
              />
            ) : (
              <span className="text-2xl font-bold text-foreground">
                {coupon.marca.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground tracking-tight mb-1">{coupon.marca}</h3>
          </div>
        </div>

        {/* Description */}
        <p className="flex-1 text-sm leading-relaxed text-muted-foreground font-medium">
          {coupon.descricao}
        </p>

        {/* CTAs */}
        <div className="mt-2 flex flex-col gap-3">
          <button
            onClick={copiar}
            className={`relative flex w-full items-center justify-between overflow-hidden rounded-2xl p-4 transition-all duration-300 border ${
              copiado 
                ? "bg-primary/10 border-primary/20 text-primary" 
                : "bg-background/50 border-border/50 text-foreground hover:bg-background/80 hover:border-primary/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]"
            }`}
          >
            <span className="font-mono text-lg tracking-[0.2em] font-bold">
              {coupon.cupom}
            </span>
            <div className={`flex items-center font-bold text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-xl ${copiado ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground'}`}>
              {copiado ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Copiar
                </>
              )}
            </div>
          </button>

          {coupon.affiliate_url && (
            <a
              href={coupon.affiliate_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border/50 bg-background/30 hover:bg-background/60 px-4 py-3.5 text-xs font-bold text-foreground transition-all hover:shadow-sm"
            >
              Acessar site da loja
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
