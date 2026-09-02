import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { money } from "@/lib/format";
import { getDict, getLocale } from "@/lib/i18n";
import { designView } from "@/lib/content";
import { toggleFavoriteAction } from "@/lib/actions/designs";
import { ButtonLink, EmptyState } from "@/components/ui";
import { DesignVisual } from "@/components/design-visual";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Mis favoritos" };

export default async function MisFavoritosPage() {
  const [user, locale, t] = await Promise.all([requireUser(), getLocale(), getDict()]);

  const favorites = await db.favorite.findMany({
    where: { userId: user.id },
    include: { design: { include: { category: true } } },
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-rose-deep">{t.space.favorites.eyebrow}</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">
          {t.space.favorites.title}
        </h1>
        <p className="mt-2 text-ink-soft">{t.space.favorites.lead}</p>
      </header>

      {favorites.length === 0 ? (
        <EmptyState
          title={t.space.favorites.emptyTitle}
          lead={t.space.favorites.emptyLead}
          action={
            <ButtonLink href="/disenos" tone="rose" className="mt-2">
              {t.space.favorites.emptyCta}
            </ButtonLink>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((f) => {
            const d = designView(f.design, locale);
            return (
              <div key={f.id} className="card-soft overflow-hidden">
                <Link href={`/disenos/${d.slug}`}>
                  <DesignVisual slug={d.slug} palette={d.palette} label={d.categoryName} image={d.image} alt={d.name} className="h-40" />
                </Link>
                <div className="p-5">
                  <Link href={`/disenos/${d.slug}`}>
                    <p className="font-[family-name:var(--font-display)] text-lg leading-snug">{d.name}</p>
                  </Link>
                  <p className="mt-2 text-[0.8125rem] text-muted">
                    {t.space.favorites.from} {money(d.basePrice, locale)}
                  </p>

                  <div className="mt-4 flex gap-2">
                    <ButtonLink
                      href={`/configurador?diseno=${d.slug}`}
                      tone="rose"
                      className="flex-1 px-4 py-2 text-[0.8125rem]"
                    >
                      {t.space.favorites.customize}
                    </ButtonLink>
                    <form action={toggleFavoriteAction}>
                      <input type="hidden" name="designId" value={d.id} />
                      <button
                        type="submit"
                        title={t.space.favorites.remove}
                        className="rounded-full border border-line px-3.5 py-2 text-sm text-muted transition-colors hover:border-rose/50 hover:text-rose-deep"
                      >
                        ♥
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
