import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";

export async function GET() {
  // Só a admin logada pode iniciar a conexão da conta ao perfil.
  if (!(await requireUser())) {
    return NextResponse.redirect(
      new URL("/admin/login", process.env.NEXT_PUBLIC_APP_URL!),
    );
  }

  const appId = process.env.META_APP_ID!;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const redirectUri = `${appUrl}/api/auth/meta/callback`;

  // State anti-CSRF: gravado em cookie httpOnly e conferido no callback.
  const state = randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope:
      "instagram_basic,pages_show_list,business_management,instagram_manage_insights,pages_read_engagement",
    response_type: "code",
    state,
  });

  const res = NextResponse.redirect(
    `https://www.facebook.com/v23.0/dialog/oauth?${params}`
  );
  res.cookies.set("meta_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 min — tempo do consentimento
  });
  return res;
}
