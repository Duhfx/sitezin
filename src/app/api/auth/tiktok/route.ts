import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

// Escopos da Display API (Login Kit): perfil + estatísticas + lista de vídeos.
const SCOPE = "user.info.basic,user.info.profile,user.info.stats,video.list";

export async function GET() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY!;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const redirectUri = `${appUrl}/api/auth/tiktok/callback`;

  // State anti-CSRF: gravado em cookie httpOnly e conferido no callback.
  const state = randomBytes(16).toString("hex");

  // PKCE (obrigatório no fluxo web do TikTok). Atenção: o TikTok usa o SHA256 em
  // HEX como code_challenge — diferente do base64url do padrão OAuth.
  const codeVerifier = randomBytes(32).toString("hex"); // 64 chars (faixa 43–128)
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("hex");

  const params = new URLSearchParams({
    client_key: clientKey,
    scope: SCOPE,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const res = NextResponse.redirect(
    `https://www.tiktok.com/v2/auth/authorize/?${params}`,
  );
  const cookieOpts = {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 10, // 10 min — tempo do consentimento
  };
  res.cookies.set("tiktok_oauth_state", state, cookieOpts);
  res.cookies.set("tiktok_code_verifier", codeVerifier, cookieOpts);
  return res;
}
