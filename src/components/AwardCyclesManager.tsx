"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { NestAwardCycle } from "@/lib/nest/types";

const STATUS_FLOW: Record<NestAwardCycle["status"], NestAwardCycle["status"][]> = {
  UPCOMING: ["JUDGING", "CLOSED"],
  JUDGING: ["RESULTS_PUBLISHED", "CLOSED"],
  RESULTS_PUBLISHED: ["CLOSED"],
  CLOSED: [],
};

function toLocalInput(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatWhen(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function Modal({
  title,
  subtitle,
  onClose,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  actions?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close modal"
        className="fixed inset-0 bg-ink/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cycle-modal-title"
          className="pointer-events-auto flex max-h-[min(90vh,40rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[24px] border border-line bg-white shadow-xl"
        >
          <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 md:px-6">
            <div>
              {subtitle ? (
                <p className="text-[11px] font-bold uppercase tracking-wider text-mute">{subtitle}</p>
              ) : null}
              <h3
                id="cycle-modal-title"
                className="font-display text-xl tracking-tight text-ink md:text-2xl"
              >
                {title}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {actions}
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
          <div className="overflow-y-auto px-5 py-5 md:px-6 md:py-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

type JudgeOption = { id: string; name: string; email: string };
type PanelMode = "create" | "view" | "edit" | null;

export function AwardCyclesManager({
  initialCycles,
  judges,
}: {
  initialCycles: NestAwardCycle[];
  judges: JudgeOption[];
}) {
  const router = useRouter();
  const [cycles, setCycles] = useState(initialCycles);
  const [panel, setPanel] = useState<PanelMode>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const active = useMemo(
    () => cycles.find((c) => c.id === activeId) ?? null,
    [cycles, activeId],
  );

  const nextStatuses = active ? [active.status, ...STATUS_FLOW[active.status]] : [];

  async function openCycle(id: string, mode: "view" | "edit") {
    setPanel(mode);
    setActiveId(id);
    setDetailLoading(true);
    setModalMessage("");
    setMessage("");
    const res = await fetch(`/api/admin/cycles?id=${encodeURIComponent(id)}`);
    const data = await res.json();
    setDetailLoading(false);
    if (!res.ok) {
      setModalMessage(data.error || "Could not load cycle details.");
      return;
    }
    setCycles((prev) => prev.map((c) => (c.id === id ? data.cycle : c)));
  }

  function openCreate() {
    setPanel("create");
    setActiveId(null);
    setModalMessage("");
    setMessage("");
  }

  const closePanel = useCallback(() => {
    setPanel(null);
    setActiveId(null);
    setModalMessage("");
  }, []);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setModalMessage("");
    const form = new FormData(e.currentTarget);
    const endsAt = String(form.get("endsAt") || "").trim();
    const judgingEndsAt = String(form.get("judgingEndsAt") || "").trim();

    const res = await fetch("/api/admin/cycles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        year: Number(form.get("year")),
        startsAt: form.get("startsAt"),
        endsAt: endsAt || null,
        judgingEndsAt: judgingEndsAt || null,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setModalMessage(data.error || "Could not create award cycle.");
      return;
    }
    setCycles((prev) => [data.cycle, ...prev]);
    setActiveId(data.cycle.id);
    setPanel("view");
    setMessage("Award cycle created.");
    setModalMessage("");
    router.refresh();
  }

  async function onUpdate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!active) return;
    setLoading(true);
    setModalMessage("");
    const form = new FormData(e.currentTarget);
    const endsAt = String(form.get("endsAt") || "").trim();
    const judgingEndsAt = String(form.get("judgingEndsAt") || "").trim();

    const res = await fetch("/api/admin/cycles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: active.id,
        name: form.get("name"),
        year: Number(form.get("year")),
        startsAt: form.get("startsAt"),
        endsAt: endsAt || null,
        judgingEndsAt: judgingEndsAt || null,
        status: form.get("status"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setModalMessage(data.error || "Could not update award cycle.");
      return;
    }
    setCycles((prev) => prev.map((c) => (c.id === active.id ? data.cycle : c)));
    setPanel("view");
    setMessage("Award cycle updated.");
    setModalMessage("");
    router.refresh();
  }

  async function assignJudge(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!active) return;
    setLoading(true);
    setModalMessage("");
    const form = new FormData(e.currentTarget);
    const userId = String(form.get("userId") || "");
    const res = await fetch("/api/admin/cycles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "assign-judge", cycleId: active.id, userId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setModalMessage(data.error || "Could not assign judge.");
      return;
    }
    setCycles((prev) => prev.map((c) => (c.id === active.id ? data.cycle : c)));
    setModalMessage("Judge assigned.");
    e.currentTarget.reset();
    router.refresh();
  }

  async function removeJudge(userId: string) {
    if (!active) return;
    if (!confirm("Remove this judge from the cycle?")) return;
    setLoading(true);
    setModalMessage("");
    const res = await fetch(
      `/api/admin/cycles?cycleId=${encodeURIComponent(active.id)}&userId=${encodeURIComponent(userId)}`,
      { method: "DELETE" },
    );
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setModalMessage(data.error || "Could not remove judge.");
      return;
    }
    setCycles((prev) => prev.map((c) => (c.id === active.id ? data.cycle : c)));
    setModalMessage("Judge removed.");
    router.refresh();
  }

  const assignedIds = new Set((active?.judges || []).map((j) => j.userId));
  const assignableJudges = judges.filter((j) => !assignedIds.has(j.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl tracking-tight text-ink">All cycles</h2>
          <p className="mt-1 text-[14px] text-mute">
            View details, edit status and dates, or assign judges.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          Create award cycle
        </button>
      </div>

      {message ? <p className="text-sm text-ink">{message}</p> : null}

      <div className="overflow-x-auto rounded-[24px] border border-line bg-white">
        {cycles.length === 0 ? (
          <div className="p-6 text-sm text-mute">No award cycles yet. Create one to get started.</div>
        ) : (
          <table className="min-w-full text-left text-[13px]">
            <thead className="border-b border-line text-[11px] font-bold uppercase tracking-wider text-mute">
              <tr>
                <th className="px-4 py-3 md:px-6">Name</th>
                <th className="px-4 py-3 md:px-6">Year</th>
                <th className="px-4 py-3 md:px-6">Status</th>
                <th className="px-4 py-3 md:px-6">Judges</th>
                <th className="px-4 py-3 md:px-6">Scores</th>
                <th className="px-4 py-3 md:px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cycles.map((cycle) => (
                <tr key={cycle.id} className="border-b border-line/70 last:border-b-0">
                  <td className="px-4 py-3 font-semibold text-ink md:px-6">{cycle.name}</td>
                  <td className="px-4 py-3 tabular-nums text-mute md:px-6">{cycle.year}</td>
                  <td className="px-4 py-3 text-mute md:px-6">
                    {cycle.status.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-ink md:px-6">
                    {cycle.judgeCount ?? cycle.judges?.length ?? 0}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-ink md:px-6">
                    {cycle.scoreCount ?? 0}
                  </td>
                  <td className="px-4 py-3 md:px-6">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => openCycle(cycle.id, "view")}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => openCycle(cycle.id, "edit")}
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {panel === "create" ? (
        <Modal title="New award cycle" subtitle="Create" onClose={closePanel}>
          <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="label" htmlFor="name">
                Name
              </label>
              <input
                className="field"
                id="name"
                name="name"
                required
                placeholder="Graveyard Awards 2026"
              />
            </div>
            <div>
              <label className="label" htmlFor="year">
                Year
              </label>
              <input
                className="field"
                id="year"
                name="year"
                type="number"
                min={2000}
                max={2100}
                defaultValue={new Date().getFullYear()}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="startsAt">
                Starts at
              </label>
              <input className="field" id="startsAt" name="startsAt" type="datetime-local" required />
            </div>
            <div>
              <label className="label" htmlFor="endsAt">
                Ends at (optional)
              </label>
              <input className="field" id="endsAt" name="endsAt" type="datetime-local" />
            </div>
            <div>
              <label className="label" htmlFor="judgingEndsAt">
                Judging ends (optional)
              </label>
              <input
                className="field"
                id="judgingEndsAt"
                name="judgingEndsAt"
                type="datetime-local"
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Creating…" : "Create award cycle"}
              </button>
              {modalMessage ? <p className="text-sm text-ink">{modalMessage}</p> : null}
            </div>
          </form>
        </Modal>
      ) : null}

      {(panel === "view" || panel === "edit") && active ? (
        <Modal
          title={active.name}
          subtitle={panel === "view" ? "View cycle" : "Edit cycle"}
          onClose={closePanel}
          actions={
            panel === "view" ? (
              <button type="button" className="btn btn-primary" onClick={() => setPanel("edit")}>
                Edit
              </button>
            ) : (
              <button type="button" className="btn btn-ghost" onClick={() => setPanel("view")}>
                Back to view
              </button>
            )
          }
        >
          {detailLoading ? (
            <p className="text-sm text-mute">Loading…</p>
          ) : panel === "view" ? (
            <div className="space-y-6">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-mute">Year</dt>
                  <dd className="mt-1 font-semibold text-ink">{active.year}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-mute">
                    Status
                  </dt>
                  <dd className="mt-1 font-semibold text-ink">
                    {active.status.replace(/_/g, " ")}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-mute">
                    Starts at
                  </dt>
                  <dd className="mt-1 text-ink">{formatWhen(active.startsAt)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-mute">
                    Ends at
                  </dt>
                  <dd className="mt-1 text-ink">{formatWhen(active.endsAt)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-mute">
                    Judging ends
                  </dt>
                  <dd className="mt-1 text-ink">{formatWhen(active.judgingEndsAt)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-mute">
                    Scores
                  </dt>
                  <dd className="mt-1 font-semibold text-ink">{active.scoreCount ?? 0}</dd>
                </div>
              </dl>

              <div>
                <h4 className="text-[13px] font-bold uppercase tracking-wider text-mute">
                  Assigned judges
                </h4>
                <ul className="mt-3 space-y-2">
                  {(active.judges || []).length === 0 ? (
                    <li className="text-sm text-mute">No judges assigned yet.</li>
                  ) : (
                    (active.judges || []).map((judge) => (
                      <li
                        key={judge.userId}
                        className="rounded-xl border border-line bg-soft/50 px-3 py-2"
                      >
                        <p className="font-semibold text-ink">{judge.name}</p>
                        <p className="text-[12px] text-mute">{judge.email}</p>
                      </li>
                    ))
                  )}
                </ul>
              </div>
              {modalMessage ? <p className="text-sm text-ink">{modalMessage}</p> : null}
            </div>
          ) : (
            <div className="space-y-6">
              <form onSubmit={onUpdate} className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="label" htmlFor="edit-name">
                    Name
                  </label>
                  <input
                    className="field"
                    id="edit-name"
                    name="name"
                    required
                    defaultValue={active.name}
                    key={`${active.id}-name`}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="edit-year">
                    Year
                  </label>
                  <input
                    className="field"
                    id="edit-year"
                    name="year"
                    type="number"
                    min={2000}
                    max={2100}
                    required
                    defaultValue={active.year}
                    key={`${active.id}-year`}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="edit-status">
                    Status
                  </label>
                  <select
                    className="field"
                    id="edit-status"
                    name="status"
                    defaultValue={active.status}
                    key={`${active.id}-status`}
                  >
                    {nextStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="edit-startsAt">
                    Starts at
                  </label>
                  <input
                    className="field"
                    id="edit-startsAt"
                    name="startsAt"
                    type="datetime-local"
                    required
                    defaultValue={toLocalInput(active.startsAt)}
                    key={`${active.id}-starts`}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="edit-endsAt">
                    Ends at
                  </label>
                  <input
                    className="field"
                    id="edit-endsAt"
                    name="endsAt"
                    type="datetime-local"
                    defaultValue={toLocalInput(active.endsAt)}
                    key={`${active.id}-ends`}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label" htmlFor="edit-judgingEndsAt">
                    Judging ends
                  </label>
                  <input
                    className="field"
                    id="edit-judgingEndsAt"
                    name="judgingEndsAt"
                    type="datetime-local"
                    defaultValue={toLocalInput(active.judgingEndsAt)}
                    key={`${active.id}-judging`}
                  />
                </div>
                <div className="md:col-span-2">
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>

              <div>
                <h4 className="text-[13px] font-bold uppercase tracking-wider text-mute">
                  Assigned judges
                </h4>
                <ul className="mt-3 space-y-2">
                  {(active.judges || []).length === 0 ? (
                    <li className="text-sm text-mute">No judges assigned yet.</li>
                  ) : (
                    (active.judges || []).map((judge) => (
                      <li
                        key={judge.userId}
                        className="flex items-center justify-between gap-3 rounded-xl border border-line bg-soft/50 px-3 py-2"
                      >
                        <div>
                          <p className="font-semibold text-ink">{judge.name}</p>
                          <p className="text-[12px] text-mute">{judge.email}</p>
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline"
                          disabled={loading}
                          onClick={() => removeJudge(judge.userId)}
                        >
                          Remove
                        </button>
                      </li>
                    ))
                  )}
                </ul>

                <form onSubmit={assignJudge} className="mt-4 flex flex-wrap items-end gap-3">
                  <div className="min-w-[220px] flex-1">
                    <label className="label" htmlFor="userId">
                      Add judge
                    </label>
                    <select
                      className="field"
                      id="userId"
                      name="userId"
                      required
                      disabled={assignableJudges.length === 0}
                    >
                      <option value="">
                        {assignableJudges.length === 0
                          ? "No available judges"
                          : "Select judge"}
                      </option>
                      {assignableJudges.map((judge) => (
                        <option key={judge.id} value={judge.id}>
                          {judge.name} ({judge.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={loading || assignableJudges.length === 0}
                  >
                    Assign
                  </button>
                </form>
              </div>
              {modalMessage ? <p className="text-sm text-ink">{modalMessage}</p> : null}
            </div>
          )}
        </Modal>
      ) : null}
    </div>
  );
}
