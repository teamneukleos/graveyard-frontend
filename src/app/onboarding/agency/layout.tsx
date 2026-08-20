import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Agency setup",
  description: "Finish setting up your Graveyard agency account.",
  path: "/onboarding/agency",
  noIndex: true,
});

export default function AgencyOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
