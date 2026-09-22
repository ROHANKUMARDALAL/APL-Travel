import Link from "next/link";
import { FOOTER } from "@/data/static";

/** Global footer — safe to use on homepage and all portal routes. */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      id="footer"
      className="bg-[var(--hero-from)] pt-14 text-white sm:pt-16"
    >
      <div className="container-page">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="brand-mark">{FOOTER.brand}</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">
              {FOOTER.tagline}
            </p>
            <div className="mt-5 space-y-1 text-sm text-white/70">
              <p>{FOOTER.contact.email}</p>
              <p>{FOOTER.contact.phone}</p>
              <p>{FOOTER.contact.address}</p>
            </div>
          </div>

          <div>
            <p className="footer-heading">Company</p>
            <ul className="space-y-2.5">
              {FOOTER.company.map((link) => (
                <li key={link.label}>
                  <Link className="footer-link" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="footer-heading">Services</p>
            <ul className="space-y-2.5">
              {FOOTER.services.map((link) => (
                <li key={link.label}>
                  <Link className="footer-link" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="footer-heading">Support</p>
            <ul className="space-y-2.5">
              {FOOTER.support.map((link) => (
                <li key={link.label}>
                  <Link className="footer-link" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/50">
            © {year} {FOOTER.brand}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-5">
            {FOOTER.legal.map((link) => (
              <li key={link.label}>
                <Link className="footer-link" href={link.href}>
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
