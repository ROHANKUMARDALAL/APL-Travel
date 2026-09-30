import { Suspense } from "react";
import OfferDetail from "@/components/offers/OfferDetail";
import { OFFERS_RAW } from "@/data/static";

export function generateStaticParams() {
  return Object.entries(OFFERS_RAW).flatMap(([service, items]) =>
    items.map((item) => ({ service, id: item.id })),
  );
}

export async function generateMetadata({ params }) {
  const { service, id } = await params;
  const offer = (OFFERS_RAW[service] || []).find((item) => item.id === id);
  return {
    title: offer ? `${offer.title} | APL Travel` : "Deal | APL Travel",
    description: offer?.subtitle || "Offer details on APL Travel.",
  };
}

export default async function OfferDetailPage({ params }) {
  const { service, id } = await params;

  return (
    <Suspense fallback={<div className="site-shell min-h-screen bg-[var(--bg)]" />}>
      <OfferDetail service={service} id={id} />
    </Suspense>
  );
}
