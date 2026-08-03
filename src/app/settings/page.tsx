import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { SettingsForm } from "@/components/SettingsForm";
import { YardCard, YardContainer, YardHeader, YardPage } from "@/components/yard/YardPage";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireSession } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await requireSession();
  if (!session) redirect("/login?next=/settings");

  const user = await db.query.users.findFirst({ where: eq(users.id, session.id) });
  if (!user) redirect("/login");

  return (
    <YardPage>
      <YardHeader
        narrow
        eyebrow="Account"
        title="Settings"
        description="Update your profile, avatar, and password."
      />
      <YardContainer narrow>
        <YardCard className="p-6 md:p-8">
          <SettingsForm
            initial={{
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              agencyName: user.agencyName,
              bio: user.bio || "",
              avatarFilename: user.avatarFilename,
              emailVerified: Boolean(user.emailVerifiedAt),
            }}
          />
        </YardCard>
      </YardContainer>
    </YardPage>
  );
}
