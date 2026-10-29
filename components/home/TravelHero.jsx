import HeroBackground from "@/components/home/HeroBackground";

const TRUST = [
  {
    title: "Best travel deals",
    body: "Compare the fares this desk can offer",
    color: "#f97316",
    icon: "tag",
  },
  {
    title: "Fare confirmation",
    body: "The price is checked before booking",
    color: "#16a34a",
    icon: "shield",
  },
  {
    title: "Travel desk support",
    body: "Contact details are on this website",
    color: "#7c3aed",
    icon: "headset",
  },
];

export default function TravelHero({ slides }) {
  return (
    <section className="home-hero" aria-label="Discover your next journey">
      <HeroBackground slides={slides} />
      <div className="home-hero-shade" aria-hidden="true" />
      <div className="container-page home-hero-copy">
        <p className="home-hero-kicker">Explore the world</p>
        <h1>Discover Your Next Journey</h1>
        <p className="home-hero-sub">Flights, hotels, holidays and more — all in one place.</p>
        <ul className="home-trust">
          {TRUST.map((item) => (
            <li key={item.title}>
              <span className="home-trust-icon" style={{ background: item.color }} aria-hidden="true">
                <TrustIcon name={item.icon} />
              </span>
              <span>
                <strong>{item.title}</strong>
                <small>{item.body}</small>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="home-hero-script" aria-hidden="true">
        Explore
        <br />
        Dream
        <br />
        Destinations
      </p>
    </section>
  );
}

function TrustIcon({ name }) {
  if (name === "shield") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
        <path d="M12 3 5 6v6c0 4.2 2.8 7.4 7 9 4.2-1.6 7-4.8 7-9V6l-7-3Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "headset") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
        <path d="M4 13a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 13v4a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 2Zm16 0v4a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2Z" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path d="M20 13V7H10l-2-3H4v13h16v-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
