import Link from "next/link";

export function HomeFilters({
  categories,
  category,
  statusFilter,
}: {
  categories: string[];
  category?: string;
  statusFilter?: string;
}) {
  const items: { href: string; label: string; active: boolean }[] = [
    { href: "/#work", label: "All", active: !category && !statusFilter },
    {
      href: "/?status=winner#work",
      label: "Winners",
      active: statusFilter === "winner" && !category,
    },
    {
      href: "/?status=shortlisted#work",
      label: "Shortlist",
      active: statusFilter === "shortlisted" && !category,
    },
    ...categories.map((cat) => ({
      href: `/?category=${encodeURIComponent(cat)}#work`,
      label: cat,
      active: category === cat,
    })),
  ];

  return (
    <div className="filters-sticky">
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {items.map((item) => (
          <Link
            key={item.href + item.label}
            href={item.href}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
              item.active ? "bg-ink text-white" : "bg-soft text-ink hover:bg-[#ebebeb]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
