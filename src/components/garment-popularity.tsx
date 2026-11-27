import type { Garment } from "@/lib/models";

export type PopularityOrder = "ascending" | "descending";

export function sortByPopularity(clothes: Garment[], order: PopularityOrder) {
  const direction = order === "ascending" ? 1 : -1;
  return [...clothes].sort((a, b) => direction * (a.selection_count - b.selection_count));
}

export function PopularitySort({ order, onChange }: {
  order: PopularityOrder;
  onChange: (order: PopularityOrder) => void;
}) {
  return (
    <select className="popularity-sort" aria-label="熱門程度排序" value={order}
      onChange={(event) => onChange(event.target.value === "descending" ? "descending" : "ascending")}>
      <option value="ascending">熱門程度由小到大</option>
      <option value="descending">熱門程度由大到小</option>
    </select>
  );
}

export function SelectionCount({ count }: { count: number }) {
  const description = `被挑選 ${count} 次`;
  return (
    <div className="garment-popularity">
      <span className="selection-count" role="img" aria-label={description} title={description}>{count}</span>
    </div>
  );
}
