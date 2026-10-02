import Link from "next/link";

const STEPS = [
  { id: "search", label: "Search" },
  { id: "results", label: "Results" },
  { id: "details", label: "Details" },
  { id: "checkout", label: "Checkout" },
  { id: "payment", label: "Payment" },
  { id: "confirm", label: "Confirm" },
];

export default function BookingProgress({ current = "details", backHref = "", className = "" }) {
  const found = STEPS.findIndex((step) => step.id === current);
  const currentIndex = found < 0 ? 0 : found;

  return (
    <div className={`booking-progress-row ${className}`.trim()}>
      {backHref ? (
        <Link className="ticket-back booking-progress-back" href={backHref} aria-label="Go back">
          <span aria-hidden="true">←</span>
        </Link>
      ) : null}
      <nav className="booking-progress" aria-label="Booking steps">
      <ol className="booking-progress-list">
        {STEPS.map((step, index) => {
          const state =
            index < currentIndex ? "done" : index === currentIndex ? "current" : "todo";
          return (
            <li
              key={step.id}
              className={`booking-progress-item is-${state}`}
              aria-current={state === "current" ? "step" : undefined}
            >
              {index > 0 ? (
                <span
                  className={`booking-progress-arrow${index <= currentIndex ? " is-done" : ""}`}
                  aria-hidden="true"
                >
                  →
                </span>
              ) : null}
              <span className="booking-progress-dot" aria-hidden="true">
                {state === "done" ? "✓" : index + 1}
              </span>
              <span className="booking-progress-label">{step.label}</span>
            </li>
          );
        })}
      </ol>
      </nav>
    </div>
  );
}
