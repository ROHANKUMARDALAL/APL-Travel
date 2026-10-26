"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { apiGet } from "@/lib/api/client";
import { getSession } from "@/lib/auth";
import { useAuth } from "@/components/auth/useAuth";
import { formatWhen, serviceLabel, statusClass } from "./enquiry-view";

export default function EnquiryDetail({ reference }) {
  const { ready, authenticated } = useAuth();
  const [row, setRow] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready || !authenticated || !reference) return;
    const session = getSession();
    apiGet("/enquiries/mine", { token: session?.loginToken })
      .then((data) => {
        const found = (data.enquiries || []).find((item) => item.enquiryReference === reference);
        if (!found) setError("This enquiry is not on your account.");
        else setRow(found);
      })
      .catch((err) => setError(err.message || "Could not load the enquiry"));
  }, [ready, authenticated, reference]);

  return (
    <div className="site-shell min-h-screen bg-[var(--bg)]">
      <Header variant="portal" showServiceTabs={false} />
      <main className="container-page enquiry-dash py-8">
        <Link href="/account/enquiries">Back to enquiries</Link>
        {!ready || (authenticated && !row && !error) ? <p className="enquiry-panel">Loading enquiry…</p> : null}
        {ready && !authenticated ? <p className="enquiry-panel"><Link className="btn-primary inline-flex" href={`/login?next=/account/enquiries/${reference}`}>Sign in</Link></p> : null}
        {error ? <p className="enquiry-panel text-red-700">{error}</p> : null}
        {row ? (
          <>
            <header className="enquiry-card-top">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink-muted)]">{serviceLabel(row)}</p>
                <h1 className="text-3xl font-semibold">{row.enquiryReference}</h1>
              </div>
              <span className={`enquiry-badge ${statusClass(row.status)}`}>{String(row.status || "").replaceAll("_", " ")}</span>
            </header>
            <div className="enquiry-detail-grid">
              <section className="enquiry-panel">
                <h2 className="font-semibold">Package</h2>
                <p className="mt-2">{row.package?.title || serviceLabel(row)}</p>
                <p className="text-sm text-[var(--ink-muted)]">{row.package?.destinationCity || "Destination not set"} · {row.durationDays || row.package?.durationDays || "—"} days</p>
              </section>
              <section className="enquiry-panel">
                <h2 className="font-semibold">Contact</h2>
                <p className="mt-2">{row.contactDetails?.name || row.customer?.name || "—"}</p>
                <p>{row.contactDetails?.mobile || row.customer?.phone || "—"}</p>
                <p>{row.contactDetails?.email || row.customer?.email || "—"}</p>
              </section>
              <section className="enquiry-panel">
                <h2 className="font-semibold">Travel</h2>
                <p className="mt-2">Departure {formatWhen(row.preferredDepartureDate)}</p>
                <p>Submitted {formatWhen(row.createdAt)}</p>
                <p>{row.adults || 0} adults · {row.children || 0} children · {row.totalPassengers || 0} travellers</p>
                {row.specialRequirements ? <p className="mt-2 text-sm">{row.specialRequirements}</p> : null}
              </section>
              <section className="enquiry-panel">
                <h2 className="font-semibold">Travellers</h2>
                <ul className="mt-2 space-y-2 text-sm">
                  {(row.passengers || []).map((passenger) => (
                    <li key={passenger.fullName}>{passenger.fullName} · {passenger.document?.type || "ID"} {passenger.document?.maskedNumber || ""}</li>
                  ))}
                </ul>
              </section>
            </div>
            {row.customerVisibleRemarks ? (
              <section className="enquiry-panel">
                <h2 className="font-semibold">Response</h2>
                <p className="mt-2">{row.customerVisibleRemarks}</p>
              </section>
            ) : null}
            <section className="enquiry-panel">
              <h2 className="font-semibold">Status timeline</h2>
              <ol className="enquiry-timeline mt-3 text-sm">
                {(row.timeline || []).map((item, index) => (
                  <li key={`${item.at}-${index}`}>
                    <strong>{item.toStatus || item.action}</strong>
                    <span className="ml-2 text-[var(--ink-muted)]">{formatWhen(item.at)}</span>
                  </li>
                ))}
              </ol>
            </section>
          </>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
