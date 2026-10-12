"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSite } from "@/components/site/SiteProvider";
import { getMarket } from "@/data/markets";
import { buildPopularFlightSearch } from "@/lib/searchQuery";

function FooterAnchor({ href, children }) {
  const target = href || "/";
  const external = /^https?:\/\//i.test(target);
  if (external) {
    return (
      <a className="site-footer-link" href={target} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link className="site-footer-link" href={target}>
      {children}
    </Link>
  );
}

function FooterColumn({ title, links }) {
  const [open, setOpen] = useState(false);
  if (!links?.length) return null;
  return (
    <section className="site-footer-col">
      <button type="button" className="site-footer-toggle" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {title}
      </button>
      <h2 className="site-footer-heading">{title}</h2>
      <ul className={open ? "site-footer-links is-open" : "site-footer-links"}>
        {links.map((link) => (
          <li key={`${title}-${link.label}-${link.href}`}>
            <FooterAnchor href={link.href}>{link.label}</FooterAnchor>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  const router = useRouter();
  const { branding, footerGroups, social, tenant, services } = useSite();
  const brandName = branding.websiteName || tenant?.displayName || tenant?.companyName || "";
  const columns = footerGroups?.columns?.length
    ? footerGroups.columns
    : [
        { title: "Company", links: footerGroups?.company || [] },
        { title: "Support", links: footerGroups?.support || [] },
      ];
  const legal = footerGroups?.legal || [];
  const socialEntries = [
    ["Facebook", social?.facebook],
    ["Instagram", social?.instagram],
    ["LinkedIn", social?.linkedin],
    ["X", social?.twitter],
    ["YouTube", social?.youtube],
  ].filter(([, href]) => Boolean(href));
  const flightEnabled = (services || []).some((service) => String(service.id || service.code || "").toLowerCase() === "flight");
  const [destinations, setDestinations] = useState([]);

  useEffect(() => {
    if (!flightEnabled) return undefined;
    let cancelled = false;
    fetch("/api/v1/public/popular-routes", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) return;
        const groups = Array.isArray(payload?.data?.groups) ? payload.data.groups : [];
        const flight = groups.find((group) => group.serviceCode === "flight");
        setDestinations(Array.isArray(flight?.routes) ? flight.routes : []);
      })
      .catch(() => {
        if (!cancelled) setDestinations([]);
      });
    return () => {
      cancelled = true;
    };
  }, [flightEnabled]);

  const market = getMarket();

  return (
    <footer id="footer" className="site-footer">
      {flightEnabled && destinations.length ? (
        <section className="site-footer-destinations">
          <div className="container-page">
            <h2>Popular Destinations</h2>
            <ul>
              {destinations.map((route) => (
                <li key={route.id}>
                  <button
                    type="button"
                    onClick={() => {
                      const built = buildPopularFlightSearch(route);
                      if (built?.href) router.push(built.href);
                    }}
                  >
                    {route.destinationName || route.destinationCode}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
      <div className="container-page site-footer-main">
        <div className="site-footer-grid">
          {columns.map((column) => (
            <FooterColumn key={column.title} title={column.title} links={column.links} />
          ))}
          {socialEntries.length ? (
            <FooterColumn
              title="Connect"
              links={socialEntries.map(([label, href]) => ({ label, href }))}
            />
          ) : null}
        </div>
        <div className="site-footer-bottom">
          <div className="site-footer-brand">
            {branding.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branding.logoUrl} alt={brandName || "Website logo"} />
            ) : null}
            {brandName ? <p>{brandName}</p> : null}
          </div>
          <p>© {year}{brandName ? ` ${brandName}` : ""}. All rights reserved.</p>
          <div className="site-footer-meta">
            {market?.currency ? <span>{market.currency}{market.label ? ` · ${market.label}` : ""}</span> : null}
            {legal.map((link) => (
              <FooterAnchor key={`${link.label}-${link.href}`} href={link.href}>{link.label}</FooterAnchor>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
