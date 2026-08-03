"use client";

import { useState } from "react";

export type GalleryAsset = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
};

export function ShowcaseGallery({
  assets,
  title,
}: {
  assets: GalleryAsset[];
  title: string;
}) {
  const images = assets.filter((a) => a.mimeType.startsWith("image/") || a.mimeType === "image/svg+xml");
  const other = assets.filter((a) => !images.includes(a));
  const [active, setActive] = useState(0);
  const current = images[active] || images[0];

  if (!assets.length) {
    return (
      <div className="card-media aspect-[16/10] rounded-[28px] bg-canvas">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/api/uploads/placeholder" alt="" className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div>
      <div className="card-media aspect-[16/10] overflow-hidden rounded-[28px] md:aspect-[2/1]">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={current.id}
            src={`/api/uploads/${current.filename}`}
            alt={`${title}, image ${active + 1}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-canvas text-mute">
            Preview unavailable
          </div>
        )}
      </div>

      {images.length > 1 ? (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {images.map((asset, i) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-2xl border-2 transition ${
                i === active ? "border-accent" : "border-transparent opacity-80 hover:opacity-100"
              }`}
              aria-label={`Show image ${i + 1}`}
              aria-pressed={i === active}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/uploads/${asset.filename}`}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}

      {other.length > 0 ? (
        <ul className="mt-6 space-y-2">
          {other.map((asset) => (
            <li key={asset.id}>
              <a
                href={`/api/uploads/${asset.filename}`}
                className="text-[14px] font-semibold text-ink underline underline-offset-4 hover:text-accent"
                target="_blank"
                rel="noreferrer"
              >
                {asset.originalName}
              </a>
              <span className="ml-2 text-[12px] text-mute">{asset.mimeType}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
