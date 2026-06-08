"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/admin/solicitacoes", label: "Solicitações" },
  { href: "/admin/cupons", label: "Cupons" },
  { href: "/admin/metricas", label: "Métricas" },
  { href: "/admin/dashboard", label: "Dashboard" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Fecha o drawer ao navegar para outra página
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  const navContent = (
    <>
      <div className="px-5 py-6 border-b border-border">
        <span className="text-sm font-semibold text-foreground">
          Painel Admin
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-sm text-sm transition-colors ${
                active
                  ? "bg-secondary text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 rounded-sm text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          Sair
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Topbar mobile */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="flex h-9 w-9 items-center justify-center rounded-sm text-foreground hover:bg-muted"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-foreground">Painel Admin</span>
      </header>

      {/* Sidebar fixa (desktop) */}
      <aside className="hidden lg:flex w-56 shrink-0 border-r border-border bg-card flex-col">
        {navContent}
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 max-w-[80%] flex-col border-r border-border bg-card shadow-xl">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
