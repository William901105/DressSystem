"use client";

import { Eye, EyeOff, LockKeyhole, Shirt } from "lucide-react";
import { useState, type FormEvent } from "react";
import { errorMessage, send } from "@/lib/client";
import { Notice } from "./ui";

export function AccessForm({ configured, setup }: {
  configured: boolean;
  setup?: { message: string; variables?: string[] };
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await send("/api/access", "POST", { email, password });
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
          <h1>{setup ? "完成衣櫃設定" : "登入衣櫃"}</h1>
          {setup ? (
            <div className="stack">
              <p>登入成功。</p>
              <Notice>{setup.message}</Notice>
              {setup.variables && <ul>{setup.variables.map((variable) => <li key={variable}><code>{variable}</code></li>)}</ul>}
              <a className="button secondary" href="/">重新檢查</a>
            </div>
          ) : configured ? (
            <form className="stack" onSubmit={submit}>
              <div className="field">
                <label htmlFor="email">電子郵件</label>
                <input id="email" name="email" type="email" autoComplete="username" autoCapitalize="none"
                  spellCheck={false} maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="password">密碼</label>
                <div className="password-field">
                  <input id="password" name="password" type={visible ? "text" : "password"} autoComplete="current-password"
                    maxLength={256} required value={password} onChange={(event) => setPassword(event.target.value)} />
                  <button className="icon-button" type="button" aria-label={visible ? "隱藏密碼" : "顯示密碼"}
                    onClick={() => setVisible(!visible)}>
                    {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                  </button>
                </div>
              </div>
              {error && <Notice error>{error}</Notice>}
              <button className="button primary" type="submit" disabled={busy || !email || !password}>
                <LockKeyhole size={18} aria-hidden="true" />{busy ? "登入中…" : "登入"}
              </button>
            </form>
          ) : <Notice>請確認 Vercel Production 已設定 Supabase 專案 URL 與 Publishable key。</Notice>}
        </div>
      </section>
    </main>
  );
}
