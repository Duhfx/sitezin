"use client";

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

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col">
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
    </aside>
  );
}
