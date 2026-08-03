import Link from "next/link";

type PaginationProps = {
  page: number;
  totalPages: number;
  basePath?: string;
  query?: Record<string, string | undefined>;
};

function hrefFor(
  page: number,
  basePath: string,
  query: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Pagination({
  page,
  totalPages,
  basePath = "/",
  query = {},
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <nav
      className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6"
      aria-label="Pagination"
    >
      <p className="text-[13px] text-mute">
        Page <span className="font-medium text-ink">{page}</span> of {totalPages}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        <PageLink
          href={hrefFor(page - 1, basePath, query)}
          disabled={page <= 1}
          label="Previous"
        />
        {start > 1 ? (
          <>
            <PageNumber href={hrefFor(1, basePath, query)} active={false}>
              1
            </PageNumber>
            {start > 2 ? <span className="px-1 text-mute">…</span> : null}
          </>
        ) : null}
        {pages.map((p) => (
          <PageNumber key={p} href={hrefFor(p, basePath, query)} active={p === page}>
            {p}
          </PageNumber>
        ))}
        {end < totalPages ? (
          <>
            {end < totalPages - 1 ? <span className="px-1 text-mute">…</span> : null}
            <PageNumber href={hrefFor(totalPages, basePath, query)} active={false}>
              {totalPages}
            </PageNumber>
          </>
        ) : null}
        <PageLink
          href={hrefFor(page + 1, basePath, query)}
          disabled={page >= totalPages}
          label="Next"
        />
      </div>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  label,
}: {
  href: string;
  disabled?: boolean;
  label: string;
}) {
  if (disabled) {
    return <span className="rounded-full px-3 py-1.5 text-[13px] text-[#c4c4c4]">{label}</span>;
  }
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-1.5 text-[13px] font-medium text-ink hover:bg-paper"
    >
      {label}
    </Link>
  );
}

function PageNumber({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`min-w-8 rounded-full px-3 py-1.5 text-center text-[13px] font-medium transition-colors ${
        active ? "bg-ink text-paper" : "text-ink hover:bg-paper"
      }`}
    >
      {children}
    </Link>
  );
}
