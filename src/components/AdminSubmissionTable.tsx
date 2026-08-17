"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { StatusPill } from "@/components/StatusPill";
import { CURRENT_YEAR, SUBMISSION_STATUSES } from "@/lib/constants";

type Row = {
  id: string;
  title: string;
  category: string;
  status: string;
  published: boolean;
  showcaseYear: number | null;
  submitter: string;
  avgScore: number | null;
};

export function AdminSubmissionTable({ submissions }: { submissions: Row[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const allSelected = useMemo(
    () => submissions.length > 0 && selected.length === submissions.length,
    [selected, submissions],
  );

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleAll() {
    setSelected(allSelected ? [] : submissions.map((s) => s.id));
  }

  async function updateOne(id: string, patch: Record<string, unknown>) {
    const res = await fetch("/api/admin/submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error || "Update failed.");
      return;
    }
    setMessage("Updated.");
    router.refresh();
  }

  async function publishSelected(published: boolean, markWinners = false) {
    if (selected.length === 0) {
      setMessage("Select at least one submission.");
      return;
    }
    const res = await fetch("/api/admin/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: selected,
        published,
        showcaseYear: CURRENT_YEAR,
        markWinners,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error || "Publish failed.");
      return;
    }
    setMessage(published ? "Published to showcase." : "Unpublished.");
    setSelected([]);
    router.refresh();
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-wrap gap-2">
        <button className="btn btn-primary py-2 text-sm" type="button" onClick={() => publishSelected(true)}>
          Publish selected
        </button>
        <button
          className="btn btn-ghost py-2 text-sm"
          type="button"
          onClick={() => publishSelected(true, true)}
        >
          Publish as winners
        </button>
        <button className="btn btn-ghost py-2 text-sm" type="button" onClick={() => publishSelected(false)}>
          Unpublish
        </button>
      </div>
      {message ? <p className="mb-3 text-sm text-moss">{message}</p> : null}

      <div className="overflow-x-auto border border-stone/70">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-soil text-ash">
            <tr>
              <th className="px-3 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th className="px-3 py-3 font-medium">Title</th>
              <th className="px-3 py-3 font-medium">Category</th>
              <th className="px-3 py-3 font-medium">Submitter</th>
              <th className="px-3 py-3 font-medium">Score</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Showcase</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((row) => (
              <tr key={row.id} className="border-t border-stone/50">
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(row.id)}
                    onChange={() => toggle(row.id)}
                  />
                </td>
                <td className="px-3 py-3 font-medium text-ink">{row.title}</td>
                <td className="px-3 py-3 text-ash">{row.category}</td>
                <td className="px-3 py-3 text-ash">{row.submitter}</td>
                <td className="px-3 py-3 text-ash">
                  {row.avgScore != null ? row.avgScore.toFixed(1) : "-"}
                </td>
                <td className="px-3 py-3">
                  <select
                    className="field py-1"
                    value={row.status}
                    onChange={(e) => updateOne(row.id, { status: e.target.value })}
                  >
                    {SUBMISSION_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <StatusPill status={row.published ? "winner" : row.status} />
                    <button
                      type="button"
                      className="text-xs text-moss hover:underline"
                      onClick={() =>
                        updateOne(row.id, {
                          published: !row.published,
                          showcaseYear: row.published ? null : CURRENT_YEAR,
                        })
                      }
                    >
                      {row.published ? "Unpublish" : "Publish"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
