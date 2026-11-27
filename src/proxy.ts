import { NextResponse, type NextRequest } from "next/server";
import { createAuthentication, isAuthCookie, secureAuthCookie } from "@/lib/server/auth-client";
import { authenticationSettings } from "@/lib/server/supabase-settings";

export async function proxy(request: NextRequest) {
  const { config } = authenticationSettings();
  let response = NextResponse.next({ request });
  if (!config || !request.cookies.getAll().some(({ name }) => isAuthCookie(name))) return response;

  const auth = createAuthentication(config, {
    getAll: () => request.cookies.getAll(),
    setAll(cookiesToSet, headers) {
      for (const { name, value, options } of cookiesToSet) {
        if (options.maxAge === 0) request.cookies.delete(name);
        else request.cookies.set(name, value);
      }
      const next = NextResponse.next({ request });
      for (const cookie of response.cookies.getAll()) next.cookies.set(cookie);
      for (const { name, value, options } of cookiesToSet) next.cookies.set(name, value, options);
      for (const [name, value] of Object.entries(headers)) next.headers.set(name, value);
      next.headers.set("Cache-Control", "private, no-store");
      response = next;
    },
  }, secureAuthCookie(request));
  await auth.auth.getClaims();
  return response;
}

export const config = {
  matcher: ["/", "/access", "/categories", "/compose", "/outfits",
    "/api/categories/:path*", "/api/clothes/:path*", "/api/outfits/:path*"],
};
