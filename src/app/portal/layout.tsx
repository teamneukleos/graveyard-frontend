import { PortalNav } from "@/components/yard/PortalNav";

const PORTAL_NAV = [
  { href: "/portal", label: "My work" },
  { href: "/portal/submit", label: "New submission" },
  { href: "/settings", label: "Settings" },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <PortalNav items={PORTAL_NAV} />
      {children}
    </div>
  );
}
