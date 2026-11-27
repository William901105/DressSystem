import { MAX_OUTFIT_ITEMS } from "@/lib/models";
import { api, ApiError, body, field, id, json } from "@/lib/server/api";
import { database, ensureSuccess } from "@/lib/server/database";

export const POST = api(async (request) => {
  const input = await body(request);
  if (!Array.isArray(input.clothingIds) || !input.clothingIds.length || input.clothingIds.length > MAX_OUTFIT_ITEMS) {
    throw new ApiError(400, `請挑選 1 至 ${MAX_OUTFIT_ITEMS} 件衣物。`);
  }

  const garmentIds = input.clothingIds.map(id);
  if (new Set(garmentIds).size !== garmentIds.length) throw new ApiError(400, "每件衣物可加入一次。");
  const { data, error } = await database().rpc("create_outfit", {
    new_id: id(input.id),
    outfit_name: field(input.name, "穿搭名稱", 80),
    outfit_notes: field(input.notes, "備註", 500, false),
    garment_ids: garmentIds,
  });
  ensureSuccess(error);
  return json({ id: data }, 201);
});
