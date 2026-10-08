"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import { SiteNav } from "@/components/SiteNav";

/** Auth screens — no site chrome. */
const AUTH_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

/** Dashboards with their own PortalNav — hide the public site nav/footer. */
const DASHBOARD_PATHS = ["/admin", "/judge", "/portal", "/onboarding"];

function matchesPath(pathname: string, paths: string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function AppChrome({
  user,
  children,
  footer,
}: {
  user: SessionUser | null;
  children: ReactNode;
  footer: ReactNode;
}) {
  const pathname = usePathname() || "/";
  const hideChrome =
    matchesPath(pathname, AUTH_PATHS) || matchesPath(pathname, DASHBOARD_PATHS);

  return (
    <>
      {hideChrome ? null : <SiteNav user={user} />}
      <div className="flex flex-1 flex-col">{children}</div>
      {hideChrome ? null : footer}
    </>
  );
}
