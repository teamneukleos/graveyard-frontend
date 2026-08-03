import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { GraveyardAtmosphere } from "@/components/GraveyardAtmosphere";
import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { ensureDbReady } from "@/db";
import { getSession } from "@/lib/auth";
import {
  absoluteUrl,
  organizationJsonLd,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  websiteJsonLd,
} from "@/lib/seo";
import "./globals.css";

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl("/")),
  title: {
    default: `${SITE_NAME} | ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Graveyard awards",
    "rejected creative work",
    "shelved campaigns",
    "unpublished advertising",
    "creative awards Africa",
    "Nigeria creative awards",
    "should have gone live",
    "public voting creative",
    "industry review awards",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "arts",
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: absoluteUrl("/"),
    siteName: SITE_NAME,
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: absoluteUrl("/brand/logo-on-dark.png"),
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [absoluteUrl("/brand/logo-on-dark.png")],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png" }],
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await ensureDbReady();
  const user = await getSession();

  return (
    <html lang="en" className={`h-full ${body.variable} ${display.variable}`}>
      <body className="relative flex min-h-full flex-col antialiased">
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <GraveyardAtmosphere />
        <div className="relative z-10 flex min-h-full flex-1 flex-col">
          <SiteNav user={user} />
          <div className="flex flex-1 flex-col">{children}</div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
