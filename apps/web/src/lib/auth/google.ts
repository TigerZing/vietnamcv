import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { env } from "@/lib/env";

import { base64Url } from "./tokens";

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

export type OAuthState = {
  state: string;
  verifier: string;
  nonce: string;
  returnTo: string;
};

export function callbackUrl(): string {
  return new URL(
    "/api/auth/google/callback",
    env.NEXT_PUBLIC_SITE_URL,
  ).toString();
}

export function newOAuthState(returnTo: string): OAuthState {
  return {
    state: base64Url(randomBytes(24)),
    verifier: base64Url(randomBytes(48)),
    nonce: base64Url(randomBytes(24)),
    returnTo,
  };
}

export function authorizeUrl(oauth: OAuthState): string {
  const challenge = base64Url(
    createHash("sha256").update(oauth.verifier).digest(),
  );
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: callbackUrl(),
    response_type: "code",
    scope: "openid profile",
    state: oauth.state,
    nonce: oauth.nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return `${AUTHORIZE_URL}?${params}`;
}

/**
 * Exchanges the authorization code for an ID token. The token comes straight from
 * Google's token endpoint over TLS, so the web app only checks the nonce; the API
 * verifies the signature on every use.
 */
export async function exchangeCode(
  code: string,
  oauth: OAuthState,
): Promise<string> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID ?? "",
      client_secret: env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: callbackUrl(),
      grant_type: "authorization_code",
      code_verifier: oauth.verifier,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Google token exchange failed with ${response.status}`);
  }
  const body = (await response.json()) as { id_token?: unknown };
  if (typeof body.id_token !== "string") {
    throw new Error("Google token response had no id_token");
  }
  const payload = JSON.parse(
    Buffer.from(body.id_token.split(".")[1] ?? "", "base64url").toString(
      "utf8",
    ),
  ) as { nonce?: unknown };
  if (payload.nonce !== oauth.nonce) {
    throw new Error("ID token nonce mismatch");
  }
  return body.id_token;
}
