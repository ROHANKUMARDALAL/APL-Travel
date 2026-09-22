import Link from "next/link";
import SiteChrome from "@/components/layout/SiteChrome";

/** Minimal route placeholder — no mock results or booking UI. */
export default function RoutePlaceholder({
  title,
  description,
  serviceHint,
}) {
  return (
    <SiteChrome activeService={serviceHint}>
      <section className="container-page py-16 sm:py-24">
        <p className="section-eyebrow">Coming soon</p>
        <h1 className="section-title">{title}</h1>
        <p className="section-copy">{description}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="btn-primary" href="/#search">
            Back to search
          </Link>
          <Link className="btn-ghost" href="/support">
            Support
          </Link>
        </div>
      </section>
    </SiteChrome>
  );
}
