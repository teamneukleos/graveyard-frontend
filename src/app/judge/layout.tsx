import type { Metadata } from "next";
import { PortalNav } from "@/components/yard/PortalNav";
import { buildMetadata } from "@/lib/seo";

const JUDGE_NAV = [
  { href: "/judge", label: "Queue" },
  { href: "/settings", label: "Settings" },
];

export const metadata: Metadata = buildMetadata({
  title: "Judge queue",
  description: "Review Graveyard submissions.",
  path: "/judge",
  noIndex: true,
});

export default function JudgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <PortalNav items={JUDGE_NAV} />
      {children}
    </div>
  );
}
