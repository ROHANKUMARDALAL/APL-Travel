import Image from "next/image";
import Link from "next/link";
import SiteChrome from "@/components/layout/SiteChrome";
import Reveal from "@/components/motion/Reveal";

export default function NoteArticle({
  activeService,
  kicker,
  title,
  lead,
  place,
  readTime,
  bestFor,
  price,
  image,
  paragraphs = [],
  sections = [],
  tips = [],
  dealHref,
  dealLabel,
  searchHref,
  searchLabel,
}) {
  return (
    <SiteChrome activeService={activeService}>
      <article className="note-page">
        <div className="container-page note-page-inner">
          <Link className="catalog-back" href="/#notes">
            Our best testimonials
          </Link>
          <Reveal variant="up">
            <p className="note-kicker">{kicker}</p>
            <h1 className="note-title">{title}</h1>
            <p className="note-lead">{lead}</p>
            <ul className="note-meta">
              {place ? <li>{place}</li> : null}
              {readTime ? <li>{readTime} read</li> : null}
              {bestFor ? <li>{bestFor}</li> : null}
              <li>{price}</li>
            </ul>
          </Reveal>

          {image ? (
            <Reveal variant="zoom" step={1}>
              <div className="note-hero">
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="(max-width: 900px) 100vw, 860px"
                  className="offer-image"
                  priority
                />
              </div>
            </Reveal>
          ) : null}

          <div className="note-layout">
            <div>
              {paragraphs.map((paragraph, index) => (
                <Reveal key={paragraph} variant={index % 2 === 0 ? "left" : "drift"} step={index % 3}>
                  <p className="note-body">{paragraph}</p>
                </Reveal>
              ))}
              {sections.map((section, index) => (
                <Reveal key={section.title} variant={index % 2 === 0 ? "up" : "right"} step={index % 3}>
                  <section className="note-section">
                    <h2>{section.title}</h2>
                    <p>{section.body}</p>
                  </section>
                </Reveal>
              ))}
            </div>
            <Reveal variant="zoom" step={2}>
              <aside className="note-aside">
              <p className="note-aside-label">Keep in mind</p>
              <ul>
                {tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
              {dealHref ? (
                <Link className="btn-primary note-aside-action" href={dealHref}>
                  {dealLabel}
                </Link>
              ) : null}
              {searchHref ? (
                <Link className="note-aside-search" href={searchHref}>
                  {searchLabel}
                </Link>
              ) : null}
              </aside>
            </Reveal>
          </div>
        </div>
      </article>
    </SiteChrome>
  );
}
