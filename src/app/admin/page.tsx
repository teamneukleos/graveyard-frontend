import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminSubmissionTable } from "@/components/AdminSubmissionTable";
import {
  YardContainer,
  YardHeader,
  YardPage,
  YardStat,
} from "@/components/yard/YardPage";
import { getAccessToken, requireSession } from "@/lib/auth";
import { nestAdminSubmissions, nestAwardCycles } from "@/lib/nest/client";
import { mapNestStatus, safeApi } from "@/lib/nest/mappers";

export default async function AdminPage() {
  const session = await requireSession(["admin"]);
  if (!session) redirect("/login");

  const token = await getAccessToken();
  const [submissions, cycles] = await Promise.all([
    token
      ? safeApi(nestAdminSubmissions(100, token), [])
      : Promise.resolve([]),
    safeApi(nestAwardCycles(), []),
  ]);

  const rows = submissions.map((s) => ({
    id: s.id,
    title: s.title,
    category: s.category.name,
    status: mapNestStatus(s.status),
    published:
      Boolean(s.publishedAt) &&
      s.status !== "DRAFT" &&
      s.status !== "REJECTED" &&
      s.status !== "ARCHIVED",
    showcaseYear: s.publishedAt ? new Date(s.publishedAt).getFullYear() : null,
    submitter: s.creator.agencyName || s.creator.name,
    avgScore: null as number | null,
  }));

  return (
    <YardPage>
      <YardHeader
        eyebrow="Admin portal"
        title="Operations"
        description="Manage submissions against the Nest API."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/events" className="btn btn-ghost">
              Events
            </Link>
            <Link href="/admin/cycles" className="btn btn-ghost">
              Award cycles
            </Link>
          </div>
        }
      />

      <YardContainer>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <YardStat label="Submissions" value={rows.length} />
          <YardStat
            label="Published"
            value={rows.filter((r) => r.published).length}
          />
          <YardStat label="Award cycles" value={cycles.length} />
          <YardStat
            label="Judging"
            value={cycles.filter((c) => c.status === "JUDGING").length}
            accent
          />
        </div>

        <section className="mt-12">
          <h2 className="font-display text-3xl tracking-tight text-ink">All submissions</h2>
          <div className="mt-4 overflow-hidden rounded-[24px] border border-line bg-white/90 p-4 md:p-6">
            <AdminSubmissionTable submissions={rows} />
          </div>
        </section>
      </YardContainer>
    </YardPage>
  );
}
