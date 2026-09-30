"use client";

import Link from "next/link";
import NoteArticle from "@/components/notes/NoteArticle";
import SiteChrome from "@/components/layout/SiteChrome";
import { getOffer, getTravelNote } from "@/data/static";
import { convertAmount, formatMoney, getActiveCurrencyCode, getActiveMarketId } from "@/data/markets";

export default function NoteDetail({ id }) {
  const note = getTravelNote(id);

  if (!note) {
    return (
      <SiteChrome>
        <section className="container-page note-page">
          <h1 className="note-title">This story is not listed</h1>
          <p className="note-lead">Choose another one from the testimonials.</p>
          <Link className="catalog-related" href="/#notes">
            Our best testimonials
          </Link>
        </section>
      </SiteChrome>
    );
  }

  const currency = getActiveCurrencyCode();
  const amount = convertAmount(note.priceInr, "INR", currency);
  const price = `From ${formatMoney(amount, undefined, currency)}${note.suffix || ""}`;
  const related = note.relatedOffer
    ? getOffer(note.relatedOffer.service, note.relatedOffer.id, getActiveMarketId())
    : null;

  return (
    <NoteArticle
      activeService={note.relatedOffer?.service}
      kicker={note.kicker}
      title={note.title}
      lead={note.excerpt}
      place={note.place}
      readTime={note.readTime}
      bestFor={note.bestFor}
      price={price}
      image={related?.image}
      paragraphs={note.paragraphs}
      sections={note.sections}
      tips={note.tips}
      dealHref={related ? `/offers/${related.service}/${related.id}` : ""}
      dealLabel={related ? "Open the matching deal" : ""}
      searchHref={related ? `/?service=${related.service}#search` : ""}
      searchLabel={related ? `Search ${related.title}` : ""}
    />
  );
}
