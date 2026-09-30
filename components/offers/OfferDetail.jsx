"use client";

import Link from "next/link";
import CatalogDetail from "@/components/offers/CatalogDetail";
import SiteChrome from "@/components/layout/SiteChrome";
import { getOffer, getTravelNote } from "@/data/static";
import { getActiveMarketId } from "@/data/markets";

const SERVICE_LABEL = {
  flight: "Flight deal",
  hotel: "Hotel deal",
  bus: "Bus deal",
};

export default function OfferDetail({ service, id }) {
  const offer = getOffer(service, id, getActiveMarketId());

  if (!offer) {
    return (
      <SiteChrome>
        <section className="container-page catalog-page">
          <h1 className="catalog-title">This deal is not listed</h1>
          <p className="catalog-lead">Choose another offer from the homepage.</p>
          <Link className="catalog-related" href="/#offers">
            Back to offers
          </Link>
        </section>
      </SiteChrome>
    );
  }

  const note = offer.relatedNote ? getTravelNote(offer.relatedNote) : null;

  return (
    <CatalogDetail
      activeService={offer.service}
      backHref={`/?service=${offer.service}#offers`}
      backLabel="All deals"
      eyebrow={SERVICE_LABEL[offer.service] || "Deal"}
      title={offer.title}
      lead={offer.subtitle}
      image={offer.image}
      price={offer.price}
      priceCaption={offer.tag}
      paragraphs={offer.paragraphs}
      highlights={offer.highlights}
      facts={offer.facts}
      included={offer.included}
      pace={offer.pace}
      know={offer.know}
      actionHref={`/?service=${offer.service}#search`}
      actionLabel={offer.service === "hotel" ? "Search this stay" : "Search this trip"}
      relatedHref={note ? `/notes/${note.id}` : ""}
      relatedLabel={note ? `Read the story: ${note.title}` : ""}
    />
  );
}
