"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TicketPercent, BookOpen } from "lucide-react";

const links = [
  { href: "/cupons", label: "Cupons", icon: TicketPercent },
  { href: "/midia-kit", label: "Mídia Kit", icon: BookOpen },
];

export default function PublicHeader() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-5xl px-4 pt-4">
        <nav className="flex items-center justify-center gap-1 rounded-2xl border border-border/60 bg-background/80 backdrop-blur-md px-2 py-2 shadow-sm">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href === "/cupons" && pathname === "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
