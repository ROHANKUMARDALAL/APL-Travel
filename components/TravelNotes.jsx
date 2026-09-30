import Link from "next/link";
import Reveal from "@/components/motion/Reveal";
import { TRAVEL_NOTES } from "@/data/static";
import { convertAmount, formatMoney, getActiveCurrencyCode } from "@/data/markets";

export default function TravelNotes() {
  const currency = getActiveCurrencyCode();

  return (
    <section id="notes" className="testimonial-band">
      <div className="container-page">
        <Reveal variant="drift">
          <p className="testimonial-band-eyebrow">From the road</p>
          <h2 className="testimonial-band-title">Our best testimonials</h2>
          <p className="testimonial-band-copy">
            Short stories from routes people book again, with the fare in your currency.
          </p>
        </Reveal>
        <div className="testimonial-band-grid">
          {TRAVEL_NOTES.map((note, index) => {
            const amount = convertAmount(note.priceInr, "INR", currency);
            const price = formatMoney(amount, undefined, currency);
            return (
              <Reveal key={note.id} variant={index === 1 ? "zoom" : index === 2 ? "right" : "left"} step={index} className="h-full">
                <Link href={`/notes/${note.id}`} className="story-card h-full">
                <span className="story-mark" aria-hidden="true">
                  “
                </span>
                <p className="story-quote">{note.excerpt}</p>
                <p className="story-title">{note.title}</p>
                <p className="story-meta">
                  {note.place} · From {price}
                  {note.suffix || ""}
                </p>
              </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
