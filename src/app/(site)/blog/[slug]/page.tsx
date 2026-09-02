import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { shortDate } from "@/lib/format";
import { getDict, getLocale } from "@/lib/i18n";
import { postView } from "@/lib/content";
import { ButtonLink } from "@/components/ui";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [locale, raw] = await Promise.all([getLocale(), db.post.findUnique({ where: { slug } })]);
  if (!raw) return { title: "404" };
  const post = postView(raw, locale);
  return { title: post.title, description: post.excerpt };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const [locale, t] = await Promise.all([getLocale(), getDict()]);

  const raw = await db.post.findUnique({ where: { slug } });
  if (!raw || !raw.published) notFound();

  const post = postView(raw, locale);
  const isResource = post.kind === "RECURSO";

  return (
    <article className="shell max-w-3xl py-16">
      <Link href={isResource ? "/recursos" : "/blog"} className="text-[0.8125rem] text-muted hover:text-ink">
        ← {isResource ? t.resources.title : t.blog.title}
      </Link>

      <p className="eyebrow mt-8 text-rose">{post.tag}</p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl leading-[1.12] text-balance sm:text-5xl">
        {post.title}
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-ink-soft">{post.excerpt}</p>
      <p className="mt-6 border-b border-line pb-6 text-xs text-muted">
        {shortDate(post.publishedAt, locale)} · {post.readMinutes} {t.blog.readTime} · {t.brand.name}
      </p>

      <div className="mt-9 space-y-5 text-[1.0625rem] leading-[1.75] text-ink-soft">
        {post.content
          .split("\n")
          .map((p) => p.trim())
          .filter(Boolean)
          .map((p, i) =>
            p.startsWith("## ") ? (
              <h2 key={i} className="pt-4 font-[family-name:var(--font-display)] text-2xl text-ink">
                {p.slice(3)}
              </h2>
            ) : (
              <p key={i}>{p}</p>
            ),
          )}
      </div>

      <div className="mt-14 rounded-3xl border border-line bg-shell/70 px-8 py-10 text-center">
        <p className="font-[family-name:var(--font-display)] text-2xl text-balance">{t.blog.ctaTitle}</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">{t.blog.ctaLead}</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/acompanamiento/agenda" tone="orchid">
            {t.blog.ctaA}
          </ButtonLink>
          <ButtonLink href="/configurador" tone="ghost">
            {t.blog.ctaB}
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}
