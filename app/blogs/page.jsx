import Link from "next/link";
import SiteChrome from "@/components/layout/SiteChrome";
import { getPublicBlogs } from "@/lib/site/config";

export const metadata = {
  title: "Travel blog",
};

export default async function BlogsPage() {
  const data = await getPublicBlogs();
  const items = data.items || [];

  return (
    <SiteChrome>
      <section className="container-page py-12 sm:py-16">
        <p className="section-eyebrow">Journal</p>
        <h1 className="section-title">Travel blog</h1>
        <p className="section-copy">Published stories from this website.</p>

        {!items.length ? (
          <p className="mt-10 text-sm text-[var(--ink-muted)]">No published posts yet.</p>
        ) : (
          <ul className="mt-10 grid gap-6 md:grid-cols-2">
            {items.map((post) => (
              <li
                key={post.slug}
                className="rounded-xl border border-[var(--line)] bg-white p-5 shadow-sm"
              >
                <Link href={`/blogs/${post.slug}`} className="block">
                  <h2 className="text-lg font-semibold text-[var(--ink)]">{post.title}</h2>
                  <p className="mt-2 text-sm text-[var(--ink-muted)]">
                    {post.shortDescription || "Read more"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </SiteChrome>
  );
}
