import Link from "next/link";
import { redirect } from "next/navigation";
import {
  YardContainer,
  YardEmpty,
  YardHeader,
  YardPage,
} from "@/components/yard/YardPage";
import { requireSession } from "@/lib/auth";
import { nestAwardCycles } from "@/lib/nest/client";
import { safeApi } from "@/lib/nest/mappers";

export default async function AdminCyclesPage() {
  const session = await requireSession(["admin"]);
  if (!session) redirect("/login");

  const cycles = await safeApi(nestAwardCycles(), []);

  return (
    <YardPage>
      <YardHeader
        eyebrow="Admin"
        title="Award cycles"
        description="Read-only Nest award cycles."
        actions={
          <Link href="/admin" className="btn btn-ghost">
            Submissions
          </Link>
        }
      />

      <YardContainer>
        <div className="overflow-x-auto rounded-[24px] border border-line bg-white/90">
          {cycles.length === 0 ? (
            <div className="p-4 md:p-6">
              <YardEmpty>No award cycles from Nest yet.</YardEmpty>
            </div>
          ) : (
            <table className="min-w-full text-left text-[13px]">
              <thead className="border-b border-line text-[11px] font-bold uppercase tracking-wider text-mute">
                <tr>
                  <th className="px-4 py-3 md:px-6">Name</th>
                  <th className="px-4 py-3 md:px-6">Year</th>
                  <th className="px-4 py-3 md:px-6">Status</th>
                  <th className="px-4 py-3 md:px-6">Judges</th>
                  <th className="px-4 py-3 md:px-6">Scores</th>
                </tr>
              </thead>
              <tbody>
                {cycles.map((cycle) => (
                  <tr key={cycle.id} className="border-b border-line/70 last:border-b-0">
                    <td className="px-4 py-3 font-semibold text-ink md:px-6">{cycle.name}</td>
                    <td className="px-4 py-3 tabular-nums text-mute md:px-6">{cycle.year}</td>
                    <td className="px-4 py-3 text-mute md:px-6">{cycle.status}</td>
                    <td className="px-4 py-3 tabular-nums text-ink md:px-6">
                      {cycle.judgeCount ?? 0}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-ink md:px-6">
                      {cycle.scoreCount ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </YardContainer>
    </YardPage>
  );
}
