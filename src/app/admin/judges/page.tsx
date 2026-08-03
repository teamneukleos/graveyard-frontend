import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { JudgesManager } from "@/components/JudgesManager";
import { YardContainer, YardHeader, YardPage } from "@/components/yard/YardPage";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireSession } from "@/lib/auth";

export default async function AdminJudgesPage() {
  const session = await requireSession(["admin"]);
  if (!session) redirect("/login");

  const judges = await db.query.users.findMany({
    where: eq(users.role, "judge"),
    orderBy: [desc(users.createdAt)],
  });

  return (
    <YardPage>
      <YardHeader
        eyebrow="Admin"
        title="Manage judges"
        description="Invite industry reviewers and toggle access."
      />
      <YardContainer>
        <div className="overflow-hidden rounded-[24px] border border-line bg-white/90 p-5 md:p-8">
          <JudgesManager
            initialJudges={judges.map((j) => ({
              id: j.id,
              email: j.email,
              name: j.name,
              active: j.active,
              createdAt: j.createdAt,
            }))}
          />
        </div>
      </YardContainer>
    </YardPage>
  );
}
