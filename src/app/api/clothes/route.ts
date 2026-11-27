import { api, ApiError, body, field, id, json } from "@/lib/server/api";
import { database, ensureSuccess, photoPath, photos } from "@/lib/server/database";

export const POST = api(async (request) => {
  const input = await body(request);
  const uploadId = id(input.uploadId);
  const name = field(input.name, "衣物名稱", 80);
  const categoryId = id(input.categoryId);
  const db = database();

  const pending = await db.from("photo_uploads").select("expires_at").eq("id", uploadId).maybeSingle();
  ensureSuccess(pending.error);
  if (!pending.data) {
    const existing = await db.from("clothes").select("id").eq("id", uploadId).maybeSingle();
    ensureSuccess(existing.error);
    if (existing.data) return existing.data;
    throw new ApiError(410, "照片上傳已逾時，請重新上傳。");
  }
  if (Date.parse(pending.data.expires_at) <= Date.now()) {
    throw new ApiError(410, "照片上傳已逾時，請重新上傳。");
  }

  const uploaded = await photos(db).exists(photoPath(uploadId));
  if (!uploaded.data) {
    const error = uploaded.error;
    if (error && (!("statusCode" in error) || !["400", "404"].includes(String(error.statusCode)))) {
      throw new ApiError(502, "暫時無法確認照片上傳狀態，請重試。");
    }
    throw new ApiError(422, "尚未收到照片，請重新上傳。");
  }

  const { data, error } = await db.rpc("add_garment", {
    upload_id: uploadId, garment_name: name, assigned_category: categoryId,
  });
  ensureSuccess(error, "選擇的分類已變更，請重新整理後再試。");
  return json({ id: data }, 201);
});

export const PATCH = api(async (request) => {
  const input = await body(request);
  const garmentId = id(input.id);
  const changes = typeof input.archived === "boolean"
    ? { archived_at: input.archived ? new Date().toISOString() : null }
    : { name: field(input.name, "衣物名稱", 80), category_id: id(input.categoryId) };

  const { data, error } = await database().from("clothes").update(changes)
    .eq("id", garmentId).select("id").maybeSingle();
  ensureSuccess(error, "選擇的分類已變更，請重新整理後再試。");
  if (!data) throw new ApiError(404, "找不到這件衣物。");
  return data;
});

export const DELETE = api(async (request) => {
  const input = await body(request);
  const garmentId = id(input.id);
  const { error } = await database().from("clothes").delete().eq("id", garmentId);
  ensureSuccess(error);
  return json({ ok: true });
});
