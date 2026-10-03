"use client";

import { ticketFromBooking, type TicketDocument } from "@/lib/ticketPdf";

type ETicketPreviewProps = {
  confirmation: Parameters<typeof ticketFromBooking>[0];
  item?: Parameters<typeof ticketFromBooking>[1];
};

function FlightItinerary({ ticket }: { ticket: TicketDocument }) {
  const flight = ticket.flight;
  return (
    <div className="eticket-itinerary">
      <div className="eticket-itinerary-col is-depart">
        <p className="eticket-time">{flight.from.time}</p>
        <p className="eticket-city">{flight.from.city}</p>
        <p className="eticket-code">{flight.from.code}</p>
        <p className="eticket-date">{flight.from.date}</p>
      </div>

      <div className="eticket-itinerary-col eticket-path">
        <p className="eticket-airline">{flight.airline}</p>
        <p className="eticket-meta">
          {flight.flightNumber} · {flight.cabin}
        </p>
        <p className="eticket-meta">
          {flight.duration} · {flight.stops}
        </p>
        <div className="eticket-route" aria-hidden="true">
          <span className="eticket-route-dot" />
          <span className="eticket-route-line" />
          <span className="eticket-route-arrow">→</span>
          <span className="eticket-route-line" />
          <span className="eticket-route-dot is-end" />
        </div>
        <p className="eticket-meta">{flight.fareLabel}</p>
      </div>

      <div className="eticket-itinerary-col is-arrive">
        <p className="eticket-time">{flight.to.time}</p>
        <p className="eticket-city">{flight.to.city}</p>
        <p className="eticket-code">{flight.to.code}</p>
        <p className="eticket-date">{flight.to.date}</p>
      </div>

      <div className="eticket-baggage-bar">
        <span>Cabin {flight.cabinKg} kg</span>
        <span>Check-in {flight.checkinKg} kg</span>
        <span className="eticket-baggage-note">{flight.baggage}</span>
      </div>
    </div>
  );
}

export default function ETicketPreview({ confirmation, item }: ETicketPreviewProps) {
  const ticket = ticketFromBooking(confirmation, item);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(ticket.reference || "APL")}`;

  return (
    <section className="eticket-preview checkout-section" id="eticket">
      <div className="eticket-preview-head no-print">
        <h2 className="checkout-section-title">E-ticket preview</h2>
        <p className="section-copy">A4 print-ready layout matching your downloadable PDF.</p>
      </div>

      <article className="eticket-sheet" aria-label="E-ticket">
        <header className="eticket-header">
          <div className="eticket-brand">
            <span className="eticket-logo" aria-hidden="true">
              APL
            </span>
            <div className="eticket-brand-copy">
              <p className="eticket-brand-name">APL Travel</p>
              <p className="eticket-brand-sub">Electronic Ticket / Itinerary Receipt</p>
            </div>
          </div>
          <div className="eticket-company">
            <p className="eticket-company-name">{ticket.company.name}</p>
            <p>{ticket.company.address}</p>
            <p>{ticket.company.email}</p>
            <p className="eticket-pnr">
              PNR / Booking: <strong>{ticket.reference}</strong>
            </p>
          </div>
        </header>

        <div className="eticket-verify-row">
          <div className="eticket-verify-left">
            <span className="eticket-status">{ticket.status}</span>
            <p className="eticket-support">
              Support {ticket.company.phone}
              <br />
              {ticket.company.email}
            </p>
          </div>
          <div className="eticket-codes">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="eticket-qr" src={qrSrc} alt={`QR for ${ticket.reference}`} />
            <div className="eticket-barcode-wrap">
              <div className="eticket-barcode" aria-hidden="true">
                {Array.from({ length: 48 }).map((_, index) => (
                  <span
                    key={index}
                    style={{
                      width: index % 5 === 0 ? 2 : 1,
                      opacity:
                        (ticket.reference || "A").charCodeAt(
                          index % (ticket.reference?.length || 1),
                        ) % 2
                          ? 1
                          : 0.35,
                    }}
                  />
                ))}
              </div>
              <p className="eticket-barcode-label">{ticket.reference}</p>
            </div>
          </div>
        </div>

        {ticket.service === "flight" ? <FlightItinerary ticket={ticket} /> : null}

        <div className="eticket-table-wrap">
          <table className="eticket-table">
            <thead>
              <tr>
                <th className="is-num">#</th>
                <th className="is-name">Passenger Name</th>
                <th>Type</th>
                <th>Gender</th>
                <th>Seat / Meal</th>
              </tr>
            </thead>
            <tbody>
              {(ticket.passengers || []).map((person) => (
                <tr key={`${person.index}-${person.name}`}>
                  <td className="is-num">{person.index}</td>
                  <td className="is-name">{person.name}</td>
                  <td>{person.type}</td>
                  <td>{person.gender}</td>
                  <td>{person.seatMeal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="eticket-contact">
          Primary contact: {ticket.contact.email} · {ticket.contact.phone}
        </p>

        <div className="eticket-footer-grid">
          <table className="eticket-fare-table">
            <tbody>
              <tr>
                <td>Base fare</td>
                <td>{ticket.fare.base}</td>
              </tr>
              <tr>
                <td>Taxes &amp; surcharges</td>
                <td>{ticket.fare.taxes}</td>
              </tr>
              <tr>
                <td>Convenience fee</td>
                <td>{ticket.fare.fee}</td>
              </tr>
              {ticket.fare.extras ? (
                <tr>
                  <td>Extras</td>
                  <td>{ticket.fare.extras}</td>
                </tr>
              ) : null}
              <tr className="is-total">
                <td>Total paid</td>
                <td>{ticket.fare.total}</td>
              </tr>
            </tbody>
          </table>
          <div className="eticket-sign">
            <p>Authorized Signatory</p>
            <strong>APL Travel</strong>
            <span className="eticket-sign-line" />
            <small>Digitally authorised e-ticket</small>
          </div>
        </div>

        <p className="eticket-disclaimer">
          Important: Carry a valid photo ID matching passenger names. Arrive at the airport at least
          2 hours before domestic departure. This e-ticket is non-transferable. Fare rules of the
          selected tier apply for changes and cancellations. APL Travel acts as a booking
          facilitator; airline operating conditions remain binding.
        </p>
      </article>
    </section>
  );
}
