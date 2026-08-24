import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { count: pendingCount } = await supabase
    .from("media_kit_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "pendente");

  return (
    <div className="flex h-dvh flex-col bg-background lg:flex-row print:block print:h-auto">
      <AdminSidebar pendingCount={pendingCount ?? 0} />
      <main className="flex-1 overflow-auto print:overflow-visible">
        {/* Sem cap de largura: as telas do admin são grades e tabelas, e o
            editor de perfil usa a sobra para aumentar a prévia. Quem precisar de
            linha curta limita no próprio conteúdo. */}
        <div className="w-full px-4 py-6 sm:px-6 sm:py-8 print:py-0">{children}</div>
      </main>
    </div>
  );
}
