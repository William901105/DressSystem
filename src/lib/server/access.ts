import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ACCESS_COOKIE = "dress_access";
export const ACCESS_SECONDS = 60 * 60 * 24 * 30;

export function configuredAccessCode() {
  const value = process.env.DRESS_ACCESS_CODE?.trim();
  return value && value.length >= 20 && value.length <= 256 ? value : null;
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function validCode(code: string, expected: string) {
  return timingSafeEqual(digest(code), digest(expected));
}

function sign(expiry: number, secret: string) {
  return createHmac("sha256", secret).update(`dresssystem:access:${expiry}`).digest("base64url");
}

export function issueAccess(secret: string) {
  const expiry = Math.floor(Date.now() / 1000) + ACCESS_SECONDS;
  return `${expiry}.${sign(expiry, secret)}`;
}

export function validAccess(value: string | undefined, secret: string) {
  if (!value || !/^\d{10,12}\.[A-Za-z0-9_-]{43}$/.test(value)) return false;
  const [timestamp, signature] = value.split(".");
  const expiry = Number(timestamp);
  return expiry > Math.floor(Date.now() / 1000) && validCode(signature, sign(expiry, secret));
}

export async function hasAccess() {
  const code = configuredAccessCode();
  if (!code) return false;
  return validAccess((await cookies()).get(ACCESS_COOKIE)?.value, code);
}

export async function requirePageAccess() {
  if (!(await hasAccess())) redirect("/access");
}
