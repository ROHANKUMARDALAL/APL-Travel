import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import CurrencySync from "@/components/CurrencySync";
import { SiteProvider } from "@/components/site/SiteProvider";
import { getPublicSiteConfig } from "@/lib/site/config";

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

  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="site-shell antialiased">
        <SiteProvider initialConfig={site}>
          <CurrencySync>{children}</CurrencySync>
        </SiteProvider>
      </body>
    </html>
  );
}
