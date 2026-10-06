"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import { useGraveyardLoading } from "./GraveyardLoadingProvider";

type GraveyardLinkProps = ComponentProps<typeof Link>;

export function GraveyardLink({
  onClick,
  ...props
}: GraveyardLinkProps) {
  const { showLoader } = useGraveyardLoading();
  const pathname = usePathname();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    // Don't show the loader for modified clicks
    // such as Ctrl/Cmd + click or middle-click.
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    if (typeof props.href !== "string") {
      return;
    }

    // Only handle internal navigation.
    if (!props.href.startsWith("/")) {
      return;
    }

    /*
     * Keep the query string and hash when comparing destinations.
     *
     * This is important for links like:
     * /?status=winner
     *
     * The pathname is still "/", but the query changes the page,
     * so the loader should appear.
     */
    const currentUrl = `${pathname}${window.location.search}${window.location.hash}`;

    if (props.href === currentUrl) {
      return;
    }

    showLoader();
  }

  return <Link {...props} onClick={handleClick} />;
}