"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { NestAwardCycle, NestAwardEntry } from "@/lib/nest/types";

export function EnterForAward({
  submissionId,
  openCycles,
  existingEntries,
}: {
  submissionId: string;
  openCycles: NestAwardCycle[];
  existingEntries: NestAwardEntry[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [busyCycleId, setBusyCycleId] = useState<string | null>(null);

  const enteredIds = new Set(existingEntries.map((e) => e.awardCycleId));

  async function enter(cycleId: string) {
    setError("");
    setBusyCycleId(cycleId);
    const res = await fetch("/api/awards/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cycleId, submissionId }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyCycleId(null);
    if (!res.ok) {
      setError(data.error || "Could not enter this award cycle.");
      return;
    }
    startTransition(() => router.refresh());
  }

  async function withdraw(cycleId: string) {
    setError("");
    setBusyCycleId(cycleId);
    const res = await fetch("/api/awards/entries", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cycleId, submissionId }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyCycleId(null);
    if (!res.ok) {
      setError(data.error || "Could not withdraw from this award cycle.");
      return;
    }
    startTransition(() => router.refresh());
  }

  if (openCycles.length === 0 && existingEntries.length === 0) {
    return (
      <p className="text-sm text-mute">No open award cycles right now.</p>
    );
  }

  return (
    <div className="space-y-3">
      {openCycles.map((cycle) => {
        const entered = enteredIds.has(cycle.id);
        const busy = pending || busyCycleId === cycle.id;
        return (
          <div
            key={cycle.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-soft/60 px-4 py-3"
          >
            <div>
              <p className="font-semibold text-ink">
                {cycle.name} · {cycle.year}
              </p>
              <p className="text-[12px] uppercase tracking-wider text-mute">
                {cycle.status.replace(/_/g, " ").toLowerCase()}
              </p>
            </div>
            {entered ? (
              <button
                type="button"
                className="btn btn-outline"
                disabled={busy}
                onClick={() => withdraw(cycle.id)}
              >
                {busy ? "…" : "Withdraw"}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy}
                onClick={() => enter(cycle.id)}
              >
                {busy ? "…" : "Enter project"}
              </button>
            )}
          </div>
        );
      })}
      {error ? <p className="text-sm text-[#c45a16]">{error}</p> : null}
    </div>
  );
}
