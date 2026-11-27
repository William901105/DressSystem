import type { Metadata } from "next";
import { Compose } from "@/components/compose";
import { readWardrobe } from "@/lib/server/wardrobe";

export const metadata: Metadata = { title: "配穿搭" };

export default async function ComposePage() {
  return <Compose {...await readWardrobe()} />;
}
