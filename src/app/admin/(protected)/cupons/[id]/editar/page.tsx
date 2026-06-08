import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import CupomForm from "@/components/admin/CupomForm";

export default async function EditarCupomPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { data: cupom } = await supabase
    .from("coupons")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!cupom) notFound();

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/cupons">
          <Button variant="ghost" size="sm">← Voltar</Button>
        </Link>
        <h1 className="text-xl font-semibold text-foreground">Editar cupom</h1>
      </div>
      <Card>
        <CupomForm initialData={cupom} />
      </Card>
    </div>
  );
}
