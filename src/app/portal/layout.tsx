import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PortalNav } from "@/components/yard/PortalNav";
import { requireSession } from "@/lib/auth";
import { needsAgencyOnboarding } from "@/lib/nest/roles";
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

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession(["creator", "agency", "admin"]);
  if (!session) redirect("/login?next=/portal");

  if (
    needsAgencyOnboarding({
      role: session.nestRole,
      agencyName: session.agencyName,
      agencyOnboardingRequired: session.agencyOnboardingRequired,
    })
  ) {
    redirect("/onboarding/agency");
  }

  return (
    <div className="flex flex-1 flex-col">
      <PortalNav items={PORTAL_NAV} />
      {children}
    </div>
  );
}
