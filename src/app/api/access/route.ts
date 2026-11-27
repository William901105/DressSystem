import { ACCESS_COOKIE, ACCESS_SECONDS, configuration, issueAccess, validCode } from "@/lib/server/access";
import { api, ApiError, body, json } from "@/lib/server/api";

export const POST = api(async (request) => {
  const { code } = await body(request);
  const config = configuration()!;
  if (typeof code !== "string" || code.length > 256 || !validCode(code, config.accessCode)) {
    throw new ApiError(401, "存取碼有誤，請再試一次。");
  }

  const response = json({ ok: true });
  response.cookies.set(ACCESS_COOKIE, issueAccess(config.accessCode), {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_SECONDS,
  });
  return response;
}, { protected: false });
