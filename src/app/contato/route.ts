import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";

// Aba /contato: registra o clique e redireciona para o WhatsApp da Aline.
// Rota pública (sem sessão) — usa o service client, igual à página do mídia kit
// por token. headers() já torna a rota dinâmica (roda a cada clique).

const WHATSAPP_NUMERO = "351927174100"; // +351 927 174 100
const MENSAGEM =
  "Olá! Vim pelo Instagram da Aline Carreiro e gostaria de saber mais informações sobre o trabalho dela 😊";

export async function GET() {
  const headersList = headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ??
    headersList.get("x-real-ip") ??
    null;
  const userAgent = headersList.get("user-agent") ?? null;

  // Loga antes de redirecionar. Best-effort: falha no insert não deve impedir o
  // usuário de chegar no WhatsApp.
  try {
    const supabase = await createServiceClient();
    await supabase.from("contact_clicks").insert({ ip, user_agent: userAgent });
  } catch {
    // ponytail: silencioso de propósito — o redirect é o que importa.
  }

  const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(MENSAGEM)}`;
  return NextResponse.redirect(url);
}
