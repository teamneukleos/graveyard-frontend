import { PortalNav } from "@/components/yard/PortalNav";

const JUDGE_NAV = [
  { href: "/judge", label: "Queue" },
  { href: "/settings", label: "Settings" },
];

export default function JudgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <PortalNav items={JUDGE_NAV} />
      {children}
    </div>
  );
}
