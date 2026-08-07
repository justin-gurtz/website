import { createHmac } from "node:crypto";
import { NEXT_PUBLIC_SUPABASE_URL } from "@/env/public";
import {
  SPOTIFY_AUTH_KEY,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SUPABASE_SERVICE_ROLE_KEY,
} from "@/env/secret";
import { safeEqual } from "@/utils/server";
import { createClient } from "@/utils/supabase";

const SCOPE = "user-read-currently-playing";
const STATE_TTL_MS = 10 * 60 * 1000;

// Self-verifying OAuth state: "<expiresAt>.<hmac(expiresAt)>". Nothing is
// stored server-side; the signature proves this server minted the value and
// the embedded expiry bounds how long a captured one could be replayed.
const signState = (expiresAt: number) =>
  createHmac("sha256", SPOTIFY_AUTH_KEY)
    .update(expiresAt.toString())
    .digest("hex");

const createState = () => {
  const expiresAt = Date.now() + STATE_TTL_MS;
  return `${expiresAt}.${signState(expiresAt)}`;
};

const isValidState = (state: string) => {
  const [expiresAtString, signature] = state.split(".");
  if (!expiresAtString || !signature) return false;

  const expiresAt = Number(expiresAtString);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  return safeEqual(signature, signState(expiresAt));
};

const getRedirectUri = (requestUrl: string) => {
  const url = new URL(requestUrl);

  // Vercel terminates TLS at the proxy, so force https for non-local hosts
  if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    url.protocol = "https:";
  }

  return `${url.origin}/api/spotify/auth`;
};

export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const key = url.searchParams.get("key");
  const oauthError = url.searchParams.get("error");

  const redirectUri = getRedirectUri(request.url);

  if (oauthError) {
    return new Response(`Spotify authorization failed: ${oauthError}`, {
      status: 400,
    });
  }

  // First leg: no code yet, send the visitor to Spotify's consent page
  if (!code) {
    if (!key || !safeEqual(key, SPOTIFY_AUTH_KEY)) {
      return new Response(null, { status: 401 });
    }

    const authorizeUrl = new URL("https://accounts.spotify.com/authorize");
    authorizeUrl.searchParams.set("client_id", SPOTIFY_CLIENT_ID);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("scope", SCOPE);
    authorizeUrl.searchParams.set("state", createState());

    return Response.redirect(authorizeUrl.toString(), 302);
  }

  // Second leg: Spotify redirected back with a code
  if (!state || !isValidState(state)) {
    return new Response(null, { status: 401 });
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return new Response(`Spotify code exchange failed: ${res.status} ${body}`, {
      status: 502,
    });
  }

  const { refresh_token: refreshToken } = await res.json();

  if (!refreshToken) {
    return new Response("Spotify response missing refresh_token", {
      status: 502,
    });
  }

  const supabase = createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  );

  const { error } = await supabase.from("spotifyTokens").upsert(
    {
      id: 1,
      refreshToken,
      updatedAt: new Date().toISOString(),
      warnedAt: null,
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  return new Response("Spotify reconnected. You can close this tab.", {
    headers: { "Content-Type": "text/plain" },
  });
};
