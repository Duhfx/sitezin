import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, requireUser } from "@/lib/supabase/server";
import { PROFILE_ID } from "@/lib/influencer-profile";
import { fetchTiktokUserInfo, TiktokAuthError } from "@/lib/tiktok-sync";

export async function GET(request: NextRequest) {
  // Grava tokens via service client (ignora RLS); exige sessão admin no código.
  if (!(await requireUser())) {
    return NextResponse.redirect(
      new URL("/admin/login", process.env.NEXT_PUBLIC_APP_URL!),
    );
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  // Mesma normalização da rota de autorização: o redirect_uri da troca de token
  // precisa ser idêntico ao usado no authorize (sem barra dupla).
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!.replace(/\/+$/, "");
  const clientKey = process.env.TIKTOK_CLIENT_KEY!;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET!;
  const redirectUri = `${appUrl}/api/auth/tiktok/callback`;

  // Confere o state anti-CSRF e recupera o code_verifier (PKCE), ambos gravados
  // em cookie pela rota de autorização.
  const expectedState = request.cookies.get("tiktok_oauth_state")?.value;
  const codeVerifier = request.cookies.get("tiktok_code_verifier")?.value;

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/admin/perfil?tiktok=erro`);
  }
  if (!state || !expectedState || state !== expectedState || !codeVerifier) {
    return NextResponse.redirect(`${appUrl}/admin/perfil?tiktok=erro`);
  }

  // 1. Trocar code por access token (form-urlencoded, conforme Login Kit v2).
  const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    cache: "no-store",
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });
  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return NextResponse.redirect(`${appUrl}/admin/perfil?tiktok=erro`);
  }

  const accessToken: string = tokenData.access_token;
  const refreshToken: string | null = tokenData.refresh_token ?? null;
  const openId: string | null = tokenData.open_id ?? null;
  // access_token ~24h; refresh_token ~365d.
  const expiresAt: string | null = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : null;
  const refreshExpiresAt: string | null = tokenData.refresh_expires_in
    ? new Date(Date.now() + tokenData.refresh_expires_in * 1000).toISOString()
    : null;

  // 2. Buscar dados básicos do perfil (username + estatísticas da conta).
  let perfil: Awaited<ReturnType<typeof fetchTiktokUserInfo>> | null = null;
  try {
    perfil = await fetchTiktokUserInfo(accessToken);
  } catch (e) {
    // Token recém-emitido não deveria falhar por auth; outras falhas não impedem
    // gravar os tokens — o perfil será preenchido na primeira sincronização.
    if (e instanceof TiktokAuthError) {
      return NextResponse.redirect(`${appUrl}/admin/perfil?tiktok=erro`);
    }
  }

  // 3. Salvar tokens + perfil no banco.
  const supabase = await createServiceClient();
  await supabase
    .from("influencer_profile")
    .update({
      tiktok_access_token: accessToken,
      tiktok_refresh_token: refreshToken,
      tiktok_token_expires_at: expiresAt,
      tiktok_refresh_expires_at: refreshExpiresAt,
      tiktok_open_id: openId,
      tiktok_username: perfil?.username ?? null,
      tiktok_followers: perfil?.followers ?? null,
      tiktok_likes: perfil?.likes ?? null,
      tiktok_videos: perfil?.videos ?? null,
      tiktok_synced_at: new Date().toISOString(),
    })
    .eq("id", PROFILE_ID);

  const res = NextResponse.redirect(`${appUrl}/admin/perfil?tiktok=conectado`);
  res.cookies.delete("tiktok_oauth_state");
  res.cookies.delete("tiktok_code_verifier");
  return res;
}
