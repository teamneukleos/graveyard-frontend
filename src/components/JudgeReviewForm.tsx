"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function JudgeReviewForm({
  submissionId,
  initial,
}: {
  submissionId: string;
  initial: { score: number; comment: string; shortlisted: boolean };
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionId,
        score: Number(form.get("score")),
        comment: form.get("comment"),
        shortlisted: form.get("shortlisted") === "on",
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Could not save review.");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="label" htmlFor="score">
          Score (0–10)
        </label>
        <input
          className="field"
          id="score"
          name="score"
          type="number"
          min={0}
          max={10}
          step={0.1}
          defaultValue={initial.score}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="comment">
          Comments
        </label>
        <textarea
          className="field min-h-28"
          id="comment"
          name="comment"
          defaultValue={initial.comment}
        />
      </div>
      <label className="flex items-center gap-3 text-sm text-bone">
        <input
          type="checkbox"
          name="shortlisted"
          defaultChecked={initial.shortlisted}
          className="size-4 accent-[var(--moss)]"
        />
        Shortlist as finalist
      </label>
      {error ? <p className="text-sm text-ember">{error}</p> : null}
      {saved ? <p className="text-sm text-moss">Review saved.</p> : null}
      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Saving…" : "Save review"}
      </button>
    </form>
  );
}
