import { headers } from "next/headers";
import { FOOTER, SERVICES, TESTIMONIALS } from "@/data/static";

const REVALIDATE_SECONDS = 30;

function publicSiteOrigin() {
  return (
    process.env.PUBLIC_SITE_ORIGIN ||
    process.env.BACKEND_ORIGIN ||
    "https://apltravelbackend.onrender.com"
  ).replace(/\/$/, "");
}

export function absoluteMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${publicSiteOrigin()}${url}`;
  return url;
}

function mapServices(apiServices) {
  const known = new Map(SERVICES.map((s) => [s.id, s]));
  return (apiServices || [])
    .map((svc) => {
      const code = String(svc.code || "").toLowerCase();
      const base = known.get(code);
      if (!base) return null; // unknown/future services fail safely
      return {
        id: base.id,
        label: svc.name || base.label,
        icon: base.icon,
        code,
      };
    })
    .filter(Boolean);
}

function groupFooter(apiFooter) {
  const groups = {
    company: [],
    services: [],
    support: [],
    legal: [],
  };
  for (const link of apiFooter || []) {
    const group = String(link.group || "Company").toLowerCase();
    const item = { label: link.title, href: link.url };
    if (group.includes("legal")) groups.legal.push(item);
    else if (group.includes("support")) groups.support.push(item);
    else if (group.includes("service")) groups.services.push(item);
    else groups.company.push(item);
  }
  return groups;
}

function legacyConfig() {
  return {
    source: "legacy",
    tenant: { code: "", displayName: FOOTER.brand, companyName: FOOTER.brand },
    branding: {
      websiteName: FOOTER.brand,
      tagline: FOOTER.tagline,
      logoUrl: "",
      faviconUrl: "",
      primaryColor: "",
    },
    contact: { ...FOOTER.contact, alternatePhone: "" },
    social: {
      facebook: "",
      instagram: "",
      linkedin: "",
      twitter: "",
      youtube: "",
    },
    seo: {
      defaultTitle: "APL Travel | Flights, Hotels & Buses",
      defaultDescription: FOOTER.tagline,
      keywords: "",
    },
    services: SERVICES.map((s) => ({ ...s, code: s.id })),
    footerGroups: {
      company: FOOTER.company,
      services: FOOTER.services,
      support: FOOTER.support,
      legal: FOOTER.legal,
    },
    testimonials: TESTIMONIALS.map((t) => ({
      customerName: t.name,
      designation: t.role,
      company: "",
      message: t.quote,
      rating: t.rating,
      imageUrl: "",
      displayOrder: 0,
    })),
    pages: [],
    banners: [],
    blogs: [],
  };
}

function fromApi(data) {
  const footerGroups = groupFooter(data.footer);
  // If CMS footer empty, keep static link groups for continuity.
  const hasFooter = Object.values(footerGroups).some((g) => g.length > 0);
  return {
    source: "api",
    tenant: data.tenant || { code: "", displayName: "", companyName: "" },
    branding: {
      websiteName: data.branding?.websiteName || FOOTER.brand,
      tagline: data.branding?.tagline || FOOTER.tagline,
      logoUrl: absoluteMediaUrl(data.branding?.logoUrl || ""),
      faviconUrl: absoluteMediaUrl(data.branding?.faviconUrl || ""),
      primaryColor: data.branding?.primaryColor || "",
    },
    contact: {
      email: data.contact?.email || FOOTER.contact.email,
      phone: data.contact?.phone || FOOTER.contact.phone,
      alternatePhone: data.contact?.alternatePhone || "",
      address: data.contact?.address || FOOTER.contact.address,
    },
    social: data.social || {},
    seo: data.seo || {},
    // Tenant mode: services from offer rule only (never static fail-open).
    services: mapServices(data.services),
    footerGroups: hasFooter
      ? footerGroups
      : {
          company: FOOTER.company,
          services: FOOTER.services,
          support: FOOTER.support,
          legal: FOOTER.legal,
        },
    testimonials:
      Array.isArray(data.testimonials) && data.testimonials.length
        ? data.testimonials.map((t) => ({
            ...t,
            imageUrl: absoluteMediaUrl(t.imageUrl || ""),
          }))
        : legacyConfig().testimonials,
    pages: data.pages || [],
    banners: (data.banners || []).map((b) => ({
      ...b,
      imageUrl: absoluteMediaUrl(b.imageUrl || ""),
    })),
    blogs: (data.blogs || []).map((b) => ({
      ...b,
      featuredImageUrl: absoluteMediaUrl(b.featuredImageUrl || ""),
    })),
  };
}

/**
 * Server-side public site config.
 * Revalidates every 30s so APL/DSA changes appear quickly.
 */
export async function getPublicSiteConfig() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3001";
  const origin = publicSiteOrigin();

  try {
    const res = await fetch(`${origin}/api/v1/public/site/config`, {
      headers: {
        "X-APL-Public-Host": host,
        "X-Forwarded-Host": host,
      },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      // Unknown tenant / unavailable → legacy single-brand site (content defaults).
      return legacyConfig();
    }
    const json = await res.json();
    if (!json?.success || !json?.data?.tenant?.code) {
      return legacyConfig();
    }
    return fromApi(json.data);
  } catch {
    return legacyConfig();
  }
}

export async function getPublicPage(slug) {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3001";
  const origin = publicSiteOrigin();
  try {
    const res = await fetch(
      `${origin}/api/v1/public/pages/${encodeURIComponent(slug)}`,
      {
        headers: {
          "X-APL-Public-Host": host,
          "X-Forwarded-Host": host,
        },
        next: { revalidate: REVALIDATE_SECONDS },
      },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.success ? json.data?.page || null : null;
  } catch {
    return null;
  }
}

export async function getPublicBlogs() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3001";
  const origin = publicSiteOrigin();
  try {
    const res = await fetch(`${origin}/api/v1/public/blogs`, {
      headers: {
        "X-APL-Public-Host": host,
        "X-Forwarded-Host": host,
      },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return { items: [] };
    const json = await res.json();
    return json?.success ? json.data : { items: [] };
  } catch {
    return { items: [] };
  }
}

export async function getPublicBlog(slug) {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3001";
  const origin = publicSiteOrigin();
  try {
    const res = await fetch(
      `${origin}/api/v1/public/blogs/${encodeURIComponent(slug)}`,
      {
        headers: {
          "X-APL-Public-Host": host,
          "X-Forwarded-Host": host,
        },
        next: { revalidate: REVALIDATE_SECONDS },
      },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.success ? json.data?.blog || null : null;
  } catch {
    return null;
  }
}

export { REVALIDATE_SECONDS, legacyConfig };
