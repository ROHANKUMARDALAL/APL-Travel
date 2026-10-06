"use client";

import { createContext, useContext, useMemo } from "react";
import { FOOTER, SERVICES } from "@/data/static";

const SiteContext = createContext(null);

export function SiteProvider({ initialConfig, children }) {
  const value = useMemo(() => {
    const cfg = initialConfig || {};
    return {
      source: cfg.source || "legacy",
      tenant: cfg.tenant || { code: "", displayName: FOOTER.brand },
      branding: cfg.branding || {
        websiteName: FOOTER.brand,
        tagline: FOOTER.tagline,
        logoUrl: "",
        faviconUrl: "",
      },
      contact: cfg.contact || FOOTER.contact,
      social: cfg.social || {},
      seo: cfg.seo || {},
      services: Array.isArray(cfg.services) ? cfg.services : SERVICES,
      footerGroups: cfg.footerGroups || {
        company: FOOTER.company,
        services: FOOTER.services,
        support: FOOTER.support,
        legal: FOOTER.legal,
      },
      testimonials: cfg.testimonials || [],
      pages: cfg.pages || [],
      banners: cfg.banners || [],
      blogs: cfg.blogs || [],
    };
  }, [initialConfig]);

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) {
    return {
      source: "legacy",
      tenant: { code: "", displayName: FOOTER.brand },
      branding: {
        websiteName: FOOTER.brand,
        tagline: FOOTER.tagline,
        logoUrl: "",
        faviconUrl: "",
      },
      contact: FOOTER.contact,
      social: {},
      seo: {},
      services: SERVICES,
      footerGroups: {
        company: FOOTER.company,
        services: FOOTER.services,
        support: FOOTER.support,
        legal: FOOTER.legal,
      },
      testimonials: [],
      pages: [],
      banners: [],
      blogs: [],
    };
  }
  return ctx;
}
