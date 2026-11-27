import { cookies } from "next/headers";
import { isWardrobeMember } from "@/lib/server/access";
import { api, ApiError, body, json } from "@/lib/server/api";
import { createAuthentication, isAuthCookie, secureAuthCookie } from "@/lib/server/auth-client";
import { authenticationSettings } from "@/lib/server/supabase-settings";

export const POST = api(async (request) => {
  const { config } = authenticationSettings();
  if (!config) throw new ApiError(503, "Supabase 登入設定尚未完成。");

  const { email: inputEmail, password } = await body(request);
  const email = typeof inputEmail === "string" ? inputEmail.trim() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+$/.test(email)
    || typeof password !== "string" || !password || password.length > 256) {
    throw new ApiError(400, "請填寫電子郵件與密碼。");
  }

  const jar = await cookies();
  const response = json({ ok: true });
  const auth = createAuthentication(config, {
    getAll: () => jar.getAll(),
    setAll(changes) {
      for (const { name, value, options } of changes) response.cookies.set(name, value, options);
    },
  }, secureAuthCookie(request));
  const { data, error } = await auth.auth.signInWithPassword({ email, password });
  if (error?.status === 429) throw new ApiError(429, "登入嘗試過於頻繁，請稍後再試。");
  if (error && (error.status === 0 || (error.status ?? 0) >= 500)) {
    throw new ApiError(503, "登入服務暫時無法使用，請稍後再試。");
  }
  if (error || !data.session || data.user?.is_anonymous || !isWardrobeMember(data.user?.app_metadata)) {
    if (data.session) await auth.auth.signOut({ scope: "local" });
    throw new ApiError(401, "電子郵件或密碼有誤，或此帳號沒有衣櫃權限。");
  }
  return response;
}, { protected: false });

export const DELETE = api(async (request) => {
  const jar = await cookies();
  const response = json({ ok: true });
  const { config } = authenticationSettings();
  const secure = secureAuthCookie(request);
  const authCookies = jar.getAll().filter(({ name }) => isAuthCookie(name));
  if (config && authCookies.length) {
    const auth = createAuthentication(config, {
      getAll: () => authCookies,
      setAll(changes) {
        for (const { name, value, options } of changes) response.cookies.set(name, value, options);
      },
    }, secure);
    await auth.auth.signOut({ scope: "local" });
  }
  for (const { name } of authCookies) {
    response.cookies.set(name, "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 });
  }
  return response;
}, { protected: false });
