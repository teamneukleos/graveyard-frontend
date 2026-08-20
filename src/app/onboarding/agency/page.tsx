import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { needsAgencyOnboarding } from "@/lib/nest/roles";
import { AgencyOnboardingForm } from "./AgencyOnboardingForm";

export default async function AgencyOnboardingPage() {
  const session = await requireSession(["agency"]);
  if (!session) redirect("/login?next=/onboarding/agency");

  if (
    !needsAgencyOnboarding({
      role: session.nestRole,
      agencyName: session.agencyName,
      agencyOnboardingRequired: session.agencyOnboardingRequired,
    })
  ) {
    redirect("/portal");
  }

  return <AgencyOnboardingForm />;
}
