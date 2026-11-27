"use client";

import { Eye, EyeOff, LockKeyhole, Shirt } from "lucide-react";
import { useState, type FormEvent } from "react";
import { errorMessage, send } from "@/lib/client";
import { Notice } from "./ui";

export function AccessForm({ configured }: { configured: boolean }) {
  const [code, setCode] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await send("/api/access", "POST", { code });
      window.location.replace("/");
    } catch (cause) {
      setError(errorMessage(cause));
      setBusy(false);
    }
  }

  return (
    <main className="access-shell">
      <div className="access-art" aria-hidden="true">
        <div className="access-emblem"><Shirt size={104} strokeWidth={1.05} /></div>
      </div>
      <section className="access-panel">
        <div className="access-content">
          <div className="brand">
            <span className="brand-mark"><Shirt size={23} aria-hidden="true" /></span>
            <span>DressSystem</span>
          </div>
          <h1>開啟我的衣櫃</h1>
          {configured ? (
            <form className="stack" onSubmit={submit}>
              <label htmlFor="access-code">衣櫃存取碼</label>
              <div className="password-field">
                <input id="access-code" type={visible ? "text" : "password"} autoComplete="current-password"
                  maxLength={256} required value={code} onChange={(event) => setCode(event.target.value)} />
                <button className="icon-button" type="button" aria-label={visible ? "隱藏存取碼" : "顯示存取碼"}
                  onClick={() => setVisible(!visible)}>
                  {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                </button>
              </div>
              {error && <Notice error>{error}</Notice>}
              <button className="button primary" type="submit" disabled={busy || !code}>
                <LockKeyhole size={18} aria-hidden="true" />{busy ? "正在開啟…" : "開啟衣櫃"}
              </button>
            </form>
          ) : <Notice>請先設定 Supabase 連線與衣櫃存取碼。</Notice>}
        </div>
      </section>
    </main>
  );
}
