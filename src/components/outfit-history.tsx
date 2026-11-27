"use client";

import { ChevronDown, ClipboardList, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { errorMessage, send } from "@/lib/client";
import type { Outfit } from "@/lib/models";
import { EmptyState, Modal, Notice, PageHeader, Photo } from "./ui";

const dateFormatter = new Intl.DateTimeFormat("zh-TW", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tokyo",
});

export function OutfitHistory({ outfits }: { outfits: Outfit[] }) {
  const router = useRouter();
  const [removing, setRemoving] = useState<Outfit | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [deleted, setDeleted] = useState(false);

  async function deleteOutfit() {
    if (!removing || busy || refreshing) return;
    setBusy(true);
    setError("");
    try {
      await send("/api/outfits", "DELETE", { id: removing.id });
      setRemoving(null);
      setDeleted(true);
      startTransition(() => router.refresh());
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="穿搭紀錄">
        <Link className="button primary" href="/compose">配一套穿搭</Link>
      </PageHeader>
      {deleted && <Notice>穿搭紀錄已刪除。</Notice>}
      {outfits.length ? (
        <div className="history-list">
          {outfits.map((outfit, index) => (
            <details className="outfit" key={outfit.id} open={index === 0}>
              <summary className="outfit-summary">
                <span className="category-icon"><ClipboardList size={21} aria-hidden="true" /></span>
                <div>
                  <h2>{outfit.name}</h2>
                  <time dateTime={outfit.created_at}>{dateFormatter.format(new Date(outfit.created_at))}</time>
                </div>
                <span className="number-pill">{outfit.outfit_items.length} 件</span>
                <ChevronDown className="outfit-chevron" size={20} aria-hidden="true" />
              </summary>
              <div className="outfit-content">
                {outfit.notes && <p className="outfit-note">{outfit.notes}</p>}
                <ul className="outfit-photos">
                  {outfit.outfit_items.map((item) => (
                    <li key={item.position}>
                      <div className="garment-image"><Photo url={item.photoUrl} name={item.clothing_name} /></div>
                      <strong>{item.clothing_name}</strong>
                      <span>{item.category_name}</span>
                    </li>
                  ))}
                </ul>
                <div className="outfit-actions">
                  <button type="button" className="button quiet" disabled={busy || refreshing}
                    aria-label={`刪除穿搭紀錄「${outfit.name}」`}
                    onClick={() => { setRemoving(outfit); setError(""); setDeleted(false); }}>
                    <Trash2 size={17} aria-hidden="true" />刪除紀錄
                  </button>
                </div>
              </div>
            </details>
          ))}
        </div>
      ) : <EmptyState icon={ClipboardList} title="還沒有穿搭單" description="送出穿搭後，就能在這裡回看每套搭配。" />}
      {removing && (
        <Modal title="刪除穿搭紀錄" busy={busy} onClose={() => setRemoving(null)}>
          <div className="stack">
            <p>確定要永久刪除「{removing.name}」？衣物的挑選次數會依剩餘穿搭紀錄重新計算。</p>
            {error && <Notice error>{error}</Notice>}
            <div className="modal-actions">
              <button type="button" className="button secondary" disabled={busy}
                onClick={() => setRemoving(null)}>取消</button>
              <button type="button" className="button danger" disabled={busy}
                onClick={() => void deleteOutfit()}>{busy ? "刪除中…" : "永久刪除"}</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
