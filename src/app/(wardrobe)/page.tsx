import { Closet } from "@/components/closet";
import { readWardrobe } from "@/lib/server/wardrobe";

export default async function ClosetPage() {
  const wardrobe = await readWardrobe(true);
  return <Closet {...wardrobe} />;
}
