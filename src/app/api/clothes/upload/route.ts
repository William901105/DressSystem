import { randomUUID } from "node:crypto";
import { api, ApiError, body, json } from "@/lib/server/api";
import { database, ensureSuccess, photoPath, photos, requireDatabaseSettings } from "@/lib/server/database";
import { PHOTO_MAX_BYTES, type UploadTicket } from "@/lib/models";

async function cleanExpired(db: ReturnType<typeof database>) {
  const cutoff = new Date(Date.now() - 3_600_000).toISOString();
  const stale = await db.from("photo_uploads").select("id").lt("expires_at", cutoff).limit(20);
  if (!stale.data?.length) return;

  const ids = stale.data.map(({ id }) => id as string);
  const { error } = await photos(db).remove(ids.map(photoPath));
  if (!error) await db.from("photo_uploads").delete().in("id", ids).lt("expires_at", cutoff);
}

export const POST = api(async (request) => {
  const { size } = await body(request);
  if (typeof size !== "number" || !Number.isSafeInteger(size) || size < 1 || size > PHOTO_MAX_BYTES) {
    throw new ApiError(400, "照片大小須在 3 MB 以內。");
  }

  const config = requireDatabaseSettings();
  const db = database();
  try {
    await cleanExpired(db);
  } catch {
    console.error("DressSystem could not clean up expired photo uploads");
  }

  const id = randomUUID();
  const path = photoPath(id);
  const { error } = await db.from("photo_uploads").insert({ id });
  ensureSuccess(error);

  const result = await photos(db).createSignedUploadUrl(path, { upsert: false });
  if (result.error || !result.data) {
    await db.from("photo_uploads").delete().eq("id", id);
    throw new ApiError(502, "照片上傳服務暫時無法使用，請重試。");
  }

  const ticket: UploadTicket = {
    id, path, token: result.data.token, url: config.url, key: config.publishableKey,
  };
  return json(ticket, 201);
});
