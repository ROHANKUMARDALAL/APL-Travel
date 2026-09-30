import Reveal from "@/components/motion/Reveal";

function BrandGroup({ items, hidden = false, variant = "badges" }) {
  const cards = variant === "cards";

  return (
    <div className={`brand-group${cards ? " is-cards" : ""}`} aria-hidden={hidden || undefined}>
      {items.map((item) =>
        cards ? (
          <article className="partner-card" key={item.name}>
            <div className="partner-card-top">
              <span className="brand-mark" aria-hidden="true">
                {item.mark}
              </span>
              <span className="partner-card-name">{item.name}</span>
            </div>
            {item.note ? <p className="partner-card-note">{item.note}</p> : null}
          </article>
        ) : (
          <span className="brand-badge" key={item.name}>
            <span className="brand-mark" aria-hidden="true">
              {item.mark}
            </span>
            <span>{item.name}</span>
          </span>
        )
      )}
    </div>
  );
}

export default function BrandStrip({ eyebrow, title, items, variant = "badges" }) {
  const cards = variant === "cards";

  return (
    <section className={`brand-strip${cards ? " is-partners" : ""}`} aria-label={title}>
      <Reveal variant={cards ? "zoom" : "left"} className="container-page brand-strip-head">
        <p className="section-eyebrow">{eyebrow}</p>
        <h2 className="brand-strip-title">{title}</h2>
      </Reveal>
      <div className="brand-marquee">
        <div className={`brand-track${cards ? " is-slow" : ""}`}>
          <BrandGroup items={items} variant={variant} />
          <BrandGroup items={items} hidden variant={variant} />
        </div>
      </div>
    </section>
  );
}
