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
        <section id="offers" className="py-16 sm:py-20">
          <div className="container-page">
            <Reveal variant="up">
              <p className="section-eyebrow">From this website</p>
              <h2 className="section-title">Promotions</h2>
            </Reveal>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {promos.map((banner) => {
                const card = (
                  <>
                    {banner.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={banner.imageUrl}
                        alt=""
                        className="aspect-[16/10] w-full object-cover"
                      />
                    ) : null}
                    <div className="p-5">
                      <h3 className="font-display text-xl font-semibold text-[var(--ink)]">
                        {banner.title}
                      </h3>
                    </div>
                  </>
                );
                const className = "offer-card block h-full overflow-hidden";
                return banner.linkUrl ? (
                  <a key={`${banner.title}-${banner.displayOrder}`} className={className} href={banner.linkUrl}>
                    {card}
                  </a>
                ) : (
                  <article key={`${banner.title}-${banner.displayOrder}`} className={className}>
                    {card}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {posts.length ? (
        <section id="notes" className="border-t border-[var(--line)] py-16 sm:py-20">
          <div className="container-page">
            <Reveal variant="up">
              <p className="section-eyebrow">Journal</p>
              <h2 className="section-title">Latest posts</h2>
            </Reveal>
            <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/blogs/${post.slug}`}
                    className="block h-full overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-sm"
                  >
                    <BlogCover post={post} />
                    <span className="block p-5">
                    <h3 className="text-lg font-semibold text-[var(--ink)]">{post.title}</h3>
                    {post.shortDescription ? (
                      <p className="mt-2 text-sm text-[var(--ink-muted)]">{post.shortDescription}</p>
                    ) : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
