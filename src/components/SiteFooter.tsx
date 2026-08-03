import Link from "next/link";
import { BrandLogo } from "./BrandLogo";

const explore = [
  { href: "/", label: "Explore" },
  { href: "/showcase", label: "Showcase" },
  { href: "/?status=winner", label: "LIVE" },
  { href: "/events", label: "Events" },
  { href: "/leaderboards", label: "Leaderboards" },
];

const enter = [
  { href: "/register", label: "Submit work" },
  { href: "/login", label: "Log in" },
  { href: "/portal", label: "Creator portal" },
  { href: "/settings", label: "Settings" },
];

const legal = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/cookies", label: "Cookie Policy" },
];

const categories = ["Campaign", "Branding", "Digital", "Film", "Motion", "Copywriting"].map(
  (label) => ({
    href: `/?category=${encodeURIComponent(label)}`,
    label,
  }),
);

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-ink text-white">
      <div className="mx-auto max-w-[1440px] px-4 md:px-6">
        <div className="flex flex-col gap-8 border-b border-white/10 py-14 md:flex-row md:items-end md:justify-between md:py-16">
          <div className="max-w-xl">
            <BrandLogo href={null} size="lg" tone="dark" className="mb-1" />
            <h2 className="mt-4 font-display text-[32px] font-bold leading-[1.08] tracking-[-0.04em] md:text-[44px]">
              Where buried ideas
              <br />
              get their due.
            </h2>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-white/60">
              Awards for rejected, shelved, and never-produced work. Public vote. Industry review.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/register"
              className="rounded-full bg-accent px-5 py-2.5 text-[14px] font-bold text-white hover:brightness-95"
            >
              Submit work
            </Link>
            <Link
              href="/showcase"
              className="rounded-full bg-white px-5 py-2.5 text-[14px] font-bold text-ink hover:bg-white/90"
            >
              Browse the yard
            </Link>
          </div>
        </div>

        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <FooterColumn title="Explore" links={explore} />
          <FooterColumn title="Account" links={enter} />
          <FooterColumn title="Categories" links={categories} />
          <FooterColumn title="Legal" links={legal} />
        </div>

        <div className="flex flex-col gap-5 border-t border-white/10 py-6 text-[12px] text-white/40 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
            <p>© {year} Graveyard</p>
            <span className="hidden text-white/20 sm:inline" aria-hidden>
              ·
            </span>
            {legal.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white/45 transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/35">
              Created by
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brands/image-and-time.png"
              alt="Image & Time"
              className="h-[18px] w-auto opacity-85 transition hover:opacity-100"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brands/neukleos.png"
              alt="Neukleos"
              className="h-[22px] w-auto opacity-85 transition hover:opacity-100"
            />
          </div>
          <p className="font-semibold text-white/45">From the plots</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-[12px] font-bold text-white">{title}</p>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={`${title}-${link.label}`}>
            <Link href={link.href} className="text-[13px] text-white/55 hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
