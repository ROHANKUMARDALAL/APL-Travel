import Image from "next/image";
import Link from "next/link";
import SiteChrome from "@/components/layout/SiteChrome";
import Reveal from "@/components/motion/Reveal";

export default function CatalogDetail({
  activeService,
  backHref,
  backLabel,
  eyebrow,
  title,
  lead,
  image,
  imageAlt,
  price,
  priceCaption,
  paragraphs = [],
  highlights = [],
  facts = [],
  included = [],
  pace = "",
  know = [],
  actionHref,
  actionLabel,
  relatedHref,
  relatedLabel,
}) {
  return (
    <SiteChrome activeService={activeService}>
      <article className="catalog-page">
        <div className="container-page">
          <Link className="catalog-back" href={backHref}>
            {backLabel}
          </Link>

          <div className="catalog-layout">
            <div className="catalog-copy">
              <Reveal variant="up">
                <p className="section-eyebrow">{eyebrow}</p>
                <h1 className="catalog-title">{title}</h1>
                <p className="catalog-lead">{lead}</p>
              </Reveal>
              {paragraphs.map((paragraph, index) => (
                <Reveal key={paragraph} variant={index % 2 === 0 ? "left" : "right"} step={index % 3}>
                  <p className="catalog-body">{paragraph}</p>
                </Reveal>
              ))}

              {highlights.length ? (
                <Reveal variant="zoom">
                  <ul className="catalog-highlights">
                    {highlights.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </Reveal>
              ) : null}

              {facts.length ? (
                <Reveal variant="zoom" step={1}>
                  <dl className="catalog-facts">
                    {facts.map((fact) => (
                      <div key={fact.label}>
                        <dt>{fact.label}</dt>
                        <dd>{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                </Reveal>
              ) : null}

              {included.length ? (
                <Reveal variant="left" step={2}>
                  <div className="catalog-block">
                    <h2>Included in this deal</h2>
                    <ul className="catalog-highlights">
                      {included.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ) : null}

              {pace ? (
                <Reveal variant="right" step={1}>
                  <div className="catalog-block">
                    <h2>How the trip runs</h2>
                    <p className="catalog-body">{pace}</p>
                  </div>
                </Reveal>
              ) : null}

              {know.length ? (
                <Reveal variant="drift" step={2}>
                  <div className="catalog-block">
                    <h2>Good to know</h2>
                    <ul className="catalog-highlights">
                      {know.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ) : null}

              {relatedHref ? (
                <Link className="catalog-related" href={relatedHref}>
                  {relatedLabel}
                </Link>
              ) : null}
            </div>

            <Reveal variant="right" className="catalog-aside-wrap">
            <aside className="catalog-aside">
              {image ? (
                <div className="catalog-photo">
                  <Image
                    src={image}
                    alt={imageAlt || title}
                    fill
                    sizes="(max-width: 900px) 100vw, 380px"
                    className="offer-image"
                    priority
                  />
                </div>
              ) : null}
              <p className="catalog-price-caption">{priceCaption}</p>
              <p className="catalog-price">{price}</p>
              <Link className="btn-primary catalog-action" href={actionHref}>
                {actionLabel}
              </Link>
            </aside>
            </Reveal>
          </div>
        </div>
      </article>
    </SiteChrome>
  );
}
