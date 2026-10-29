"use client";

import Link from "next/link";
import Reveal from "@/components/motion/Reveal";
import { BlogCover } from "@/components/blog/BlogGallery";
import { useSite } from "@/components/site/SiteProvider";

function bannerMatchesService(banner, activeService) {
  if (banner.placement === "PROMO" || banner.placement === "HOME_SECONDARY") return true;
  if (banner.placement !== "SERVICE") return false;
  if (!banner.serviceCode) return true;
  return String(banner.serviceCode).toLowerCase() === String(activeService || "").toLowerCase();
}

/** Home promotions and journal posts published from DSAAdmin. */
export default function HomeFromCms({ activeService }) {
  const { banners, blogs } = useSite();
  const promos = (banners || []).filter((banner) => bannerMatchesService(banner, activeService));
  const posts = (blogs || []).slice(0, 6);
  if (!promos.length && !posts.length) return null;

  return (
    <>
      {promos.length ? (
        <section id="offers" className="home-promos">
          <div className="container-page">
            <Reveal variant="up">
              <p className="section-eyebrow">From this website</p>
              <h2 className="section-title">Promotions</h2>
            </Reveal>
            <div className="home-promo-grid">
              {promos.map((banner, index) => {
                const card = (
                  <>
                    {banner.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={banner.imageUrl}
                        alt=""
                        className="home-promo-image"
                        loading="lazy"
                      />
                    ) : null}
                    <div className="home-promo-body">
                      <h3>{banner.title}</h3>
                    </div>
                  </>
                );
                const className = "offer-card block h-full overflow-hidden";
                return (
                  <Reveal key={`${banner.title}-${banner.displayOrder}`} as={banner.linkUrl ? "a" : "article"} href={banner.linkUrl || undefined} className={className} delay={index * 100}>
                    {card}
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {posts.length ? (
        <section id="notes" className="home-journal border-t border-[var(--line)]">
          <div className="container-page">
            <Reveal variant="up">
              <p className="section-eyebrow">Journal</p>
              <h2 className="section-title">Latest posts</h2>
            </Reveal>
            <ul className="home-post-grid">
              {posts.map((post, index) => {
                const published = post.publishDate ? new Date(post.publishDate) : null;
                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const dateLabel = published && !Number.isNaN(published.getTime())
                  ? `${published.getUTCDate()} ${months[published.getUTCMonth()]} ${published.getUTCFullYear()}`
                  : "";
                return (
                  <Reveal as="li" key={post.slug} delay={index * 100}>
                    <Link href={`/blogs/${post.slug}`} className="home-post">
                      <span className="home-post-media"><BlogCover post={post} /></span>
                      <span className="home-post-body">
                        <span className="home-post-meta">
                          <span>Journal</span>
                          {dateLabel ? <time dateTime={post.publishDate}>{dateLabel}</time> : null}
                        </span>
                        <h3>{post.title}</h3>
                        {post.shortDescription ? <p>{post.shortDescription}</p> : null}
                        <span className="home-post-more">Read more</span>
                      </span>
                    </Link>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
