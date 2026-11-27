import type { ReactNode } from "react";
import { Navigation } from "@/components/navigation";
import { requirePageAccess } from "@/lib/server/access";

export default async function WardrobeLayout({ children }: { children: ReactNode }) {
  await requirePageAccess();
  return (
    <div className="shell">
      <Navigation />
      <main className="main-content" id="main-content">{children}</main>
    </div>
  );
}
