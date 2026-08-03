"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Judge = {
  id: string;
  email: string;
  name: string;
  active: boolean;
  createdAt: string;
};

export function JudgesManager({ initialJudges }: { initialJudges: Judge[] }) {
  const router = useRouter();
  const [judges, setJudges] = useState(initialJudges);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/admin/judges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Could not create judge.");
      return;
    }

    setJudges((prev) => [data.judge, ...prev]);
    e.currentTarget.reset();
    router.refresh();
  }

  async function toggleActive(judge: Judge) {
    setBusyId(judge.id);
    setError("");
    const res = await fetch("/api/admin/judges", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: judge.id, active: !judge.active }),
    });
    const data = await res.json();
    setBusyId(null);

    if (!res.ok) {
      setError(data.error || "Could not update judge.");
      return;
    }

    setJudges((prev) =>
      prev.map((j) => (j.id === data.judge.id ? data.judge : j)),
    );
    router.refresh();
  }

  return (
    <div className="mt-10 grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={onSubmit} className="space-y-4 border border-stone/70 bg-soil/60 p-6">
        <h2 className="font-display text-2xl text-bone">Add judge</h2>
        <div>
          <label className="label" htmlFor="name">
            Name
          </label>
          <input className="field" id="name" name="name" required />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input className="field" id="email" name="email" type="email" required />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Temporary password
          </label>
          <input className="field" id="password" name="password" type="password" minLength={8} required />
        </div>
        {error ? <p className="text-sm text-ember">{error}</p> : null}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create judge"}
        </button>
      </form>

      <div>
        <h2 className="font-display text-2xl text-bone">Current judges</h2>
        <ul className="mt-4 space-y-3">
          {judges.map((judge) => (
            <li
              key={judge.id}
              className="flex flex-wrap items-center justify-between gap-3 border border-stone/60 px-4 py-3"
            >
              <div>
                <p className="text-bone">{judge.name}</p>
                <p className="text-sm text-ash">
                  {judge.email} · {judge.active ? "Active" : "Inactive"}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost !px-3 !py-1.5 !text-xs"
                disabled={busyId === judge.id}
                onClick={() => void toggleActive(judge)}
              >
                {judge.active ? "Deactivate" : "Reactivate"}
              </button>
            </li>
          ))}
          {judges.length === 0 ? <li className="text-ash">No judges yet.</li> : null}
        </ul>
      </div>
    </div>
  );
}
