"use client";

import Link from "next/link";
import { useSite } from "@/components/site/SiteProvider";

function FooterColumn({ title, links }) {
  if (!links?.length) return null;
  return (
    <div>
      <p className="footer-heading">{title}</p>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={`${title}-${link.label}-${link.href}`}>
            <Link className="footer-link" href={link.href || "/"}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Global footer — brand/contact/links from public site config with static fallback. */
export default function Footer() {
  const year = new Date().getFullYear();
  const { branding, contact, footerGroups, social } = useSite();
  const brandName = branding.websiteName || "APL Travel";

  const socialEntries = [
    ["Facebook", social.facebook],
    ["Instagram", social.instagram],
    ["LinkedIn", social.linkedin],
    ["X", social.twitter],
    ["YouTube", social.youtube],
  ].filter(([, href]) => Boolean(href));

  return (
    <footer id="footer" className="bg-[var(--hero-from)] pt-14 text-white sm:pt-16">
      <div className="container-page">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="brand-mark">{brandName}</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">
              {branding.tagline}
            </p>
            <div className="mt-5 space-y-1 text-sm text-white/70">
              {contact.email ? <p>{contact.email}</p> : null}
              {contact.phone ? <p>{contact.phone}</p> : null}
              {contact.address ? <p>{contact.address}</p> : null}
            </div>
            {socialEntries.length ? (
              <ul className="mt-4 flex flex-wrap gap-3 text-sm text-white/70">
                {socialEntries.map(([label, href]) => (
                  <li key={label}>
                    <a className="footer-link" href={href} target="_blank" rel="noreferrer">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <FooterColumn title="Company" links={footerGroups.company} />
          <FooterColumn title="Services" links={footerGroups.services} />
          <FooterColumn title="Support" links={footerGroups.support} />
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/50">
            © {year} {brandName}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-5">
            {(footerGroups.legal || []).map((link) => (
              <li key={`legal-${link.label}-${link.href}`}>
                <Link className="footer-link" href={link.href || "/"}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
