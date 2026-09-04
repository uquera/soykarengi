import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { shortDate } from "@/lib/format";
import { getDict, getLocale } from "@/lib/i18n";
import { designName } from "@/lib/content";
import { EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Mis archivos" };

export default async function MisArchivosPage() {
  const [user, locale, t] = await Promise.all([requireUser(), getLocale(), getDict()]);

  const files = await db.deliverable.findMany({
    where: { request: { userId: user.id } },
    orderBy: { createdAt: "desc" },
    include: { request: { include: { design: true } } },
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-moss-deep">{t.space.files.eyebrow}</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">
          {t.space.files.title}
        </h1>
        <p className="mt-2 text-ink-soft">{t.space.files.lead}</p>
      </header>

      {files.length === 0 ? (
        <EmptyState title={t.space.files.emptyTitle} lead={t.space.files.emptyLead} />
      ) : (
        <div className="card-soft divide-y divide-line">
          {files.map((f) => (
            <div key={f.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
              <div className="min-w-0">
                <p className="font-semibold">{f.name}</p>
                <p className="mt-0.5 text-[0.8125rem] text-muted">
                  {designName(f.request.design, locale, t.space.files.custom)} · {f.request.code} ·{" "}
                  {shortDate(f.createdAt, locale)}
                </p>
              </div>
              <a
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-ink px-5 py-2.5 text-[0.8125rem] font-semibold text-cream transition-colors hover:bg-ink-soft"
              >
                {t.space.files.download}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
