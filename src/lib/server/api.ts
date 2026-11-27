import "server-only";

import { NextResponse } from "next/server";
import { hasAccess } from "./access";

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}

function sameOrigin(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const { host } = new URL(origin);
    return host === new URL(request.url).host || host === request.headers.get("host");
  } catch {
    return false;
  }
}

export function api(handler: (request: Request) => Promise<unknown>, options = { protected: true }) {
  return async (request: Request) => {
    try {
      if (options.protected && !(await hasAccess())) throw new ApiError(401, "請重新輸入衣櫃存取碼。");
      if (!["GET", "HEAD"].includes(request.method) && !sameOrigin(request)) throw new ApiError(403, "此請求來源無法使用。");
      const result = await handler(request);
      return result instanceof Response ? result : json(result);
    } catch (error) {
      if (error instanceof ApiError) return json({ error: error.message }, error.status);
      console.error("DressSystem request failed", error instanceof Error ? error.name : "Unknown error");
      return json({ error: "操作暫時無法完成，請稍後重試。" }, 500);
    }
  };
}

export async function body(request: Request): Promise<Record<string, unknown>> {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    throw new ApiError(415, "請使用 JSON 格式送出資料。");
  }
  const raw = await request.text();
  if (raw.length > 16_384) throw new ApiError(413, "送出的資料過大。");
  let result: unknown;
  try {
    result = JSON.parse(raw);
  } catch {
    throw new ApiError(400, "送出的資料格式有誤。");
  }
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new ApiError(400, "送出的資料格式有誤。");
  }
  return result as Record<string, unknown>;
}

export function id(value: unknown) {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new ApiError(400, "資料編號格式有誤。");
  }
  return value.toLowerCase();
}

export function field(value: unknown, label: string, max: number, required = true) {
  if (typeof value !== "string" || value.includes("\0")) throw new ApiError(400, `請填寫正確的${label}。`);
  const text = value.trim();
  if (required && !text) throw new ApiError(400, `請填寫${label}。`);
  if ([...text].length > max) throw new ApiError(400, `${label}最多 ${max} 個字元。`);
  return text;
}
