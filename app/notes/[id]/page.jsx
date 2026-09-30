import { Suspense } from "react";
import NoteDetail from "@/components/offers/NoteDetail";
import { TRAVEL_NOTES } from "@/data/static";

export function generateStaticParams() {
  return TRAVEL_NOTES.map((note) => ({ id: note.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const note = TRAVEL_NOTES.find((item) => item.id === id);
  return {
    title: note ? `${note.title} | APL Travel` : "Travel note | APL Travel",
    description: note?.excerpt || "A travel note from APL Travel.",
  };
}

export default async function NotePage({ params }) {
  const { id } = await params;

  return (
    <Suspense fallback={<div className="site-shell min-h-screen bg-[var(--bg)]" />}>
      <NoteDetail id={id} />
    </Suspense>
  );
}
