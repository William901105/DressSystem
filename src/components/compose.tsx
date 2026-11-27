"use client";

import { Check, ClipboardCheck, Plus, Shirt, X } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { errorMessage, send } from "@/lib/client";
import { MAX_OUTFIT_ITEMS, type Category, type Garment } from "@/lib/models";
import { PopularitySort, SelectionCount, sortByPopularity, type PopularityOrder } from "./garment-popularity";
import { EmptyState, FilterBar, Modal, Notice, PageHeader, Photo } from "./ui";

export function Compose({ categories, clothes }: { categories: Category[]; clothes: Garment[] }) {
  const [filter, setFilter] = useState("");
  const [order, setOrder] = useState<PopularityOrder>("ascending");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [checkout, setCheckout] = useState(false);
  const [notice, setNotice] = useState("");
  const labels = new Map(categories.map(({ id, name }) => [id, name]));
  const garments = new Map(clothes.map((item) => [item.id, item]));
  const chosen = selectedIds.flatMap((id) => {
    const garment = garments.get(id);
    return garment ? [garment] : [];
  });
  const selected = new Set(chosen.map(({ id }) => id));
  const currentFilter = labels.has(filter) ? filter : "";
  const shown = sortByPopularity(
    currentFilter ? clothes.filter(({ category_id }) => category_id === currentFilter) : clothes,
    order,
  );

  function toggle(id: string) {
    if (!selected.has(id) && selected.size >= MAX_OUTFIT_ITEMS) {
      setNotice(`每張穿搭單最多可加入 ${MAX_OUTFIT_ITEMS} 件衣物。`);
      return;
    }
    setNotice("");
    setSelectedIds((previous) => previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]);
  }

  return (
    <>
      <PageHeader title="配穿搭" description="切換分類，點選衣物加入穿搭清單。" />
      {clothes.length ? (
        <div className="compose-layout">
          <section className="compose-list" aria-label="挑選衣物">
            <div className="garment-toolbar">
              <FilterBar categories={categories} current={currentFilter} onChange={setFilter} />
              <PopularitySort order={order} onChange={setOrder} />
            </div>
            {notice && <Notice>{notice}</Notice>}
            {shown.length ? (
              <div className="garment-grid">
                {shown.map((garment) => {
                  const checked = selected.has(garment.id);
                  return (
                    <button key={garment.id} className="garment-card pick-card" type="button" aria-pressed={checked} onClick={() => toggle(garment.id)}>
                      <div className="garment-image">
                        <Photo url={garment.photoUrl} name="" />
                        <span className="pick-mark">{checked ? <Check size={17} aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}</span>
                      </div>
                      <SelectionCount count={garment.selection_count} />
                      <div className="garment-meta"><div><strong>{garment.name}</strong><p>{labels.get(garment.category_id)}</p></div></div>
                    </button>
                  );
                })}
              </div>
            ) : <EmptyState icon={Shirt} title="這個分類還沒有衣物" description="切換分類繼續挑選。" />}
          </section>
          <aside className="basket" aria-labelledby="basket-title">
            <div className="basket-heading">
              <h2 id="basket-title">穿搭清單</h2>
              <span className="number-pill" aria-live="polite">{chosen.length} 件</span>
            </div>
            {chosen.length ? (
              <ul className="basket-items">
                {chosen.map(({ id, name, photoUrl }) => (
                  <li key={id}>
                    <div className="basket-thumb"><Photo url={photoUrl} name="" /></div>
                    <span>{name}</span>
                    <button className="icon-button" type="button" aria-label={`移除${name}`} onClick={() => toggle(id)}>
                      <X size={17} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="basket-placeholder">尚未選擇衣物</p>}
            <button className="button primary" type="button" disabled={!chosen.length} onClick={() => setCheckout(true)}>
              <ClipboardCheck size={19} aria-hidden="true" />建立穿搭單
            </button>
          </aside>
        </div>
      ) : (
        <EmptyState icon={Shirt} title="先從衣櫃加入衣物" description="衣物加入後，就可以挑選並建立穿搭單。">
          <Link className="button secondary" href="/">回到衣櫃</Link>
        </EmptyState>
      )}
      {checkout && <Checkout clothes={chosen} onClose={() => setCheckout(false)} onSaved={() => {
        setCheckout(false);
        setSelectedIds([]);
        window.location.assign("/outfits");
      }} />}
    </>
  );
}

function Checkout({ clothes, onClose, onSaved }: { clothes: Garment[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const orderId = useRef<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !clothes.length) return;
    setBusy(true);
    setError("");
    try {
      orderId.current ??= crypto.randomUUID();
      await send("/api/outfits", "POST", {
        id: orderId.current, name, notes, clothingIds: clothes.map(({ id }) => id),
      });
      onSaved();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="建立穿搭單" busy={busy} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <p className="muted">{clothes.length} 件衣物</p>
        <ul className="checkout-items">{clothes.map(({ id, name }) => <li key={id}>{name}</li>)}</ul>
        <div className="field">
          <label htmlFor="outfit-name">穿搭名稱</label>
          <input id="outfit-name" autoFocus required maxLength={80} placeholder="例如：週末逛街" value={name}
            onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="outfit-notes">備註（選填）</label>
          <textarea id="outfit-notes" maxLength={500} rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>
        {error && <Notice error>{error}</Notice>}
        <div className="modal-actions">
          <button type="submit" className="button primary" disabled={busy || !name.trim() || !clothes.length}>
            {busy ? "送出中…" : "送出穿搭單"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
