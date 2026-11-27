import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createAuthentication, isAuthCookie } from "./auth-client";
import { authenticationSettings } from "./supabase-settings";

export function isWardrobeMember(appMetadata: unknown) {
  return !!appMetadata && typeof appMetadata === "object"
    && "dresssystem_member" in appMetadata && appMetadata.dresssystem_member === true;
}

export const hasAccess = cache(async () => {
  const { config } = authenticationSettings();
  if (!config) return false;
  const jar = await cookies();
  const current = jar.getAll();
  if (!current.some(({ name }) => isAuthCookie(name))) return false;

  // The proxy persists any refresh. Authorization uses only verified claims.
  const auth = createAuthentication(config, { getAll: () => current });
  const { data, error } = await auth.auth.getClaims();
  const claims = data?.claims;
  return !error && claims?.role === "authenticated" && claims.is_anonymous !== true
    && isWardrobeMember(claims.app_metadata);
});

export async function requirePageAccess() {
  if (!(await hasAccess())) redirect("/access");
}
