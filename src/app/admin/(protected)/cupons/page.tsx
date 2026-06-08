import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Button from "@/components/ui/Button";
import CuponsTable from "@/components/admin/CuponsTable";

export default async function CuponsPage() {
  const supabase = await createClient();
  const { data: cupons } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Cupons</h1>
        <Link href="/admin/cupons/novo">
          <Button size="sm">Novo cupom</Button>
        </Link>
      </div>
      <CuponsTable cupons={cupons ?? []} />
    </div>
  );
}
