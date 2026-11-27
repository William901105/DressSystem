"use client";

import { Camera, Edit3, Images, Plus, Shirt, Tags } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { errorMessage, RequestError, send } from "@/lib/client";
import { preparePhoto, requestUpload, uploadPhoto } from "@/lib/client-photo";
import type { Category, Garment, UploadTicket } from "@/lib/models";
import { EmptyState, FilterBar, Modal, Notice, PageHeader, Photo } from "./ui";

export function Closet({ categories, clothes }: { categories: Category[]; clothes: Garment[] }) {
  const [filter, setFilter] = useState("");
  const [archived, setArchived] = useState(false);
  const [editing, setEditing] = useState<Garment | "new" | null>(null);
  const [notice, setNotice] = useState("");
  const router = useRouter();
  const currentFilter = categories.some(({ id }) => id === filter) ? filter : "";
  const filtered = clothes.filter((garment) =>
    Boolean(garment.archived_at) === archived && (!currentFilter || garment.category_id === currentFilter),
  );
  const labels = new Map(categories.map(({ id, name }) => [id, name]));

  function finish(message: string) {
    if (editing === "new") {
      setArchived(false);
      setFilter("");
    }
    setEditing(null);
    setNotice(message);
    router.refresh();
  }

  return (
    <>
      <PageHeader title="我的衣櫃" description="拍下衣物照片，按分類整理。">
        {categories.length > 0 && (
          <button type="button" className="button primary" onClick={() => setEditing("new")}>
            <Plus size={20} aria-hidden="true" />新增衣物
          </button>
        )}
      </PageHeader>
      <FilterBar categories={categories} current={currentFilter} onChange={setFilter} />
      <div className="list-toolbar">
        <span>{filtered.length} 件衣物</span>
        <div className="segmented" role="group" aria-label="衣物狀態">
          <button type="button" aria-pressed={!archived} onClick={() => setArchived(false)}>衣櫃</button>
          <button type="button" aria-pressed={archived} onClick={() => setArchived(true)}>已封存</button>
        </div>
      </div>
      {notice && <Notice>{notice}</Notice>}
      {filtered.length ? (
        <div className="garment-grid">
          {filtered.map((garment) => (
            <article className="garment-card" key={garment.id}>
              <div className="garment-image"><Photo url={garment.photoUrl} name={garment.name} /></div>
              <div className="garment-meta">
                <div><h2>{garment.name}</h2><p>{labels.get(garment.category_id)}</p></div>
                <button className="icon-button subtle" type="button" aria-label={`編輯${garment.name}`} onClick={() => setEditing(garment)}>
                  <Edit3 size={18} aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState icon={Tags} title="先建立一個分類" description="建立分類後就能加入第一件衣物。">
          <Link className="button secondary" href="/categories">前往分類管理</Link>
        </EmptyState>
      ) : (
        <EmptyState icon={Shirt} title={archived ? "目前沒有已封存的衣物" : "這裡還沒有衣物"}
          description={archived ? "封存後的衣物會顯示在這裡。" : "選擇「新增衣物」，就能拍照或從相簿上傳。"} />
      )}
      {editing && <GarmentEditor garment={editing === "new" ? null : editing} categories={categories}
        initialCategory={currentFilter} onClose={() => setEditing(null)} onSaved={finish} />}
    </>
  );
}

function GarmentEditor({ garment, categories, initialCategory, onClose, onSaved }: {
  garment: Garment | null;
  categories: Category[];
  initialCategory: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [name, setName] = useState(garment?.name ?? "");
  const [categoryId, setCategoryId] = useState(garment?.category_id ?? (initialCategory || categories[0]?.id || ""));
  const [photo, setPhoto] = useState<Blob>();
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const ticket = useRef<UploadTicket | null>(null);
  const stored = useRef(false);
  const camera = useRef<HTMLInputElement>(null);
  const album = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (preview) return () => URL.revokeObjectURL(preview);
  }, [preview]);

  async function select(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setBusy("正在處理照片…");
    try {
      const prepared = await preparePhoto(file);
      setPhoto(prepared);
      setPreview(URL.createObjectURL(prepared));
      ticket.current = null;
      stored.current = false;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "無法處理照片，請重試。");
    } finally {
      setBusy("");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setBusy("正在儲存…");
    try {
      if (garment) {
        await send("/api/clothes", "PATCH", { id: garment.id, name, categoryId });
      } else if (photo) {
        ticket.current ??= await requestUpload(photo);
        if (!stored.current) {
          setBusy("正在上傳照片…");
          await uploadPhoto(ticket.current, photo);
          stored.current = true;
        }
        setBusy("正在儲存…");
        await send("/api/clothes", "POST", { uploadId: ticket.current.id, name, categoryId });
      } else {
        return;
      }
      onSaved(garment ? "衣物已更新。" : "衣物已加入衣櫃。");
    } catch (cause) {
      if (cause instanceof RequestError && [410, 422].includes(cause.status)) {
        ticket.current = null;
        stored.current = false;
      }
      setError(cause instanceof RequestError ? cause.message :
        cause instanceof Error && cause.message.startsWith("照片") ? cause.message : errorMessage(cause));
    } finally {
      setBusy("");
    }
  }

  async function archive() {
    if (!garment || busy) return;
    setBusy("正在儲存…");
    setError("");
    try {
      await send("/api/clothes", "PATCH", { id: garment.id, archived: !garment.archived_at });
      onSaved(garment.archived_at ? "衣物已移回衣櫃。" : "衣物已封存。");
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy("");
    }
  }

  return (
    <Modal title={garment ? "編輯衣物" : "新增衣物"} busy={Boolean(busy)} onClose={onClose}>
      <form onSubmit={submit} className="stack">
        {!garment && <>
          <div className={preview ? "upload-preview" : "upload-placeholder"}>
            {preview ? <Photo url={preview} name="上傳預覽" eager /> : <><Camera size={28} aria-hidden="true" /><span>加入衣物照片</span></>}
          </div>
          <div className="photo-actions">
            <input hidden type="file" ref={camera} accept="image/*" capture="environment" onChange={select} />
            <input hidden type="file" ref={album} accept="image/*" onChange={select} />
            <button type="button" className="button secondary" disabled={Boolean(busy)} onClick={() => camera.current?.click()}>
              <Camera size={18} aria-hidden="true" />拍照
            </button>
            <button type="button" className="button secondary" disabled={Boolean(busy)} onClick={() => album.current?.click()}>
              <Images size={18} aria-hidden="true" />從相簿選擇
            </button>
          </div>
        </>}
        <div className="field">
          <label htmlFor="garment-name">衣物名稱</label>
          <input id="garment-name" maxLength={80} required value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：深藍襯衫" />
        </div>
        <div className="field">
          <label htmlFor="garment-category">分類</label>
          <select id="garment-category" required value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            {categories.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
          </select>
        </div>
        {error && <Notice error>{error}</Notice>}
        <div className="modal-actions">
          {garment && <button className="button quiet" type="button" disabled={Boolean(busy)} onClick={archive}>
            {garment.archived_at ? "移回衣櫃" : "封存衣物"}
          </button>}
          <button className="button primary" type="submit" disabled={Boolean(busy) || (!garment && !photo) || !name.trim() || !categoryId}>
            {busy || (garment ? "儲存變更" : "加入衣櫃")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
