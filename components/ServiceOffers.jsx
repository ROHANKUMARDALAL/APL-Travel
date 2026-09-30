"use client";

import Image from "next/image";
import Link from "next/link";
import Reveal, { revealVariant } from "@/components/motion/Reveal";
import { getOffers } from "@/data/static";
import { getActiveMarketId } from "@/data/markets";

const TITLES = {
  flight: "Flight offers & deals",
  hotel: "Hotel stays worth booking",
  bus: "Bus routes on offer",
};

const COPY = {
  flight: "Hand-picked global routes with clear prices.",
  hotel: "Curated stays for weekends and work trips worldwide.",
  bus: "Comfortable coaches for popular corridors.",
};

export default function ServiceOffers({ activeService }) {
  const offers = getOffers(getActiveMarketId())[activeService] || [];

  return (
    <section id="offers" className="py-16 sm:py-20">
      <div className="container-page">
        <Reveal variant="up">
          <p className="section-eyebrow">Selected service</p>
          <h2 className="section-title">{TITLES[activeService]}</h2>
          <p className="section-copy">{COPY[activeService]}</p>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer, index) => (
            <Reveal
              key={offer.id}
              variant={revealVariant(index)}
              step={index % 3}
              className="h-full"
            >
              <Link
                href={`/offers/${activeService}/${offer.id}`}
                className="offer-card h-full"
              >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={offer.image}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="offer-image"
                  priority={index === 0}
                />
                <span className="offer-tag">{offer.tag}</span>
              </div>
              <div className="p-5">
                <h3 className="font-display text-xl font-semibold text-[var(--ink)]">
                  {offer.title}
                </h3>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">{offer.subtitle}</p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-lg font-bold text-[var(--brand-deep)]">{offer.price}</p>
                  <span className="btn-ghost">View deal</span>
                </div>
              </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
