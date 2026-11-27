export const PHOTO_BUCKET = "clothing-photos";
export const PHOTO_MAX_BYTES = 3 * 1024 * 1024;
export const MAX_OUTFIT_ITEMS = 50;

export type Category = {
  id: string;
  name: string;
  sort_order: number;
};

export type Garment = {
  id: string;
  name: string;
  category_id: string;
  archived_at: string | null;
  selection_count: number;
  photoUrl: string;
};

export type OutfitItem = {
  position: number;
  clothing_name: string;
  category_name: string;
  photoUrl: string;
};

export type Outfit = {
  id: string;
  name: string;
  notes: string;
  created_at: string;
  outfit_items: OutfitItem[];
};

export type UploadTicket = {
  id: string;
  path: string;
  token: string;
  url: string;
  key: string;
};
