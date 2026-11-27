"use client";

import { ClipboardList, LayoutGrid, Shirt, Tags, WandSparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", text: "衣櫃", icon: LayoutGrid },
  { href: "/categories", text: "分類管理", icon: Tags },
  { href: "/compose", text: "配穿搭", icon: WandSparkles },
  { href: "/outfits", text: "穿搭紀錄", icon: ClipboardList },
];

export function Navigation() {
  const pathname = usePathname();
  return (
    <aside className="rail">
      <Link href="/" className="brand" aria-label="DressSystem 衣櫃">
        <span className="brand-mark"><Shirt size={22} aria-hidden="true" strokeWidth={1.9} /></span>
        <span>DressSystem</span>
      </Link>
      <nav className="nav" aria-label="主選單">
        {links.map(({ href, text, icon: Icon }) => (
          <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>
            <Icon size={21} aria-hidden="true" strokeWidth={1.8} />
            <span>{text}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
