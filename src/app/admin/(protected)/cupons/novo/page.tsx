import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import CupomForm from "@/components/admin/CupomForm";

export default function NovoCupomPage() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/cupons">
          <Button variant="ghost" size="sm">← Voltar</Button>
        </Link>
        <h1 className="text-xl font-semibold text-foreground">Novo cupom</h1>
      </div>
      <Card>
        <CupomForm />
      </Card>
    </div>
  );
}
