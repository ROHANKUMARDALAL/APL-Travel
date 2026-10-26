import { headers } from "next/headers";
import { FOOTER, SERVICE_ALIASES, SERVICE_CATALOGUE, SERVICES, TESTIMONIALS } from "@/data/static";

const REVALIDATE_SECONDS = 5;

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
  const known = new Map(SERVICE_CATALOGUE.map((service) => [service.id, service]));
  const seen = new Set();
  const rows = [];
  for (const svc of apiServices || []) {
    const raw = String(svc.code || "").toLowerCase();
    const code = SERVICE_ALIASES[raw] || raw;
    const base = known.get(code);
    if (!base || seen.has(code)) continue;
    seen.add(code);
    rows.push({
      id: base.id,
      label: base.id === "transfer" || base.id === "holiday" ? base.label : svc.name || base.label,
      icon: base.icon,
      code,
      kind: base.kind,
      href: base.href,
      serviceMode: svc.serviceMode || (base.kind === "page" ? "ENQUIRY" : "API_BOOKING"),
    });
  }
  return rows;
}

function emptyFooterGroups() {
  return { company: [], services: [], support: [], legal: [], columns: [] };
}

function groupFooter(apiFooter) {
  const groups = emptyFooterGroups();
  const byKey = new Map();
  for (const link of apiFooter || []) {
    const raw = String(link.group || "Company").trim() || "Company";
    const label = String(link.title || "").trim();
    if (!label) continue;
    const item = { label, href: link.url || "/" };
    const key = raw.toLowerCase();
    if (key.includes("legal")) {
      groups.legal.push(item);
      continue;
    }
    if (!byKey.has(key)) {
      const column = { title: raw, links: [] };
      byKey.set(key, column);
      groups.columns.push(column);
    }
    byKey.get(key).links.push(item);
    if (key.includes("support")) groups.support.push(item);
    else if (key.includes("service")) groups.services.push(item);
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
      columns: [
        { title: "Company", links: FOOTER.company },
        { title: "Services", links: FOOTER.services },
        { title: "Support", links: FOOTER.support },
      ],
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
  const tenant = data.tenant || { code: "", displayName: "", companyName: "" };
  return {
    source: "api",
    tenant,
    branding: {
      websiteName:
        data.branding?.websiteName ||
        tenant.displayName ||
        tenant.companyName ||
        "",
      tagline: data.branding?.tagline || "",
      logoUrl: absoluteMediaUrl(data.branding?.logoUrl || ""),
      faviconUrl: absoluteMediaUrl(data.branding?.faviconUrl || ""),
      primaryColor: data.branding?.primaryColor || "",
    },
    contact: {
      email: data.contact?.email || "",
      phone: data.contact?.phone || "",
      alternatePhone: data.contact?.alternatePhone || "",
      address: data.contact?.address || "",
    },
    social: data.social || {},
    seo: data.seo || {},
    // Tenant mode: services from offer rule only (never static fail-open).
    services: mapServices(data.services),
    footerGroups,
    testimonials: Array.isArray(data.testimonials)
      ? data.testimonials.map((t) => ({
          ...t,
          imageUrl: absoluteMediaUrl(t.imageUrl || ""),
        }))
      : [],
    pages: data.pages || [],
    banners: (data.banners || []).map((b) => ({
      ...b,
      imageUrl: absoluteMediaUrl(b.imageUrl || ""),
    })),
    blogs: (data.blogs || []).map((b) => withBlogMedia(b)),
    availability: "ready",
  };
}

function blockedConfig(availability) {
  return {
    source: "blocked",
    availability,
    tenant: { code: "", displayName: "", companyName: "" },
    branding: {
      websiteName: "",
      tagline: "",
      logoUrl: "",
      faviconUrl: "",
      primaryColor: "",
    },
    contact: { email: "", phone: "", alternatePhone: "", address: "" },
    social: {},
    seo: { defaultTitle: "", defaultDescription: "", keywords: "" },
    services: [],
    footerGroups: emptyFooterGroups(),
    testimonials: [],
    pages: [],
    banners: [],
    blogs: [],
  };
}

function requestHost(headerStore) {
  return headerStore.get("x-forwarded-host") || headerStore.get("host") || "";
}

function cachedSiteUrl(path, host) {
  const joiner = path.includes("?") ? "&" : "?";
  return `${publicSiteOrigin()}${path}${joiner}siteHost=${encodeURIComponent(host)}`;
}

/**
 * Server-side public site config for the request host.
 * Not stored in the Next data cache, so a DSAAdmin save is visible on the next load.
 * The request URL still includes the host so tenants never share a response.
 */
export async function getPublicSiteConfig() {
  const h = await headers();
  const host = requestHost(h);
  if (!host) return blockedConfig("unconfigured");

  try {
    const res = await fetch(cachedSiteUrl("/api/v1/public/site/config", host), {
      headers: {
        "X-APL-Public-Host": host,
        "X-Forwarded-Host": host,
      },
      cache: "no-store",
    });
    if (res.status === 404) return blockedConfig("unconfigured");
    if (res.status === 403) return blockedConfig("suspended");
    if (!res.ok) return blockedConfig("unreachable");
    const json = await res.json();
    if (!json?.success || !json?.data?.tenant?.code) {
      return blockedConfig("unconfigured");
    }
    return fromApi(json.data);
  } catch {
    return blockedConfig("unreachable");
  }
}

export async function getPublicPage(slug) {
  const h = await headers();
  const host = requestHost(h);
  if (!host) return null;
  try {
    const res = await fetch(
      cachedSiteUrl(`/api/v1/public/pages/${encodeURIComponent(slug)}`, host),
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

function withBlogMedia(blog) {
  const source = Array.isArray(blog?.images) && blog.images.length
    ? blog.images
    : blog?.featuredImageUrl
      ? [{ url: blog.featuredImageUrl, alt: blog.title || "", caption: "", cover: true }]
      : [];
  const images = source
    .map((image) => ({
      url: absoluteMediaUrl(image?.url || ""),
      alt: image?.alt || blog?.title || "",
      caption: image?.caption || "",
      cover: Boolean(image?.cover),
    }))
    .filter((image) => image.url);
  const cover = images.find((image) => image.cover) || images[0] || null;
  return {
    ...blog,
    featuredImageUrl: cover?.url || "",
    images,
  };
}

export async function getPublicBlogs() {
  const h = await headers();
  const host = requestHost(h);
  if (!host) return { items: [] };
  try {
    const res = await fetch(cachedSiteUrl("/api/v1/public/blogs", host), {
      headers: {
        "X-APL-Public-Host": host,
        "X-Forwarded-Host": host,
      },
      cache: "no-store",
    });
    if (!res.ok) return { items: [] };
    const json = await res.json();
    const data = json?.success ? json.data : { items: [] };
    return { ...data, items: (data.items || []).map(withBlogMedia) };
  } catch {
    return { items: [] };
  }
}

export async function getPublicBlog(slug) {
  const h = await headers();
  const host = requestHost(h);
  if (!host) return null;
  try {
    const res = await fetch(
      cachedSiteUrl(`/api/v1/public/blogs/${encodeURIComponent(slug)}`, host),
      {
        headers: {
          "X-APL-Public-Host": host,
          "X-Forwarded-Host": host,
        },
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.success && json.data?.blog ? withBlogMedia(json.data.blog) : null;
  } catch {
    return null;
  }
}

export { REVALIDATE_SECONDS, legacyConfig };
