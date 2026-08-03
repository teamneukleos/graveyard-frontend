import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { AdminSubmissionTable } from "@/components/AdminSubmissionTable";
import {
  YardContainer,
  YardHeader,
  YardPage,
  YardStat,
} from "@/components/yard/YardPage";
import { db } from "@/db";
import { submissions, users } from "@/db/schema";
import { requireSession } from "@/lib/auth";

export default async function AdminPage() {
  const session = await requireSession(["admin"]);
  if (!session) redirect("/login");

  const rows = await db.query.submissions.findMany({
    orderBy: [desc(submissions.updatedAt)],
    with: { user: true, reviews: true },
  });

  const judges = await db.query.users.findMany({
    where: eq(users.role, "judge"),
  });

  const published = rows.filter((r) => r.published).length;
  const submitted = rows.filter((r) => r.status !== "draft").length;

  return (
    <YardPage>
      <YardHeader
        eyebrow="Admin portal"
        title="Operations"
        description="Manage submissions, categories, judges, events, and publish the showcase."
        actions={
          <Link href="/showcase" className="btn btn-ghost">
            View showcase
          </Link>
        }
      />

      <YardContainer>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <YardStat label="Submissions" value={rows.length} />
          <YardStat label="In review+" value={submitted} />
          <YardStat label="Published" value={published} accent />
          <YardStat label="Judges" value={judges.length} />
        </div>

        <section className="mt-12">
          <h2 className="font-display text-3xl tracking-tight text-ink">All submissions</h2>
          <div className="mt-4 overflow-hidden rounded-[24px] border border-line bg-white/90 p-4 md:p-6">
            <AdminSubmissionTable
              submissions={rows.map((r) => ({
                id: r.id,
                title: r.title,
                category: r.category,
                status: r.status,
                published: r.published,
                showcaseYear: r.showcaseYear,
                submitter: r.user.agencyName || r.user.name,
                avgScore:
                  r.reviews.length > 0
                    ? r.reviews.reduce((sum, rev) => sum + rev.score, 0) / r.reviews.length
                    : null,
              }))}
            />
          </div>
        </section>
      </YardContainer>
    </YardPage>
  );
}
