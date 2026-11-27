import { PHOTO_BUCKET, PHOTO_MAX_BYTES, type UploadTicket } from "./models";
import { send } from "./client";

const MAX_SIDE = 1800;

function openImage(file: Blob) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const source = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(source);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(source);
      reject(new Error("無法開啟這張照片，請改用 JPG、PNG，或直接拍照。"));
    };
    image.src = source;
  });
}

export async function preparePhoto(file: File) {
  if (file.size > 30 * 1024 * 1024) throw new Error("請選擇 30 MB 以內的原始照片。");

  const image = await openImage(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("目前的瀏覽器無法處理照片。");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  for (const quality of [0.88, 0.72, 0.55]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (blob?.size && blob.size <= PHOTO_MAX_BYTES) return blob;
  }
  throw new Error("照片壓縮後仍過大，請換一張照片。");
}

export function requestUpload(photo: Blob) {
  return send<UploadTicket>("/api/clothes/upload", "POST", { size: photo.size });
}

export async function uploadPhoto(ticket: UploadTicket, photo: Blob) {
  const { createClient } = await import("@supabase/supabase-js");
  const storage = createClient(ticket.url, ticket.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  }).storage.from(PHOTO_BUCKET);

  const { error } = await storage.uploadToSignedUrl(ticket.path, ticket.token, photo, {
    contentType: "image/jpeg",
    cacheControl: "3600",
  });
  if (error) {
    const status = "statusCode" in error ? String(error.statusCode) : "";
    if (status === "409" || (status === "400" && /already exists/i.test(error.message))) return;
    throw new Error("照片上傳失敗，請檢查網路後重試。");
  }
}
