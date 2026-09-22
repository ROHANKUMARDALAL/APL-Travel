const STEPS = [
  { id: "select", label: "Select" },
  { id: "details", label: "Details" },
  { id: "traveller", label: "Traveller" },
  { id: "extras", label: "Extras" },
  { id: "checkout", label: "Checkout" },
];

export default function BookingProgress({ current = "details" }) {
  const currentIndex = STEPS.findIndex((step) => step.id === current);

  return (
    <nav className="booking-progress" aria-label="Booking progress">
      <ol className="booking-progress-list">
        {STEPS.map((step, index) => {
          const state =
            index < currentIndex ? "done" : index === currentIndex ? "current" : "todo";
          return (
            <li key={step.id} className={`booking-progress-item is-${state}`}>
              <span className="booking-progress-dot" aria-hidden="true">
                {index + 1}
              </span>
              <span className="booking-progress-label">{step.label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
