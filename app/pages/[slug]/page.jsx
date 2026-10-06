import Link from "next/link";
import { notFound } from "next/navigation";
import SiteChrome from "@/components/layout/SiteChrome";
import { getPublicPage } from "@/lib/site/config";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await getPublicPage(slug);
  if (!page) return { title: "Page" };
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || undefined,
  };
}

export default async function CmsPublicPage({ params }) {
  const { slug } = await params;
  const page = await getPublicPage(slug);
  if (!page) notFound();

  return (
    <SiteChrome>
      <article className="container-page py-12 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
          {page.pageType}
        </p>
        <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
          {page.title}
        </h1>
        <div className="prose prose-slate mt-8 max-w-3xl whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--ink)]">
          {page.content}
        </div>
        <p className="mt-10">
          <Link className="text-sm font-medium text-[var(--brand)]" href="/">
            ← Back to home
          </Link>
        </p>
      </article>
    </SiteChrome>
  );
}
