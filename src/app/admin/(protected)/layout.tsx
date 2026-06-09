import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";

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
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <AdminSidebar pendingCount={pendingCount ?? 0} />
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
