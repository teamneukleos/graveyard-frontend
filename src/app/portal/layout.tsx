import type { Metadata } from "next";
import { PortalNav } from "@/components/yard/PortalNav";
import { buildMetadata } from "@/lib/seo";

const PORTAL_NAV = [
  { href: "/portal", label: "My work" },
  { href: "/portal/submit", label: "New submission" },
  { href: "/settings", label: "Settings" },
];

export const metadata: Metadata = buildMetadata({
  title: "Creator portal",
  description: "Manage your Graveyard submissions and awards.",
  path: "/portal",
  noIndex: true,
});

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <PortalNav items={PORTAL_NAV} />
      {children}
    </div>
  );
}
