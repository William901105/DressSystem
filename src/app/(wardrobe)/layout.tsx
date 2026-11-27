import type { ReactNode } from "react";
import { Navigation } from "@/components/navigation";
import { requireWardrobeAccess } from "@/lib/server/database";

export const dynamic = "force-dynamic";

export default async function WardrobeLayout({ children }: { children: ReactNode }) {
  await requireWardrobeAccess();
  return (
    <div className="shell">
      <Navigation />
      <main className="main-content" id="main-content">{children}</main>
    </div>
  );
}
