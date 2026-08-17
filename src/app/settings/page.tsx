import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SettingsForm } from "@/components/SettingsForm";
import { YardCard, YardContainer, YardHeader, YardPage } from "@/components/yard/YardPage";
import { requireSession } from "@/lib/auth";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Settings",
  description: "Manage your Graveyard account settings.",
  path: "/settings",
  noIndex: true,
});

export default async function SettingsPage() {
  const session = await requireSession();
  if (!session) redirect("/login?next=/settings");

  return (
    <YardPage>
      <YardHeader
        narrow
        eyebrow="Account"
        title="Settings"
        description="Update your profile and avatar."
      />
      <YardContainer narrow>
        <YardCard className="p-6 md:p-8">
          <SettingsForm
            initial={{
              id: session.id,
              email: session.email,
              name: session.name,
              role: session.role,
              agencyName: session.agencyName,
              bio: session.bio || "",
              avatarUrl: session.avatarUrl,
            }}
          />
        </YardCard>
      </YardContainer>
    </YardPage>
  );
}
