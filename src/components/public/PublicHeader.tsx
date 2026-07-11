"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TicketPercent, MessageCircle } from "lucide-react";

const links = [
  { href: "/cupons", label: "Cupons", icon: TicketPercent, external: false },
  // /contato é um route handler que redireciona pro WhatsApp — usa <a> (não
  // <Link>): o prefetch do <Link> dispararia cliques falsos no histórico.
  { href: "/contato", label: "Contato", icon: MessageCircle, external: true },
];

export default function PublicHeader() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-5xl px-4 pt-4">
        <nav className="flex items-center justify-center gap-1 rounded-2xl border border-border/60 bg-background/80 lg:backdrop-blur-md px-2 py-2 shadow-sm">
          {links.map(({ href, label, icon: Icon, external }) => {
            const active = pathname === href || (href === "/cupons" && pathname === "/");
            const className = `flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`;
            const inner = (
              <>
                <Icon className="w-4 h-4" />
                {label}
              </>
            );
            return external ? (
              <a key={href} href={href} className={className}>
                {inner}
              </a>
            ) : (
              <Link key={href} href={href} className={className}>
                {inner}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
