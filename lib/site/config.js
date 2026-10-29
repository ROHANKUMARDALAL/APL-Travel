import { headers } from "next/headers";
import { FOOTER, SERVICE_ALIASES, SERVICE_CATALOGUE, SERVICES, TESTIMONIALS } from "@/data/static";

const REVALIDATE_SECONDS = 5;

const THEME_CATALOG = {
  MODERN_EXPLORER: { number: 1, name: "Modern Explorer" },
  LUXURY_ESCAPE: { number: 2, name: "Luxury Escape" },
  CLASSIC_TRAVEL: { number: 3, name: "Classic Travel" },
};

const COLOR_KEYS = ["color1", "color2", "color3", "color4", "color5"];

function normalizeHex(value) {
  const raw = String(value || "").trim().toUpperCase();
  const hex = raw.startsWith("#") ? raw : raw ? `#${raw}` : "";
  return /^#[0-9A-F]{6}$/.test(hex) ? hex : "";
}

function onColor(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  const channel = (part) => {
    const scaled = part / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel((value >> 16) & 255) + 0.7152 * channel((value >> 8) & 255) + 0.0722 * channel(value & 255);
  return luminance > 0.45 ? "#0C1B24" : "#FFFFFF";
}

function themeColorsValue(data) {
  const source = data?.themeColors || {};
  const colors = {};
  for (const key of COLOR_KEYS) {
    colors[key] = normalizeHex(source[key]) || "";
  }
  if (COLOR_KEYS.some((key) => !colors[key])) return null;
  return { ...colors, on1: onColor(colors.color1), on5: onColor(colors.color5), preview: Boolean(source.preview) };
}

function applyPreviewColors(config, headerStore) {
  const raw = String(headerStore?.get?.("x-apl-preview-colors") || "");
  if (!raw) return config;
  const parts = raw.split(",").map(normalizeHex);
  if (parts.length !== 5 || parts.some((part) => !part)) return config;
  const colors = {
    color1: parts[0],
    color2: parts[1],
    color3: parts[2],
    color4: parts[3],
    color5: parts[4],
    preview: true,
  };
  return { ...config, themeColors: themeColorsValue({ themeColors: colors }) };
}

function themeValue(data) {
  const code = String(data?.theme?.code || "CLASSIC_TRAVEL").toUpperCase();
  const safe = THEME_CATALOG[code] ? code : "CLASSIC_TRAVEL";
  const meta = THEME_CATALOG[safe];
  return {
    code: safe,
    name: meta.name,
    number: meta.number,
    label: `Theme ${meta.number} — ${meta.name}`,
    preview: false,
  };
}

function withPreview(config, headerStore) {
  const preview = String(headerStore?.get?.("x-apl-preview-theme") || "").toUpperCase();
  if (!THEME_CATALOG[preview]) return { ...config, theme: config.theme || themeValue(null) };
  const meta = THEME_CATALOG[preview];
  return {
    ...config,
    theme: {
      code: preview,
      name: meta.name,
      number: meta.number,
      label: `Theme ${meta.number} — ${meta.name}`,
      preview: true,
    },
  };
}

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
    theme: themeValue(null),
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
    theme: themeValue(data),
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
    themeColors: themeColorsValue(data),
    availability: "ready",
  };
}

function blockedConfig(availability) {
  return {
    source: "blocked",
    theme: themeValue(null),
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
  if (!host) return withPreview(blockedConfig("unconfigured"), h);

  try {
    const res = await fetch(cachedSiteUrl("/api/v1/public/site/config", host), {
      headers: {
        "X-APL-Public-Host": host,
        "X-Forwarded-Host": host,
      },
      cache: "no-store",
    });
    if (res.status === 404) return withPreview(blockedConfig("unconfigured"), h);
    if (res.status === 403) return withPreview(blockedConfig("suspended"), h);
    if (!res.ok) return withPreview(blockedConfig("unreachable"), h);
    const json = await res.json();
    if (!json?.success || !json?.data?.tenant?.code) {
      return withPreview(blockedConfig("unconfigured"), h);
    }
    return applyPreviewColors(withPreview(fromApi(json.data), h), h);
  } catch {
    return withPreview(blockedConfig("unreachable"), h);
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
