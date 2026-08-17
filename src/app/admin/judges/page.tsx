import { redirect } from "next/navigation";
import { JudgesManager } from "@/components/JudgesManager";
import { YardContainer, YardHeader, YardPage } from "@/components/yard/YardPage";
import { getAccessToken, requireSession } from "@/lib/auth";
import { nestListUsers } from "@/lib/nest/client";
import { safeApi } from "@/lib/nest/mappers";

export default async function AdminJudgesPage() {
  const session = await requireSession(["admin"]);
  if (!session) redirect("/login");

  const token = await getAccessToken();
  const listed = token
    ? await safeApi(nestListUsers({ role: "JUDGE", limit: 100 }, token), {
        data: [],
        total: 0,
        page: 1,
        limit: 100,
      })
    : { data: [], total: 0, page: 1, limit: 100 };

  const judges = listed.data.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    active: user.role === "JUDGE" || user.role === "ADMIN" || user.role === "SUPER_ADMIN",
    createdAt: user.createdAt,
  }));

  return (
    <YardPage>
      <YardHeader
        eyebrow="Admin"
        title="Judges"
        description="Create judge accounts and deactivate them (maps to Nest roles)."
      />
      <YardContainer>
        <div className="overflow-hidden rounded-[24px] border border-line bg-white/90 p-5 md:p-8">
          <JudgesManager initialJudges={judges} />
        </div>
      </YardContainer>
    </YardPage>
  );
}
