import { redirect } from "next/navigation";

// /admin não tem conteúdo próprio: o middleware manda quem não tem sessão
// para /admin/login; quem está logado é direcionado ao painel padrão.
export default function AdminIndexPage() {
  redirect("/admin/solicitacoes");
}
