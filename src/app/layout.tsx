import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { GraveyardAtmosphere } from "@/components/GraveyardAtmosphere";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { getSession } from "@/lib/auth";
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
  title: "Graveyard — Should have gone LIVE",
  description:
    "Digital award for rejected, shelved, and never-produced creative work. Public voting and industry review — awarded anytime.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSession();

  return (
    <html lang="en" className={`h-full ${body.variable} ${display.variable}`}>
      <body className="relative flex min-h-full flex-col antialiased">
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
