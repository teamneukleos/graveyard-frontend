"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type PortalNavItem = {
  href: string;
  label: string;
};

function isActivePath(pathname: string, href: string) {
  if (pathname === href) return true;
  const roots = new Set(["/admin", "/judge", "/portal", "/settings"]);
  if (roots.has(href)) return false;
  return pathname.startsWith(`${href}/`) || pathname.startsWith(`${href}?`);
}

export function PortalNav({ items }: { items: PortalNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border-b border-line bg-white/70 px-4 py-3 backdrop-blur-md md:px-6">
      <div className="mx-auto flex w-full max-w-[1440px] flex-wrap gap-2">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                active ? "bg-accent text-white" : "bg-canvas text-ink hover:bg-[#e0e0e0]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
