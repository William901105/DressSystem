import type { Metadata } from "next";
import { CategoryManager } from "@/components/categories";
import { readCategories } from "@/lib/server/wardrobe";

export const metadata: Metadata = { title: "分類管理" };

export default async function CategoriesPage() {
  return <CategoryManager categories={await readCategories()} />;
}
