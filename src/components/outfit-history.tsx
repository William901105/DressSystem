"use client";

import { ChevronDown, ClipboardList } from "lucide-react";
import Link from "next/link";
import type { Outfit } from "@/lib/models";
import { EmptyState, PageHeader, Photo } from "./ui";

const dateFormatter = new Intl.DateTimeFormat("zh-TW", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tokyo",
});

export function OutfitHistory({ outfits }: { outfits: Outfit[] }) {
  return (
    <>
      <PageHeader title="穿搭紀錄">
        <Link className="button primary" href="/compose">配一套穿搭</Link>
      </PageHeader>
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
              </div>
            </details>
          ))}
        </div>
      ) : <EmptyState icon={ClipboardList} title="還沒有穿搭單" description="送出穿搭後，就能在這裡回看每套搭配。" />}
    </>
  );
}
