"use client";

import Link from "next/link";
import Reveal from "@/components/motion/Reveal";
import { useSite } from "@/components/site/SiteProvider";

function SocialGlyph({ label }) {
  const name = String(label || "").toLowerCase();
  if (name.includes("facebook")) {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.6l.4-3H13v-2c0-.6.4-1 1-1z" /></svg>;
  }
  if (name.includes("instagram")) {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4zm8 2H8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-4 2.5A3.5 3.5 0 1 1 8.5 12 3.5 3.5 0 0 1 12 8.5zm0 2A1.5 1.5 0 1 0 13.5 12 1.5 1.5 0 0 0 12 10.5zM17.2 7.3a1 1 0 1 1-1 1 1 1 0 0 1 1-1z" /></svg>;
  }
  if (name.includes("youtube")) {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 8.5a3 3 0 0 0-2.1-2.1C17.2 6 12 6 12 6s-5.2 0-6.9.4A3 3 0 0 0 3 8.5 31 31 0 0 0 2.6 12 31 31 0 0 0 3 15.5a3 3 0 0 0 2.1 2.1C6.8 18 12 18 12 18s5.2 0 6.9-.4a3 3 0 0 0 2.1-2.1A31 31 0 0 0 21.4 12 31 31 0 0 0 21 8.5zM10.5 14.5v-5l4.5 2.5z" /></svg>;
  }
  if (name.includes("linkedin")) {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 9H4v11h2.5zM5.2 4A1.6 1.6 0 1 0 5.2 7.2 1.6 1.6 0 0 0 5.2 4zM20 13.4c0-2.6-1.4-3.8-3.2-3.8a2.8 2.8 0 0 0-2.5 1.4V9.5H11.8c0 1.7 0 10.5 0 10.5H14.3v-5.9c0-.3 0-.6.1-.9a2 2 0 0 1 1.9-1.4c1.3 0 1.8 1 1.8 2.5v5.7H20z" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v2.2L13.2 13l5.8 5.8V21H5v-2.2l5.8-5.8L5 7.2z" /></svg>;
}

function FooterAnchor({ href, children }) {
  const target = href || "/";
  if (/^https?:\/\//i.test(target)) {
    return <a href={target} target="_blank" rel="noreferrer">{children}</a>;
  }
  return <Link href={target}>{children}</Link>;
}

export default function Footer() {
  const year = new Date().getFullYear();
  const { branding, footerGroups, social, tenant, services, contact } = useSite();
  const brandName = String(branding.websiteName || tenant?.displayName || tenant?.companyName || "").trim();
  const description = branding.tagline || (brandName ? `Travel services from ${brandName}.` : "");
  const configured = (footerGroups?.company || []).filter((link) => link?.label && link?.href);
  const socialName = /facebook|instagram|youtube|linkedin|twitter|^x$/i;
  const socialFromLinks = configured.filter((link) => socialName.test(link.label));
  const quick = [
    { label: "Home", href: "/" },
    ...configured.filter((link) => !socialName.test(link.label) && !/my bookings|my enquiries|^home$/i.test(link.label)),
    { label: "My Bookings", href: "/my-trips" },
    { label: "My Enquiries", href: "/account/enquiries" },
  ];
  const legal = footerGroups?.legal || [];
  const socialEntries = [
    ["Facebook", social?.facebook],
    ["Instagram", social?.instagram],
    ["YouTube", social?.youtube],
    ["LinkedIn", social?.linkedin],
    ["X", social?.twitter],
    ...socialFromLinks.map((link) => [link.label, link.href]),
  ].filter(([, href]) => Boolean(href));
  const contactRows = [
    contact?.phone ? ["Phone", contact.phone, `tel:${contact.phone}`] : null,
    contact?.email ? ["Email", contact.email, `mailto:${contact.email}`] : null,
    contact?.address ? ["Address", contact.address, ""] : null,
  ].filter(Boolean);

  return (
    <footer className="premium-footer">
      <div className="container-page premium-footer-grid">
        <section>
          {branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="premium-footer-logo" src={branding.logoUrl} alt={brandName || "Website logo"} />
          ) : brandName ? <p className="premium-footer-name">{brandName}</p> : null}
          {description ? <p className="premium-footer-about">{description}</p> : null}
          {socialEntries.length ? (
            <ul className="premium-social">
              {socialEntries.map(([label, href]) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noreferrer" aria-label={label}><SocialGlyph label={label} /></a>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
        <section>
          <h2>Quick Links</h2>
          <ul>
            {quick.map((link) => (
              <li key={`${link.label}-${link.href}`}><FooterAnchor href={link.href}>{link.label}</FooterAnchor></li>
            ))}
          </ul>
        </section>
        {services.length ? (
          <Reveal as="section" variant="up" delay={80}>
            <h2>Our Services</h2>
            <ul className="premium-service-list">
              {services.map((service) => (
                <li key={service.id}>
                  <FooterAnchor href={service.kind === "page" ? service.href : `/?service=${service.id}`}>{service.label}</FooterAnchor>
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}
        {contactRows.length ? (
          <section>
            <h2>Contact Us</h2>
            <ul className="premium-contact">
              {contactRows.map(([label, value, href]) => (
                <li key={label}>
                  {href ? <a href={href}>{value}</a> : <span>{value}</span>}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
      <div className="container-page premium-footer-bottom">
        <p>© {year}{brandName ? ` ${brandName}` : ""}. All rights reserved.</p>
        {legal.length ? (
          <ul>
            {legal.map((link) => (
              <li key={`${link.label}-${link.href}`}><FooterAnchor href={link.href}>{link.label}</FooterAnchor></li>
            ))}
          </ul>
        ) : null}
      </div>
    </footer>
  );
}
