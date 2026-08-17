"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  email: string;
  name: string;
  role: string;
  agencyName: string | null;
  bio: string;
  avatarUrl: string | null;
};

export function SettingsForm({ initial }: { initial: Profile }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);

  async function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        agencyName: form.get("agencyName") || null,
        bio: form.get("bio"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error || "Could not save.");
      return;
    }
    setMessage("Saved.");
    router.refresh();
  }

  async function onAvatar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/profile/avatar", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Avatar upload failed.");
      return;
    }
    setAvatarUrl(data.avatarUrl ?? null);
    setMessage("Avatar updated.");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onAvatar} className="flex flex-wrap items-center gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-full bg-ink">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xl font-bold text-white">
              {initial.name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <input className="field" type="file" name="file" accept="image/*" required />
          <button className="btn btn-ghost mt-2" type="submit">
            Upload avatar
          </button>
        </div>
      </form>

      <form onSubmit={onSave} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input className="field" id="email" value={initial.email} disabled />
        </div>
        <div>
          <label className="label" htmlFor="name">
            Name
          </label>
          <input className="field" id="name" name="name" defaultValue={initial.name} required />
        </div>
        <div>
          <label className="label" htmlFor="agencyName">
            Agency
          </label>
          <input
            className="field"
            id="agencyName"
            name="agencyName"
            defaultValue={initial.agencyName || ""}
          />
        </div>
        <div>
          <label className="label" htmlFor="bio">
            Bio
          </label>
          <textarea className="field min-h-28" id="bio" name="bio" defaultValue={initial.bio} />
        </div>
        {message ? <p className="text-sm text-mute">{message}</p> : null}
        <button className="btn btn-primary" disabled={loading} type="submit">
          {loading ? "Saving…" : "Save settings"}
        </button>
      </form>
    </div>
  );
}
