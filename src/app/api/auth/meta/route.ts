import { NextResponse } from "next/server";

export async function GET() {
  const appId = process.env.META_APP_ID!;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const redirectUri = `${appUrl}/api/auth/meta/callback`;

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope:
      "instagram_basic,pages_show_list,business_management,instagram_manage_insights,pages_read_engagement",
    response_type: "code",
  });

  return NextResponse.redirect(
    `https://www.facebook.com/v23.0/dialog/oauth?${params}`
  );
}
