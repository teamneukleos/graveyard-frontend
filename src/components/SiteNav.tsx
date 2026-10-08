import { GraveyardLink } from "./GraveyardLink";
import type { SessionUser } from "@/lib/auth";
import { BrandLogo } from "./BrandLogo";
import { LogoutButton } from "./LogoutButton";

export function SiteNav({ user }: { user: SessionUser | null }) {
  const portalHref =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "judge"
        ? "/judge"
        : "/portal";

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] max-w-[1440px] items-center gap-5 px-4 md:h-20 md:px-6">
        <BrandLogo size="nav" tone="light" />

        <nav className="hidden items-center gap-5 text-[13px] font-semibold text-ink md:flex">
          <GraveyardLink href="/" className="hover:opacity-50">
            Explore
          </GraveyardLink>

          <GraveyardLink href="/showcase" className="hover:opacity-50">
            Showcase
          </GraveyardLink>

          <GraveyardLink href="/categories" className="hover:opacity-50">
            Categories
          </GraveyardLink>

          <GraveyardLink href="/leaderboards" className="hover:opacity-50">
            Leaderboards
          </GraveyardLink>

          <GraveyardLink href="/events" className="hover:opacity-50">
            Events
          </GraveyardLink>
        </nav>

        <form
          action="/"
          method="get"
          className="mx-auto hidden min-w-0 max-w-sm flex-1 lg:block"
        >
          <label className="relative block">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mute">
              <SearchIcon />
            </span>

            <input
              name="q"
              placeholder="Search the yard"
              className="w-full rounded-full border-0 bg-canvas py-2 pl-10 pr-4 text-[13px] text-ink outline-none placeholder:text-[#999] focus:ring-2 focus:ring-black/5"
            />
          </label>
        </form>

        <div className="ml-auto flex items-center gap-2 text-[13px] font-semibold">
          {user ? (
            <>
              <GraveyardLink
                href={portalHref}
                className="hidden rounded-full bg-canvas px-3 py-1.5 text-ink hover:bg-accent hover:text-white sm:inline"
              >
                {user.role === "admin"
                  ? "Admin"
                  : user.role === "judge"
                    ? "Judge"
                    : "Portal"}
              </GraveyardLink>

              <GraveyardLink
                href="/settings"
                className="hidden px-2 text-mute hover:text-ink sm:inline"
              >
                Settings
              </GraveyardLink>

              <LogoutButton />
            </>
          ) : (
            <>
              <GraveyardLink
                href="/login"
                className="hidden px-2 text-mute hover:text-ink sm:inline"
              >
                Log in
              </GraveyardLink>

              <GraveyardLink
                href="/register"
                className="rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-bold text-white hover:brightness-95"
              >
                Sign up
              </GraveyardLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M20 20l-3.5-3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}