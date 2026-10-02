"use client";

import { useRouter } from "next/navigation";

function serviceName(service) {
  if (service === "hotel") return "Hotel";
  if (service === "bus") return "Bus";
  return service === "flight" ? "Flight" : "";
}

export default function TicketDetailHeader({ service }) {
  const router = useRouter();
  const name = serviceName(service);
  const title = name ? `${name} Ticket Detail` : "Ticket Detail";
  const backHref = service ? `/my-trips?service=${service}` : "/my-trips";

  return (
    <div className="ticket-detail-header">
      <button
        type="button"
        className="ticket-back"
        aria-label={name ? `Back to ${name} bookings` : "Back to bookings"}
        onClick={() => router.push(backHref)}
      >
        <span aria-hidden="true">←</span>
      </button>
      <h1 className="ticket-detail-title">{title}</h1>
    </div>
  );
}
