"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { CategoryListItem } from "@/lib/categories";

export function CategoriesManager({
  initialCategories,
}: {
  initialCategories: CategoryListItem[];
}) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name") }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Could not create category.");
      return;
    }

    setCategories((prev) => [...prev, data.category]);
    e.currentTarget.reset();
    router.refresh();
  }

  async function patch(body: Record<string, unknown>) {
    setBusyId(String(body.id));
    setError("");
    const res = await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusyId(null);

    if (!res.ok) {
      setError(data.error || "Could not update category.");
      return;
    }

    if (Array.isArray(data.categories)) {
      setCategories(data.categories);
    } else if (data.category) {
      setCategories((prev) =>
        prev.map((c) => (c.id === data.category.id ? data.category : c)),
      );
    }
    router.refresh();
  }

  return (
    <div className="mt-10 grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={onCreate} className="space-y-4 border border-stone/70 bg-soil/60 p-6">
        <h2 className="font-display text-2xl text-bone">Add category</h2>
        <div>
          <label className="label" htmlFor="name">
            Name
          </label>
          <input className="field" id="name" name="name" required minLength={2} />
        </div>
        {error ? <p className="text-sm text-ember">{error}</p> : null}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create category"}
        </button>
      </form>

      <div>
        <h2 className="font-display text-2xl text-bone">Award categories</h2>
        <ul className="mt-4 space-y-3">
          {categories.map((category, index) => (
            <li
              key={category.id}
              className="flex flex-wrap items-center justify-between gap-3 border border-stone/60 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-bone">{category.name}</p>
                <p className="text-sm text-ash">
                  {category.active ? "Active" : "Inactive"} · {category.slug}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-ghost !px-3 !py-1.5 !text-xs"
                  disabled={busyId === category.id || index === 0}
                  onClick={() => void patch({ id: category.id, direction: "up" })}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="btn btn-ghost !px-3 !py-1.5 !text-xs"
                  disabled={busyId === category.id || index === categories.length - 1}
                  onClick={() => void patch({ id: category.id, direction: "down" })}
                >
                  Down
                </button>
                <button
                  type="button"
                  className="btn btn-ghost !px-3 !py-1.5 !text-xs"
                  disabled={busyId === category.id}
                  onClick={() =>
                    void patch({ id: category.id, active: !category.active })
                  }
                >
                  {category.active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </li>
          ))}
          {categories.length === 0 ? <li className="text-ash">No categories yet.</li> : null}
        </ul>
      </div>
    </div>
  );
}
