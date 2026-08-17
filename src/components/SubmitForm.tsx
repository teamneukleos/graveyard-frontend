"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CURRENT_YEAR, SUBMITTER_TYPES } from "@/lib/constants";
import { uploadAssets } from "@/lib/uploads";

export function SubmitForm({ categories }: { categories: string[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);

  async function save(status: "draft" | "submitted") {
    const form = formRef.current;
    if (!form) return;

    setLoading(true);
    setError("");
    const data = new FormData(form);

    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.get("title"),
        category: data.get("category"),
        submitterType: data.get("submitterType"),
        teamMembers: data.get("teamMembers"),
        yearCreated: Number(data.get("yearCreated")),
        concept: data.get("concept"),
        whyNeverLived: data.get("whyNeverLived"),
        status,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setLoading(false);
      setError(json.error || "Could not save submission.");
      return;
    }

    let uploadError = "";
    if (files?.length) {
      const uploaded = await uploadAssets(json.submission.id, files);
      uploadError = uploaded.errorMessage;
    }

    const destination = `/portal/submissions/${json.submission.id}`;
    if (uploadError) {
      router.push(`${destination}?uploadError=${encodeURIComponent(uploadError)}`);
    } else {
      router.push(destination);
    }
    router.refresh();
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void save("submitted");
  }

  return (
    <form ref={formRef} className="mt-10 space-y-5" onSubmit={onSubmit}>
      <div>
        <label className="label" htmlFor="title">
          Project title
        </label>
        <input className="field" id="title" name="title" required />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="label" htmlFor="category">
            Category
          </label>
          <select className="field" id="category" name="category" required defaultValue="">
            <option value="" disabled>
              Select category
            </option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="submitterType">
            Individual or agency
          </label>
          <select className="field" id="submitterType" name="submitterType" defaultValue="individual">
            {SUBMITTER_TYPES.map((type) => (
              <option key={type} value={type}>
                {type === "individual" ? "Individual" : "Agency"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="label" htmlFor="teamMembers">
            Team members
          </label>
          <input className="field" id="teamMembers" name="teamMembers" placeholder="Comma-separated" />
        </div>
        <div>
          <label className="label" htmlFor="yearCreated">
            Year created
          </label>
          <input
            className="field"
            id="yearCreated"
            name="yearCreated"
            type="number"
            defaultValue={CURRENT_YEAR}
            required
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="concept">
          Creative concept / story
        </label>
        <textarea className="field min-h-32" id="concept" name="concept" />
      </div>

      <div>
        <label className="label" htmlFor="whyNeverLived">
          Why the work never went live
        </label>
        <textarea className="field min-h-28" id="whyNeverLived" name="whyNeverLived" />
      </div>

      <div>
        <label className="label" htmlFor="files">
          Project images & assets
        </label>
        <input
          className="field"
          id="files"
          name="files"
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.ppt,.pptx,.zip"
          onChange={(e) => setFiles(e.target.files)}
        />
        <p className="mt-2 text-xs text-ash">
          Add multiple images for one project (up to 12). Also accepts video, PDF, decks, and zip.
        </p>
      </div>

      {error ? <p className="text-sm text-ember">{error}</p> : null}

      <div className="flex flex-wrap gap-3 pt-2">
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Saving…" : "Submit entry"}
        </button>
        <button
          className="btn btn-ghost"
          type="button"
          disabled={loading}
          onClick={() => void save("draft")}
        >
          Save draft
        </button>
      </div>
    </form>
  );
}
