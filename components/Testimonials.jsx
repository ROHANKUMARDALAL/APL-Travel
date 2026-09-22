import { TESTIMONIALS } from "@/data/static";

export default function Testimonials() {
  return (
    <section id="stories" className="border-t border-[var(--line)] bg-white py-16 sm:py-20">
      <div className="container-page">
        <p className="section-eyebrow">Traveller stories</p>
        <h2 className="section-title">Loved by people who book often</h2>
        <p className="section-copy">
          Real feedback style quotes for the landing experience. Swap with API data later.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <blockquote key={item.id} className="testimonial-card">
              <div className="mb-4 flex gap-1 text-[var(--accent)]" aria-label={`${item.rating} stars`}>
                {Array.from({ length: item.rating }).map((_, index) => (
                  <span key={index}>★</span>
                ))}
              </div>
              <p className="text-[15px] leading-relaxed text-[var(--ink)]">&ldquo;{item.quote}&rdquo;</p>
              <footer className="mt-5">
                <p className="font-semibold text-[var(--ink)]">{item.name}</p>
                <p className="text-sm text-[var(--ink-muted)]">{item.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
