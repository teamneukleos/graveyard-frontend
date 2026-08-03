import { PortalNav } from "@/components/yard/PortalNav";

const ADMIN_NAV = [
  { href: "/admin", label: "Submissions" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/judges", label: "Judges" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <PortalNav items={ADMIN_NAV} />
      {children}
    </div>
  );
}
