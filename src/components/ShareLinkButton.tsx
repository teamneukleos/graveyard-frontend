"use client";

import { useState } from "react";

export function ShareLinkButton({
  path,
  label = "Copy link",
  className = "btn btn-outline",
}: {
  /** Absolute path on this site, e.g. `/creators/abc` or `/showcase/my-piece`. */
  path: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}${path.startsWith("/") ? path : `/${path}`}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement("input");
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <button type="button" className={className} onClick={copy}>
      {copied ? "Link copied" : label}
    </button>
  );
}
