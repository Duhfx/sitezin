import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { PROFILE_ID } from "@/lib/influencer-profile";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const appId = process.env.META_APP_ID!;
  const appSecret = process.env.META_APP_SECRET!;
  const redirectUri = `${appUrl}/api/auth/meta/callback`;

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/admin/perfil?instagram=erro`);
  }

  // 1. Trocar code por access token
  const tokenParams = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });

  const tokenRes = await fetch(
    `https://graph.facebook.com/v23.0/oauth/access_token?${tokenParams}`
  );
  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return NextResponse.redirect(`${appUrl}/admin/perfil?instagram=erro`);
  }

  // 1b. Trocar o token de curta duração por um de longa duração (~60 dias),
  // necessário para a sincronização sob demanda funcionar dias depois.
  const longLivedParams = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: tokenData.access_token,
  });

  const longLivedRes = await fetch(
    `https://graph.facebook.com/v23.0/oauth/access_token?${longLivedParams}`
  );
  const longLivedData = await longLivedRes.json();

  const accessToken: string = longLivedData.access_token ?? tokenData.access_token;
  const expiresIn: number | undefined = longLivedData.expires_in ?? tokenData.expires_in;
  const expiresAt: string | null = expiresIn
    ? new Date(Date.now() + expiresIn * 1000).toISOString()
    : null;

  // 2. Descobrir página do Facebook vinculada ao usuário
  const pagesRes = await fetch(
    `https://graph.facebook.com/v23.0/me/accounts?access_token=${accessToken}`
  );
  const pagesData = await pagesRes.json();

  const page = pagesData.data?.[0];
  if (!page) {
    return NextResponse.redirect(`${appUrl}/admin/perfil?instagram=sem-pagina`);
  }

  const pageId: string = page.id;

  // 3. Descobrir Instagram Business Account vinculado à página
  const igAccountRes = await fetch(
    `https://graph.facebook.com/v23.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`
  );
  const igAccountData = await igAccountRes.json();

  const instagramUserId: string | undefined =
    igAccountData.instagram_business_account?.id;
  if (!instagramUserId) {
    return NextResponse.redirect(
      `${appUrl}/admin/perfil?instagram=sem-instagram`
    );
  }

  // 4. Buscar dados básicos do perfil Instagram
  const profileRes = await fetch(
    `https://graph.facebook.com/v23.0/${instagramUserId}?fields=username,followers_count,media_count&access_token=${accessToken}`
  );
  const profileData = await profileRes.json();

  // 5. Salvar tudo no banco
  const supabase = await createServiceClient();
  await supabase
    .from("influencer_profile")
    .update({
      meta_access_token: accessToken,
      meta_token_expires_at: expiresAt,
      facebook_page_id: pageId,
      instagram_user_id: instagramUserId,
      instagram_username: profileData.username ?? null,
      instagram_followers: profileData.followers_count ?? null,
      instagram_posts: profileData.media_count ?? null,
      instagram_synced_at: new Date().toISOString(),
    })
    .eq("id", PROFILE_ID);

  return NextResponse.redirect(`${appUrl}/admin/perfil?instagram=conectado`);
}
