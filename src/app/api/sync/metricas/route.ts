import { type NextRequest } from "next/server";
import { autoSyncAll } from "@/lib/sync-auto";

// Vercel Cron envia GET com Authorization: Bearer {CRON_SECRET}.
// O mesmo endpoint pode ser chamado manualmente com o header correto.
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await autoSyncAll("cron");
  const statusCode = result.instagram.ok || result.tiktok.ok ? 200 : 500;

  return Response.json({ result }, { status: statusCode });
}
