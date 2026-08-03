"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { SUBMITTER_TYPES } from "@/lib/constants";
import { uploadAssets } from "@/lib/uploads";

type Asset = { id: string; originalName: string; filename: string };

type Submission = {
  id: string;
  title: string;
  category: string;
  submitterType: string;
  teamMembers: string;
  yearCreated: number;
  concept: string;
  whyNeverLive: string;
  status: string;
  assets: Asset[];
};

export function SubmissionEditor({
  submission,
  categories,
  initialUploadError = "",
}: {
  submission: Submission;
  categories: string[];
  initialUploadError?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState(initialUploadError);
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState(submission.assets);

  async function save(status: "draft" | "submitted", e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);

    const res = await fetch(`/api/submissions/${submission.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        category: form.get("category"),
        submitterType: form.get("submitterType"),
        teamMembers: form.get("teamMembers"),
        yearCreated: Number(form.get("yearCreated")),
        concept: form.get("concept"),
        whyNeverLive: form.get("whyNeverLive"),
        status,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Could not save.");
      return;
    }

    router.refresh();
  }

  async function uploadFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setError("");
    const uploaded = await uploadAssets(submission.id, fileList);
    if (uploaded.succeeded.length) {
      setAssets((prev) => [
        ...prev,
        ...uploaded.succeeded.map((r) => r.asset!).filter(Boolean),
      ]);
    }
    if (uploaded.errorMessage) {
      setError(uploaded.errorMessage);
    }
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={(e) => save("submitted", e)}>
      <div>
        <label className="label" htmlFor="title">
          Project title
        </label>
        <input className="field" id="title" name="title" defaultValue={submission.title} required />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="label" htmlFor="category">
            Category
          </label>
          <select className="field" id="category" name="category" defaultValue={submission.category}>
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
          <select
            className="field"
            id="submitterType"
            name="submitterType"
            defaultValue={submission.submitterType}
          >
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
          <input
            className="field"
            id="teamMembers"
            name="teamMembers"
            defaultValue={submission.teamMembers}
          />
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
            defaultValue={submission.yearCreated}
            required
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="concept">
          Creative concept / story
        </label>
        <textarea
          className="field min-h-32"
          id="concept"
          name="concept"
          defaultValue={submission.concept}
        />
      </div>

      <div>
        <label className="label" htmlFor="whyNeverLive">
          Why the work never went live
        </label>
        <textarea
          className="field min-h-28"
          id="whyNeverLive"
          name="whyNeverLive"
          defaultValue={submission.whyNeverLive}
        />
      </div>

      <div>
        <label className="label" htmlFor="files">
          Add more project images
        </label>
        <input
          className="field"
          id="files"
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.ppt,.pptx,.zip"
          onChange={(e) => uploadFiles(e.target.files)}
        />
        <p className="mt-2 text-xs text-ash">Up to 12 files total per project.</p>
        <ul className="mt-3 space-y-1 text-sm text-ash">
          {assets.map((asset) => (
            <li key={asset.id}>
              <a className="text-moss hover:underline" href={`/api/uploads/${asset.filename}`}>
                {asset.originalName}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {error ? <p className="text-sm text-ember">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Saving…" : "Submit entry"}
        </button>
        <button
          className="btn btn-ghost"
          type="button"
          disabled={loading}
          onClick={(e) => {
            const form = e.currentTarget.form;
            if (!form) return;
            void save("draft", {
              preventDefault() {},
              currentTarget: form,
            } as FormEvent<HTMLFormElement>);
          }}
        >
          Save draft
        </button>
      </div>
    </form>
  );
}
