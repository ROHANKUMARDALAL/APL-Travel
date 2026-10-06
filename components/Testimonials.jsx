"use client";

import Reveal, { revealVariant } from "@/components/motion/Reveal";
import { useSite } from "@/components/site/SiteProvider";

export default function Testimonials() {
  const { testimonials } = useSite();
  if (!testimonials?.length) return null;

  return (
    <section id="stories" className="border-t border-[var(--line)] bg-white py-16 sm:py-20">
      <div className="container-page">
        <Reveal variant="up">
          <p className="section-eyebrow">Traveller stories</p>
          <h2 className="section-title">Loved by people who book often</h2>
          <p className="section-copy">
            Feedback from travellers on this website.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((item, index) => {
            const role = [item.designation, item.company].filter(Boolean).join(" · ");
            return (
              <Reveal
                key={`${item.customerName}-${index}`}
                variant={revealVariant(index + 1)}
                step={index}
                className="h-full"
              >
                <blockquote className="testimonial-card h-full">
                  <div
                    className="mb-4 flex gap-1 text-[var(--accent)]"
                    aria-label={`${item.rating} stars`}
                  >
                    {Array.from({ length: item.rating || 5 }).map((_, starIndex) => (
                      <span key={starIndex}>★</span>
                    ))}
                  </div>
                  <p className="text-[15px] leading-relaxed text-[var(--ink)]">
                    &ldquo;{item.message}&rdquo;
                  </p>
                  <footer className="mt-5">
                    <p className="font-semibold text-[var(--ink)]">{item.customerName}</p>
                    {role ? <p className="text-sm text-[var(--ink-muted)]">{role}</p> : null}
                  </footer>
                </blockquote>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
