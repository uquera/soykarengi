import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { shortDate } from "@/lib/format";
import { getDict, getLocale } from "@/lib/i18n";
import { postView } from "@/lib/content";
import { EmptyState, SectionHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return { title: t.blog.title, description: t.blog.lead };
}

export default async function BlogPage() {
  const [locale, t] = await Promise.all([getLocale(), getDict()]);

  const posts = (
    await db.post.findMany({
      where: { published: true, kind: "BLOG" },
      orderBy: { publishedAt: "desc" },
    })
  ).map((p) => postView(p, locale));

  const [featured, ...rest] = posts;

  return (
    <div className="shell py-16">
      <SectionHeading eyebrow={t.blog.eyebrow} title={t.blog.title} lead={t.blog.lead} />

      {posts.length === 0 ? (
        <div className="mt-12">
          <EmptyState title={t.blog.emptyTitle} lead={t.blog.emptyLead} />
        </div>
      ) : (
        <>
          <Link
            href={`/blog/${featured.slug}`}
            className="card-soft mt-12 block p-8 transition-transform hover:-translate-y-1 sm:p-12"
          >
            <p className="eyebrow text-rose">{featured.tag}</p>
            <h2 className="mt-4 max-w-3xl font-[family-name:var(--font-display)] text-3xl leading-tight text-balance sm:text-4xl">
              {featured.title}
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">{featured.excerpt}</p>
            <p className="mt-6 text-xs text-muted">
              {shortDate(featured.publishedAt, locale)} · {featured.readMinutes} {t.blog.readTime}
            </p>
          </Link>

          {rest.length > 0 ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => (
                <Link
                  key={p.id}
                  href={`/blog/${p.slug}`}
                  className="card-soft flex flex-col p-6 transition-transform hover:-translate-y-1"
                >
                  <p className="eyebrow text-rose">{p.tag}</p>
                  <h3 className="mt-3 font-[family-name:var(--font-display)] text-xl leading-snug">
                    {p.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">{p.excerpt}</p>
                  <p className="mt-5 text-xs text-muted">
                    {shortDate(p.publishedAt, locale)} · {p.readMinutes} {t.common.minutes}
                  </p>
                </Link>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
