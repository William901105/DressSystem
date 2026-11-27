"use client";

import { ImageOff, X, type LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { Category } from "@/lib/models";

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <header className="page-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </header>
  );
}

export function EmptyState({ icon: Icon, title, description, children }: {
  icon: LucideIcon; title: string; description: string; children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon aria-hidden="true" size={32} strokeWidth={1.5} /></div>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  );
}

export function FilterBar({ categories, current, onChange }: {
  categories: Category[]; current: string; onChange: (id: string) => void;
}) {
  const filters = [{ id: "", name: "全部" }, ...categories];
  return (
    <div className="filter-bar" aria-label="按分類篩選" role="group">
      {filters.map(({ id, name }) => (
        <button key={id} type="button" className="filter" aria-pressed={current === id} onClick={() => onChange(id)}>
          {name}
        </button>
      ))}
    </div>
  );
}

export function Photo({ url, name, eager = false }: { url: string; name: string; eager?: boolean }) {
  const [failedUrl, setFailedUrl] = useState("");
  if (!url || failedUrl === url) {
    return <div className="photo-fallback" role="img" aria-label={`${name}的照片目前無法顯示`}><ImageOff size={26} aria-hidden="true" /></div>;
  }
  return <img className="photo" src={url} alt={name} loading={eager ? "eager" : "lazy"} decoding="async" onError={() => setFailedUrl(url)} />;
}

export function Modal({ title, busy, onClose, children }: {
  title: string; busy?: boolean; onClose: () => void; children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog ref={ref} className="modal" aria-labelledby={titleId} onCancel={(event) => {
      event.preventDefault();
      if (!busy) onClose();
    }}>
      <div className="modal-inner">
        <header className="modal-heading">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-button" aria-label="關閉" disabled={busy} onClick={onClose}><X size={21} aria-hidden="true" /></button>
        </header>
        {children}
      </div>
    </dialog>
  );
}

export function Notice({ error, children }: { error?: boolean; children: ReactNode }) {
  return <p className={error ? "notice error" : "notice"} role={error ? "alert" : "status"}>{children}</p>;
}
