import Link from "next/link";
import { notFound } from "next/navigation";
import SiteChrome from "@/components/layout/SiteChrome";
import BlogGallery from "@/components/blog/BlogGallery";
import { getPublicBlog } from "@/lib/site/config";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const blog = await getPublicBlog(slug);
  if (!blog) return { title: "Blog" };
  return {
    title: blog.seoTitle || blog.title,
    description: blog.seoDescription || blog.shortDescription || undefined,
  };
}

export default async function BlogDetailPage({ params }) {
  const { slug } = await params;
  const blog = await getPublicBlog(slug);
  if (!blog) notFound();

  return (
    <SiteChrome>
      <article className="container-page py-12 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
          Blog
        </p>
        <h1 className="font-display mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
          {blog.title}
        </h1>
        {blog.shortDescription ? (
          <p className="mt-4 max-w-2xl text-[var(--ink-muted)]">{blog.shortDescription}</p>
        ) : null}
        <BlogGallery title={blog.title} images={blog.images} />
        <div className="mt-8 max-w-3xl whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--ink)]">
          {blog.content}
        </div>
        <p className="mt-10">
          <Link className="text-sm font-medium text-[var(--brand)]" href="/blogs">
            ← All posts
          </Link>
        </p>
      </article>
    </SiteChrome>
  );
}
