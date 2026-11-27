import "server-only";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { PHOTO_BUCKET } from "@/lib/models";
import { requirePageAccess } from "./access";
import { ApiError } from "./api";
import { authenticationSettings, supabaseKey } from "./supabase-settings";

export function databaseSettings() {
  const { config, invalid } = authenticationSettings();
  const secretKey = supabaseKey(process.env.SUPABASE_SECRET_KEY, "sb_secret_");
  return {
    config: config && secretKey ? { ...config, secretKey } : null,
    invalid: secretKey ? invalid : [...invalid, "SUPABASE_SECRET_KEY"],
  };
}

export function requireDatabaseSettings() {
  const { config } = databaseSettings();
  if (!config) throw new ApiError(503, "Supabase 連線設定尚未完成，請檢查 Vercel Production 環境變數。");
  return config;
}

export async function requireWardrobeAccess() {
  await requirePageAccess();
  if (!databaseSettings().config) redirect("/access");
}

export function database() {
  const config = requireDatabaseSettings();
  return createClient(config.url, config.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}

export function photos(db: ReturnType<typeof database>) {
  return db.storage.from(PHOTO_BUCKET);
}

export function photoPath(id: string) {
  return `clothes/${id}.jpg`;
}

export function ensureWardrobeRead(error: { code: string; message: string } | null, status: number) {
  if (error?.code === "PGRST205" || error?.code === "42P01") redirect("/access?setup=schema");
  if (error && ([401, 403].includes(status) || error.code === "42501")) redirect("/access?setup=credentials");
  ensureSuccess(error);
}

export function ensureSuccess(error: { code: string; message: string } | null, foreignKeyMessage?: string) {
  if (!error) return;

  switch (error.code) {
    case "23505":
      throw new ApiError(409, "這個名稱已存在。");
    case "23503":
      throw new ApiError(409, foreignKeyMessage ?? "關聯的資料已變更，請重新整理後再試。");
    case "P0001":
      switch (error.message) {
        case "category_list_changed":
          throw new ApiError(409, "其他裝置已更新分類，請重新整理後再排序。");
        case "upload_expired":
          throw new ApiError(410, "照片上傳已逾時，請重新上傳。");
        case "outfit_selection_invalid":
          throw new ApiError(400, "請重新選擇穿搭衣物。");
        case "outfit_item_unavailable":
          throw new ApiError(409, "部分衣物已封存，請重新整理後再選擇。");
        case "outfit_id_conflict":
          throw new ApiError(409, "這張穿搭單已送出，請到穿搭紀錄查看。");
      }
  }
  console.error("DressSystem database error", error.code);
  throw new ApiError(500, "資料庫暫時無法完成操作，請稍後重試。");
}
