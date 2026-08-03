import type { Metadata } from "next";
import { PortalNav } from "@/components/yard/PortalNav";
import { buildMetadata } from "@/lib/seo";

const ADMIN_NAV = [
  { href: "/admin", label: "Submissions" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/judges", label: "Judges" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
];

export const metadata: Metadata = buildMetadata({
  title: "Admin",
  description: "Graveyard admin tools.",
  path: "/admin",
  noIndex: true,
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <PortalNav items={ADMIN_NAV} />
      {children}
    </div>
  );
}
