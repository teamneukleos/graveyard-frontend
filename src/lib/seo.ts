import type { Metadata } from "next";
import { getAppUrl } from "@/lib/mail";

export const SITE_NAME = "Graveyard";
export const SITE_TAGLINE = "Where buried ideas get their due";
export const SITE_DESCRIPTION =
  "Digital awards for rejected, shelved, and never-produced creative work. Public votes and industry review for campaigns, film, motion, branding, and more. Awarded anytime.";

export function absoluteUrl(path = "/") {
  const base = getAppUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function absoluteUploadUrl(filenameOrUrl?: string | null) {
  if (!filenameOrUrl) return absoluteUrl("/brand/logo-on-dark.png");
  if (filenameOrUrl.startsWith("http://") || filenameOrUrl.startsWith("https://")) {
    return filenameOrUrl;
  }
  if (filenameOrUrl.startsWith("/")) return absoluteUrl(filenameOrUrl);
  return absoluteUrl(filenameOrUrl);
}

/** Clamp meta descriptions to a search-friendly length. */
export function metaDescription(text: string, max = 160) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

type BuildMetaInput = {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  type?: "website" | "article" | "profile";
  noIndex?: boolean;
  keywords?: string[];
};

/** Shared page metadata with Open Graph + Twitter. */
export function buildMetadata({
  title,
  description,
  path = "/",
  image,
  type = "website",
  noIndex = false,
  keywords,
}: BuildMetaInput): Metadata {
  const url = absoluteUrl(path);
  const ogImage = image
    ? image.startsWith("http")
      ? image
      : absoluteUrl(image)
    : absoluteUrl("/brand/logo-on-dark.png");

  const fullTitle = title.includes(SITE_NAME) ? title : title;

  return {
    title: fullTitle,
    description,
    keywords: keywords?.length ? keywords : undefined,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : { index: true, follow: true },
    openGraph: {
      type,
      url,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      locale: "en_GB",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    description: SITE_DESCRIPTION,
    logo: absoluteUrl("/brand/logo-on-dark.png"),
    sameAs: [],
    slogan: SITE_TAGLINE,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    description: SITE_DESCRIPTION,
    publisher: { "@type": "Organization", name: SITE_NAME },
    inLanguage: "en-GB",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function creativeWorkJsonLd(opts: {
  id: string;
  title: string;
  description: string;
  category: string;
  yearCreated: number;
  creatorName: string;
  image?: string | null;
  datePublished?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": absoluteUrl(`/showcase/${opts.id}`),
    name: opts.title,
    description: opts.description,
    genre: opts.category,
    dateCreated: String(opts.yearCreated),
    datePublished: opts.datePublished || undefined,
    url: absoluteUrl(`/showcase/${opts.id}`),
    image: absoluteUploadUrl(opts.image),
    creator: {
      "@type": "Person",
      name: opts.creatorName,
    },
    isAccessibleForFree: true,
  };
}

export function eventJsonLd(opts: {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  city: string;
  venue: string;
  format: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: opts.title,
    description: opts.description,
    startDate: opts.startsAt,
    eventAttendanceMode:
      opts.format === "online"
        ? "https://schema.org/OnlineEventAttendanceMode"
        : "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: opts.venue,
      address: {
        "@type": "PostalAddress",
        addressLocality: opts.city,
      },
    },
    organizer: {
      "@type": "Organization",
      name: SITE_NAME,
      url: absoluteUrl("/"),
    },
    url: absoluteUrl(`/events#${opts.id}`),
  };
}

export function itemListJsonLd(
  name: string,
  items: { name: string; path: string; position: number }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}

export function profileJsonLd(opts: {
  name: string;
  description?: string;
  path: string;
  image?: string | null;
  type?: "Person" | "Organization";
}) {
  return {
    "@context": "https://schema.org",
    "@type": opts.type || "Person",
    name: opts.name,
    description: opts.description || undefined,
    url: absoluteUrl(opts.path),
    image: opts.image ? absoluteUploadUrl(opts.image) : undefined,
  };
}
