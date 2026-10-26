import Link from "next/link";
import SiteChrome from "@/components/layout/SiteChrome";
import { TestimonialCards } from "@/components/Testimonials";
import { getPublicSiteConfig } from "@/lib/site/config";

export const metadata = { title: "Testimonials" };

export default async function TestimonialsPage() {
  const site = await getPublicSiteConfig();
  const items = site.source === "legacy" ? [] : site.testimonials || [];
  const name = site.branding?.websiteName || "this travel desk";

  return (
    <SiteChrome>
      <section className="home-stories">
        <div className="container-page">
          <p className="section-eyebrow">Testimonials</p>
          <h1 className="section-title">What Our Customers Say</h1>
          <p className="section-copy">Reviews published by {name}.</p>
          {items.length ? <TestimonialCards items={items} /> : (
            <p className="home-trending-empty">No published testimonials yet.</p>
          )}
          <p className="mt-6"><Link className="home-view-all" href="/">Back to home</Link></p>
        </div>
      </section>
    </SiteChrome>
  );
}
