import { redirect } from "next/navigation";
import { ResendVerificationButton } from "@/components/ResendVerificationButton";
import { SubmitForm } from "@/components/SubmitForm";
import { YardCard, YardContainer, YardHeader, YardPage } from "@/components/yard/YardPage";
import { requireSession } from "@/lib/auth";
import { getActiveCategoryNames } from "@/lib/categories";

export default async function SubmitPage() {
  const session = await requireSession(["creator", "agency", "admin"]);
  if (!session) redirect("/login");

  const categories = await getActiveCategoryNames();

  return (
    <YardPage>
      <YardHeader
        narrow
        eyebrow="New entry"
        title="Submit creative work"
        description="Tell the story behind the work that never saw daylight."
      />
      <YardContainer narrow>
        {!session.emailVerified && (session.role === "creator" || session.role === "agency") ? (
          <YardCard className="mb-6 border-accent/40 bg-accent/5 p-5">
            <p className="font-semibold text-ink">Email verification required</p>
            <p className="mt-1 text-[14px] text-mute">
              Verify your email before creating a submission.
            </p>
            <div className="mt-3">
              <ResendVerificationButton />
            </div>
          </YardCard>
        ) : (
          <YardCard className="p-6 md:p-8">
            <SubmitForm categories={categories} />
          </YardCard>
        )}
      </YardContainer>
    </YardPage>
  );
}
