# DressSystem

手機優先的衣物管理系統。可拍照或從相簿上傳、自訂分類、跨分類挑衣物，並把搭配儲存為穿搭單。

## 本機啟動

1. 使用 Node.js 22。執行 `npm install`，將 `.env.example` 複製為 `.env.local`。
2. 建立 Supabase 專案。在該專案的 **SQL Editor** 執行一次 [初始資料庫遷移](supabase/migrations/20261127000000_create_wardrobe.sql)。遷移會建立資料表、資料權限、私人照片儲存空間與預設分類。
3. 在 `.env.local` 填寫下列設定。
4. 執行 `npm run dev`，開啟 [http://localhost:3000](http://localhost:3000)。

| 環境變數 | 值 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Publishable key，開頭為 `sb_publishable_` |
| `SUPABASE_SECRET_KEY` | Supabase Secret key，開頭為 `sb_secret_` |
| `DRESS_ACCESS_CODE` | 共用衣櫃存取碼，至少 20 字元。可用下方指令產生 |

```powershell
node -e "console.log(require('node:crypto').randomBytes(24).toString('base64url'))"
```

金鑰和存取碼只填在 `.env.local` 或 Vercel 的環境變數設定。存取碼會記住 30 天。更換存取碼並重新部署，即可讓先前核發的存取 Cookie 失效。

## 部署至 Vercel

1. 將程式提交至 [DressSystem GitHub 儲存庫](https://github.com/William901105/DressSystem)。
2. 從 [Vercel](https://vercel.com/new) 匯入該 GitHub 儲存庫。框架選 **Next.js**，Root Directory 使用儲存庫根目錄。
3. 在 **Settings → Environment Variables** 設定上述四個值。Production 必須有一份設定，Preview 可使用獨立的 Supabase 專案與存取碼。
4. 部署後用手機的 HTTPS 網址測試相機與相簿上傳。

## 驗收

- 執行 `npm run typecheck` 與 `npm run build`。
- 輸入存取碼。新增兩個分類，確認可改名與調整排序。
- 用手機各測一次拍照與相簿上傳。確認照片預覽、分類篩選和編輯衣物都可操作。
- 從不同分類加入衣物，填寫名稱與備註後送出，確認穿搭紀錄能展開並顯示照片。
- 改名或封存穿搭單中的衣物，回看舊單核對當時的名稱、分類與照片。封存衣物可從衣櫃移回。

照片會在瀏覽器縮圖並轉成 JPEG，再以簽名網址直傳到 Supabase。相簿可讀取的格式取決於使用的瀏覽器。照片簽名網址過期時可重新整理頁面。未儲存的過期上傳會在後續上傳時清理。
