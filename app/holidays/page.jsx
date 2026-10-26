import { Suspense } from "react";
import { HolidayListPage } from "@/components/holidays/HolidayBrowse";

export const metadata = { title: "Holidays" };

export default function HolidaysPage() {
  return (
    <Suspense fallback={<p className="container-page py-8">Loading holidays…</p>}>
      <HolidayListPage />
    </Suspense>
  );
}
