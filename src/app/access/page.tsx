import { redirect } from "next/navigation";
import { AccessForm } from "@/components/access-form";
import { hasAccess } from "@/lib/server/access";
import { databaseSettings } from "@/lib/server/database";
import { authenticationSettings } from "@/lib/server/supabase-settings";

export const dynamic = "force-dynamic";

export default async function AccessPage({ searchParams }: {
  searchParams: Promise<{ setup?: string | string[] }>;
}) {
  if (!(await hasAccess())) return <AccessForm configured={Boolean(authenticationSettings().config)} />;

  const { invalid } = databaseSettings();
  const { setup } = await searchParams;
  if (invalid.length) {
    return <AccessForm configured setup={{
      message: "請在 Vercel 的 Production 環境補上或更正以下設定，然後重新部署。",
      variables: invalid,
    }} />;
  }
  if (setup === "schema") {
    return <AccessForm configured setup={{
      message: "衣櫃資料表尚未就緒。請在這個 Supabase 專案的 SQL Editor 執行 DressSystem 的初始資料庫遷移。",
    }} />;
  }
  if (setup === "credentials") {
    return <AccessForm configured setup={{
      message: "Supabase 拒絕讀取衣櫃資料。請確認 Vercel Production 的 SUPABASE_SECRET_KEY 來自同一個 Supabase 專案，再重新部署。",
    }} />;
  }
  redirect("/");
}
