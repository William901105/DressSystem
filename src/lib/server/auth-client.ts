import "server-only";

import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";

const AUTH_COOKIE = "dress_auth";

export function isAuthCookie(name: string) {
  return name === AUTH_COOKIE || /^dress_auth\.\d+$/.test(name);
}

export function secureAuthCookie(request: Request) {
  return process.env.VERCEL === "1"
    || new URL(request.url).protocol === "https:"
    || request.headers.get("x-forwarded-proto") === "https";
}

export function createAuthentication(
  config: { url: string; publishableKey: string },
  cookies: CookieMethodsServer,
  secure = false,
) {
  return createServerClient(config.url, config.publishableKey, {
    cookies,
    cookieOptions: { name: AUTH_COOKIE, httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 60 * 60 * 24 * 30 },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
