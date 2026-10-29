import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import "./themes.css";
import "./modern-explorer.css";
import "./luxury-escape.css";
import "./brand-tokens.css";
import CurrencySync from "@/components/CurrencySync";
import PremiumCursor from "@/components/ui/PremiumCursor";
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
  const colors = site.themeColors || {};
  const brandStyle = colors.color1
    ? {
        "--brand-color-1": colors.color1,
        "--brand-color-2": colors.color2,
        "--brand-color-3": colors.color3,
        "--brand-color-4": colors.color4,
        "--brand-color-5": colors.color5,
        "--brand-on-1": colors.on1,
        "--brand-on-5": colors.on5,
      }
    : undefined;

  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`} style={brandStyle}>
      <body className="site-shell antialiased" data-b2c-theme={site.theme?.code || "CLASSIC_TRAVEL"}>
        <PremiumCursor />
        {site.theme?.preview ? (
          <p className="theme-preview-ribbon">Preview · {site.theme.label}</p>
        ) : null}
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
