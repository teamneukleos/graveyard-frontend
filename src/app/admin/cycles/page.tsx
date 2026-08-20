import { redirect } from "next/navigation";
import { AwardCyclesManager } from "@/components/AwardCyclesManager";
import { YardContainer, YardHeader, YardPage } from "@/components/yard/YardPage";
import { getAccessToken, requireSession } from "@/lib/auth";
import { nestAwardCycles, nestListUsers } from "@/lib/nest/client";
import { safeApi } from "@/lib/nest/mappers";

export default async function AdminCyclesPage() {
  const session = await requireSession(["admin"]);
  if (!session) redirect("/login");

  const token = await getAccessToken();
  const [cycles, judgesListed] = await Promise.all([
    safeApi(nestAwardCycles(token), []),
    token
      ? safeApi(nestListUsers({ role: "JUDGE", limit: 100 }, token), {
          data: [],
          total: 0,
          page: 1,
          limit: 100,
        })
      : Promise.resolve({ data: [], total: 0, page: 1, limit: 100 }),
  ]);

  const judges = judgesListed.data.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
  }));

  return (
    <YardPage>
      <YardHeader
        eyebrow="Admin"
        title="Award cycles"
        description="Create cycles, update status, and assign judges. Use View or Edit on any row."
      />
      <YardContainer>
        <div className="overflow-hidden rounded-[24px] border border-line bg-white/90 p-5 md:p-8">
          <AwardCyclesManager initialCycles={cycles} judges={judges} />
        </div>
      </YardContainer>
    </YardPage>
  );
}
