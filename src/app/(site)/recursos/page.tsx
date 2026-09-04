import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getDict, getLocale } from "@/lib/i18n";
import { postView } from "@/lib/content";
import { EmptyState, SectionHeading, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return {
    title: t.resources.title,
    description: t.resources.lead,
    alternates: { canonical: "/recursos" },
  };
}

/**
 * Recursos es el hub de contenidos: el menú se redujo a cinco entradas y el
 * blog dejó de tener su propio ítem, así que entra aquí. Las dos cosas son
 * lectura y se buscan en el mismo momento.
 */
export default async function RecursosPage() {
  const [locale, t] = await Promise.all([getLocale(), getDict()]);

  const [resourcesRaw, postsRaw] = await Promise.all([
    db.post.findMany({ where: { published: true, kind: "RECURSO" }, orderBy: { publishedAt: "desc" } }),
    db.post.findMany({
      where: { published: true, kind: "BLOG" },
      orderBy: { publishedAt: "desc" },
      take: 4,
    }),
  ]);

  const resources = resourcesRaw.map((p) => postView(p, locale));
  const posts = postsRaw.map((p) => postView(p, locale));

  return (
    <div className="shell py-16">
      <SectionHeading eyebrow={t.resources.eyebrow} title={t.resources.title} lead={t.resources.lead} />

      <section className="mt-12">
        <p className="eyebrow mb-5 text-muted">{t.resources.hubResources}</p>
        {resources.length === 0 ? (
          <EmptyState title={t.resources.emptyTitle} lead={t.resources.emptyLead} />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {resources.map((r) => (
              <Link
                key={r.id}
                href={`/blog/${r.slug}`}
                className="card-soft flex flex-col p-7 transition-transform hover:-translate-y-1"
              >
                <span className="self-start">
                  <Badge tone="orchid">{r.tag || t.resources.fallbackTag}</Badge>
                </span>
                <h2 className="mt-4 font-[family-name:var(--font-display)] text-2xl leading-snug">
                  {r.title}
                </h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">{r.excerpt}</p>
                <p className="mt-5 text-xs text-muted">
                  {r.readMinutes} {t.common.minutes}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {posts.length > 0 ? (
        <section className="mt-16 border-t border-line pt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="font-[family-name:var(--font-display)] text-3xl">{t.resources.hubBlog}</h2>
              <p className="mt-2 text-[0.975rem] leading-relaxed text-ink-soft">{t.resources.hubBlogLead}</p>
            </div>
            <Link href="/blog" className="text-[0.8125rem] font-semibold text-ink-soft hover:text-ink">
              {t.resources.allPosts}
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {posts.map((p) => (
              <Link
                key={p.id}
                href={`/blog/${p.slug}`}
                className="card-soft p-6 transition-transform hover:-translate-y-1"
              >
                <p className="eyebrow text-rose">{p.tag}</p>
                <p className="mt-3 font-[family-name:var(--font-display)] text-2xl leading-snug">{p.title}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{p.excerpt}</p>
                <p className="mt-5 text-xs text-muted">
                  {p.readMinutes} {t.blog.readTime}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
