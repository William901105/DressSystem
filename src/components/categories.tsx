"use client";

import { ChevronDown, ChevronUp, Edit3, Plus, Tag, Tags, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { errorMessage, send } from "@/lib/client";
import type { Category } from "@/lib/models";
import { EmptyState, Modal, Notice, PageHeader } from "./ui";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [editor, setEditor] = useState<Category | "new" | null>(null);
  const [removing, setRemoving] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const router = useRouter();
  const blocked = busy || refreshing;

  function begin(category: Category | "new") {
    setName(category === "new" ? "" : category.name);
    setError("");
    setEditor(category);
  }

  async function update(method: string, data: object, message: string) {
    if (blocked) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await send("/api/categories", method, data);
      setEditor(null);
      setRemoving(null);
      setNotice(message);
      startTransition(() => router.refresh());
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    if (editor === "new") void update("POST", { name }, "分類已新增。");
    else void update("PATCH", { id: editor.id, name }, "分類名稱已更新。");
  }

  function move(index: number, distance: number) {
    const ids = categories.map(({ id }) => id);
    const destination = index + distance;
    if (destination < 0 || destination >= ids.length) return;
    [ids[destination], ids[index]] = [ids[index], ids[destination]];
    void update("PUT", { ids }, "分類順序已更新。");
  }

  return (
    <>
      <PageHeader title="分類管理" description="自訂分類與顯示順序，衣櫃和配穿搭頁會同步更新。">
        <button type="button" className="button primary" onClick={() => begin("new")} disabled={blocked}>
          <Plus size={20} aria-hidden="true" />新增分類
        </button>
      </PageHeader>
      {notice && <Notice>{notice}</Notice>}
      {error && !editor && !removing && <Notice error>{error}</Notice>}
      {categories.length ? (
        <ul className="category-list">
          {categories.map((category, index) => (
            <li className="category-row" key={category.id}>
              <div className="category-name">
                <span className="category-icon"><Tag size={20} aria-hidden="true" /></span>
                <span>{category.name}</span>
              </div>
              <div className="row-actions">
                <button className="icon-button" aria-label={`將${category.name}往上移`} title="上移"
                  disabled={blocked || index === 0} onClick={() => move(index, -1)}><ChevronUp size={20} aria-hidden="true" /></button>
                <button className="icon-button" aria-label={`將${category.name}往下移`} title="下移"
                  disabled={blocked || index === categories.length - 1} onClick={() => move(index, 1)}><ChevronDown size={20} aria-hidden="true" /></button>
                <button className="icon-button" aria-label={`編輯${category.name}`} title="編輯"
                  disabled={blocked} onClick={() => begin(category)}><Edit3 size={17} aria-hidden="true" /></button>
                <button className="icon-button destructive" aria-label={`刪除${category.name}`} title="刪除"
                  disabled={blocked} onClick={() => { setRemoving(category); setError(""); }}><Trash2 size={18} aria-hidden="true" /></button>
              </div>
            </li>
          ))}
        </ul>
      ) : <EmptyState icon={Tags} title="還沒有分類" description="新增一個分類，開始整理衣櫃。" />}
      {editor && (
        <Modal title={editor === "new" ? "新增分類" : "編輯分類"} busy={busy} onClose={() => { setEditor(null); setError(""); }}>
          <form onSubmit={save} className="stack">
            <div className="field">
              <label htmlFor="category-name">分類名稱</label>
              <input id="category-name" autoFocus maxLength={40} required value={name}
                placeholder="例如：圍巾" onChange={(event) => setName(event.target.value)} />
            </div>
            {error && <Notice error>{error}</Notice>}
            <div className="modal-actions">
              <button className="button primary" type="submit" disabled={busy || !name.trim()}>{busy ? "儲存中…" : "儲存分類"}</button>
            </div>
          </form>
        </Modal>
      )}
      {removing && (
        <Modal title="刪除分類" busy={busy} onClose={() => { setRemoving(null); setError(""); }}>
          <div className="stack">
            <p>確定要刪除「{removing.name}」？</p>
            {error && <Notice error>{error}</Notice>}
            <div className="modal-actions">
              <button className="button secondary" disabled={busy} onClick={() => { setRemoving(null); setError(""); }}>取消</button>
              <button className="button danger" disabled={busy} onClick={() => void update("DELETE", { id: removing.id }, "分類已刪除。")}>
                {busy ? "刪除中…" : "刪除分類"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
