"use client";

const FALLBACK_SRC = "/images/hero-tropical.jpg";

export function LuxuryHomeHero({ branding, slides }) {
  const active = Array.isArray(slides) ? slides.find((slide) => slide?.src) : null;
  const realLabel = active && active.src !== FALLBACK_SRC && active.label && active.label !== "Destination"
    ? active.label
    : "";
  const name = branding?.websiteName || "Travel";
  const description = branding?.tagline || "Private journeys arranged by this travel desk.";

  return (
    <section className="lx-cinema" aria-label="Luxury journey">
      {active?.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={active.src} alt={realLabel || ""} />
      ) : null}
      <div className="lx-shade" />
      <div className="lx-copy">
        <p className="lx-kicker">{name}</p>
        <h1 className="lx-title">
          Travel with <span>quiet luxury</span>.
        </h1>
        <p className="lx-lead">{description}</p>
        <ul className="lx-points">
          <li>Fare checked before you pay</li>
          <li>Arranged by this travel desk</li>
        </ul>
        {realLabel ? <p className="lx-feature">Featured · {realLabel}</p> : null}
      </div>
    </section>
  );
}
