import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getDict, getLocale } from "@/lib/i18n";
import { postView } from "@/lib/content";
import { EmptyState, SectionHeading, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return { title: t.resources.title, description: t.resources.lead };
}

export default async function RecursosPage() {
  const [locale, t] = await Promise.all([getLocale(), getDict()]);

  const resources = (
    await db.post.findMany({
      where: { published: true, kind: "RECURSO" },
      orderBy: { publishedAt: "desc" },
    })
  ).map((p) => postView(p, locale));

  return (
    <div className="shell py-16">
      <SectionHeading eyebrow={t.resources.eyebrow} title={t.resources.title} lead={t.resources.lead} />

      {resources.length === 0 ? (
        <div className="mt-12">
          <EmptyState title={t.resources.emptyTitle} lead={t.resources.emptyLead} />
        </div>
      ) : (
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {resources.map((r) => (
            <Link
              key={r.id}
              href={`/blog/${r.slug}`}
              className="card-soft flex flex-col p-7 transition-transform hover:-translate-y-1"
            >
              <span className="self-start">
                <Badge tone="sage">{r.tag || t.resources.fallbackTag}</Badge>
              </span>
              <h2 className="mt-4 font-[family-name:var(--font-display)] text-2xl leading-snug">{r.title}</h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">{r.excerpt}</p>
              <p className="mt-5 text-xs text-muted">
                {r.readMinutes} {t.common.minutes}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
