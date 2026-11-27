"use client";

import { CircleAlert } from "lucide-react";
import { EmptyState } from "@/components/ui";

export default function WardrobeError({ reset }: { reset: () => void }) {
  return (
    <EmptyState icon={CircleAlert} title="暫時無法載入衣櫃" description="請確認網路連線，稍後再試。">
      <button className="button primary" onClick={reset}>重新載入</button>
    </EmptyState>
  );
}
