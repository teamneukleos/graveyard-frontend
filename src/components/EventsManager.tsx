"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { CreatorEvent } from "@/lib/events";

const TYPES = ["meetup", "salon", "screening", "workshop"] as const;
const FORMATS = ["in-person", "online", "hybrid"] as const;

export function EventsManager({ initialEvents }: { initialEvents: CreatorEvent[] }) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        type: form.get("type"),
        city: form.get("city"),
        venue: form.get("venue"),
        startsAt: form.get("startsAt"),
        format: form.get("format"),
        capacity: Number(form.get("capacity")),
        blurb: form.get("blurb"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error || "Could not create event.");
      return;
    }
    setEvents((prev) => [...prev, data.event].sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
    e.currentTarget.reset();
    setMessage("Event created.");
    router.refresh();
  }

  async function patch(id: string, patch: Record<string, unknown>) {
    const res = await fetch("/api/admin/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Update failed.");
      return;
    }
    setEvents((prev) => prev.map((ev) => (ev.id === id ? data.event : ev)));
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this event?")) return;
    const res = await fetch(`/api/admin/events?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error || "Delete failed.");
      return;
    }
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
    setMessage("Event deleted.");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="label" htmlFor="title">
            Title
          </label>
          <input className="field" id="title" name="title" required />
        </div>
        <div>
          <label className="label" htmlFor="type">
            Type
          </label>
          <select className="field" id="type" name="type" defaultValue="meetup">
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="format">
            Format
          </label>
          <select className="field" id="format" name="format" defaultValue="in-person">
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="city">
            City
          </label>
          <input className="field" id="city" name="city" required />
        </div>
        <div>
          <label className="label" htmlFor="venue">
            Venue
          </label>
          <input className="field" id="venue" name="venue" required />
        </div>
        <div>
          <label className="label" htmlFor="startsAt">
            Starts at (ISO)
          </label>
          <input
            className="field"
            id="startsAt"
            name="startsAt"
            placeholder="2026-09-01T18:00:00+01:00"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="capacity">
            Capacity
          </label>
          <input className="field" id="capacity" name="capacity" type="number" min={1} defaultValue={40} required />
        </div>
        <div className="md:col-span-2">
          <label className="label" htmlFor="blurb">
            Blurb
          </label>
          <textarea className="field min-h-24" id="blurb" name="blurb" required />
        </div>
        <div className="md:col-span-2">
          <button className="btn btn-primary" disabled={loading} type="submit">
            {loading ? "Creating…" : "Create event"}
          </button>
        </div>
      </form>

      {message ? <p className="text-sm text-mute">{message}</p> : null}

      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-line bg-soft/60 p-4"
          >
            <div className="min-w-0">
              <p className="font-display text-xl text-ink">{event.title}</p>
              <p className="mt-1 text-sm text-mute">
                {event.type} · {event.format} · {event.city} · {event.startsAt}
              </p>
              <p className="mt-2 text-sm text-ink/80">{event.blurb}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-ghost text-[12px]"
                onClick={() => patch(event.id, { active: !(event.active ?? true) })}
              >
                {(event.active ?? true) ? "Deactivate" : "Activate"}
              </button>
              <button type="button" className="btn btn-ink text-[12px]" onClick={() => remove(event.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
