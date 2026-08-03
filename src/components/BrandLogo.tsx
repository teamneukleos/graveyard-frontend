import Link from "next/link";

type BrandLogoProps = {
  href?: string | null;
  /** light = black wordmark + orange A (header / light UI); dark = orange-on-black (footer / night) */
  tone?: "light" | "dark";
  size?: "nav" | "md" | "lg" | "hero";
  className?: string;
  priority?: boolean;
};

const SRC = {
  light: "/brand/logo-on-light.png",
  dark: "/brand/logo-on-dark.png",
} as const;

const sizeClass: Record<NonNullable<BrandLogoProps["size"]>, string> = {
  nav: "h-10 w-auto md:h-12",
  md: "h-12 w-auto md:h-14",
  lg: "h-14 w-auto md:h-16",
  hero: "h-auto w-[min(96vw,80rem)] object-contain",
};

export function BrandLogo({
  href = "/",
  tone = "light",
  size = "nav",
  className = "",
  priority,
}: BrandLogoProps) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SRC[tone]}
      alt="Graveyard"
      className={`${sizeClass[size]} ${className}`}
      {...(priority ? { fetchPriority: "high" as const } : {})}
    />
  );

  if (!href) return img;

  return (
    <Link href={href} className="inline-flex shrink-0 items-center" aria-label="Graveyard home">
      {img}
    </Link>
  );
}
