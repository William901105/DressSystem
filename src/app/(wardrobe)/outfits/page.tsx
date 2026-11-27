import type { Metadata } from "next";
import { OutfitHistory } from "@/components/outfit-history";
import { readOutfits } from "@/lib/server/wardrobe";

export const metadata: Metadata = { title: "穿搭紀錄" };

export default async function OutfitsPage() {
  return <OutfitHistory outfits={await readOutfits()} />;
}
