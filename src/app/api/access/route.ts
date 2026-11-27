import { ACCESS_COOKIE, ACCESS_SECONDS, configuredAccessCode, issueAccess, validCode } from "@/lib/server/access";
import { api, ApiError, body, json } from "@/lib/server/api";

export const POST = api(async (request) => {
  const expected = configuredAccessCode();
  if (!expected) throw new ApiError(503, "請確認 Vercel Production 已設定 DRESS_ACCESS_CODE，並重新部署。");

  const { code } = await body(request);
  if (typeof code !== "string" || code.length > 256 || !validCode(code.trim(), expected)) {
    throw new ApiError(401, "存取碼有誤，請再試一次。");
  }

  const response = json({ ok: true });
  response.cookies.set(ACCESS_COOKIE, issueAccess(expected), {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_SECONDS,
  });
  return response;
}, { protected: false });
