import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "DressSystem", template: "%s | DressSystem" },
  description: "拍照整理衣物、搭配穿搭、回看穿搭單。",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
