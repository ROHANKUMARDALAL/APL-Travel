import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import CurrencySync from "@/components/CurrencySync";
import { SiteProvider } from "@/components/site/SiteProvider";
import WebsiteStatus from "@/components/site/WebsiteStatus";
import { getPublicSiteConfig } from "@/lib/site/config";

export const dynamic = "force-dynamic";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-family",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body-family",
  display: "swap",
});

export async function generateMetadata() {
  const site = await getPublicSiteConfig();
  if (site.availability && site.availability !== "ready") {
    const title =
      site.availability === "unconfigured"
        ? "Website Not Configured"
        : "Website Temporarily Unavailable";
    return { title, description: title };
  }
  const title =
    site.seo?.defaultTitle ||
    `${site.branding.websiteName || "APL Travel"} | Flights, Hotels & Buses`;
  const description =
    site.seo?.defaultDescription ||
    site.branding.tagline ||
    "Global B2C travel platform to search flights, hotels, and buses.";
  return {
    title,
    description,
    icons: site.branding.faviconUrl
      ? { icon: site.branding.faviconUrl }
      : undefined,
  };
}

export default async function RootLayout({ children }) {
  const site = await getPublicSiteConfig();
  const blocked = site.availability && site.availability !== "ready";

  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="site-shell antialiased">
        {blocked ? (
          <WebsiteStatus availability={site.availability} />
        ) : (
          <SiteProvider initialConfig={site}>
            <CurrencySync>{children}</CurrencySync>
          </SiteProvider>
        )}
      </body>
    </html>
  );
}
