import { api, ApiError, body, field, id, json } from "@/lib/server/api";
import { database, ensureSuccess } from "@/lib/server/database";

export const POST = api(async (request) => {
  const input = await body(request);
  const { data, error } = await database().from("categories")
    .insert({ name: field(input.name, "分類名稱", 40) }).select("id").single();
  ensureSuccess(error);
  return json({ id: data?.id }, 201);
});

export const PATCH = api(async (request) => {
  const input = await body(request);
  const { data, error } = await database().from("categories")
    .update({ name: field(input.name, "分類名稱", 40) }).eq("id", id(input.id)).select("id").maybeSingle();
  ensureSuccess(error);
  if (!data) throw new ApiError(404, "找不到這個分類。");
  return data;
});

export const PUT = api(async (request) => {
  const { ids } = await body(request);
  if (!Array.isArray(ids)) throw new ApiError(400, "請提供完整的分類順序。");
  const { error } = await database().rpc("reorder_categories", { category_ids: ids.map(id) });
  ensureSuccess(error);
  return { ok: true };
});

export const DELETE = api(async (request) => {
  const input = await body(request);
  const { error } = await database().from("categories").delete().eq("id", id(input.id));
  ensureSuccess(error, "這個分類仍有衣物，請先將它們移到其他分類。");
  return { ok: true };
});
