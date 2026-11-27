import "server-only";

import type { Category, Garment, Outfit, OutfitItem } from "@/lib/models";
import { database, ensureWardrobeRead, photos, requireWardrobeAccess } from "./database";

type GarmentRecord = Omit<Garment, "photoUrl"> & { photo_path: string };
type ItemRecord = Omit<OutfitItem, "photoUrl"> & { photo_path: string };
type OutfitRecord = Omit<Outfit, "outfit_items"> & { outfit_items: ItemRecord[] };

async function signPhotos(db: ReturnType<typeof database>, paths: string[]) {
  const unique = [...new Set(paths)];
  if (!unique.length) return new Map<string, string>();
  const { data, error } = await photos(db).createSignedUrls(unique, 3600);
  if (error) throw new Error("Unable to load clothing photos");
  return new Map((data ?? []).flatMap(({ path, signedUrl, error }) =>
    path && signedUrl && !error ? [[path, signedUrl] as const] : [],
  ));
}

async function categories(db: ReturnType<typeof database>) {
  const { data, error, status } = await db.from("categories").select("id,name,sort_order").order("sort_order").order("id");
  ensureWardrobeRead(error, status);
  return (data ?? []) as Category[];
}

export async function readCategories() {
  await requireWardrobeAccess();
  return categories(database());
}

export async function readWardrobe(includeArchived = false) {
  await requireWardrobeAccess();
  const db = database();
  const query = db.from("clothes").select("id,name,category_id,archived_at,photo_path").order("created_at", { ascending: false });
  if (!includeArchived) query.is("archived_at", null);
  const [categoryList, { data, error, status }] = await Promise.all([categories(db), query]);
  ensureWardrobeRead(error, status);

  const records = (data ?? []) as GarmentRecord[];
  const urls = await signPhotos(db, records.map(({ photo_path }) => photo_path));
  return {
    categories: categoryList,
    clothes: records.map(({ photo_path, ...garment }) => ({ ...garment, photoUrl: urls.get(photo_path) ?? "" })),
  };
}

export async function readOutfits() {
  await requireWardrobeAccess();
  const db = database();
  const { data, error, status } = await db.from("outfits")
    .select("id,name,notes,created_at,outfit_items(position,clothing_name,category_name,photo_path)")
    .order("created_at", { ascending: false });
  ensureWardrobeRead(error, status);

  const records = (data ?? []) as OutfitRecord[];
  const urls = await signPhotos(db, records.flatMap(({ outfit_items }) => outfit_items.map(({ photo_path }) => photo_path)));
  return records.map(({ outfit_items, ...outfit }): Outfit => ({
    ...outfit,
    outfit_items: outfit_items
      .sort((a, b) => a.position - b.position)
      .map(({ photo_path, ...item }) => ({ ...item, photoUrl: urls.get(photo_path) ?? "" })),
  }));
}
