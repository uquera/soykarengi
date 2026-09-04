import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { money, shortDate } from "@/lib/format";
import { getDict, getLocale } from "@/lib/i18n";
import { designName } from "@/lib/content";
import { approveQuoteAction, cancelRequestAction } from "@/lib/actions/designs";
import { ButtonLink, EmptyState, Badge } from "@/components/ui";
import { RequestTimeline, StatusPill } from "@/components/request-timeline";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Mis diseños" };

export default async function MisDisenosPage({
  searchParams,
}: {
  searchParams: Promise<{ nueva?: string }>;
}) {
  const [user, locale, t, { nueva }] = await Promise.all([
    requireUser(),
    getLocale(),
    getDict(),
    searchParams,
  ]);

  const requests = await db.designRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { design: true, attachments: true, deliverables: true },
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-moss-deep">{t.home.unit02}</p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">
            {t.space.designs.title}
          </h1>
          <p className="mt-2 text-ink-soft">{t.space.designs.lead}</p>
        </div>
        <ButtonLink href="/configurador" tone="moss">
          {t.space.designs.newRequest}
        </ButtonLink>
      </header>

      {nueva ? (
        <div className="rounded-2xl border border-moss/40 bg-moss-soft px-6 py-5">
          <p className="font-semibold text-moss-deep">{t.space.designs.received}</p>
          <p className="mt-1 text-sm text-ink-soft">
            {t.space.code} {nueva}. {t.space.designs.receivedLead}
          </p>
        </div>
      ) : null}

      {requests.length === 0 ? (
        <EmptyState
          title={t.space.designs.emptyTitle}
          lead={t.space.designs.emptyLead}
          action={
            <ButtonLink href="/configurador" tone="moss" className="mt-2">
              {t.space.designs.emptyCta}
            </ButtonLink>
          }
        />
      ) : (
        <div className="space-y-5">
          {requests.map((r) => (
            <article key={r.id} className="card-soft p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={r.status} labels={t.status.request} />
                    <Badge tone="muted">{t.vocab.purposes[r.purpose] ?? r.purpose}</Badge>
                    <Badge tone="muted">{t.vocab.formats[r.format] ?? r.format}</Badge>
                  </div>
                  <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl leading-snug">
                    {designName(r.design, locale, t.space.designs.fromScratch)}
                  </h2>
                  <p className="mt-1.5 text-sm text-ink-soft">{r.recipient}</p>
                  <p className="mt-1 text-xs text-muted">
                    {r.code} · {t.space.designs.requestedOn} {shortDate(r.createdAt, locale)}
                    {r.eventDate ? ` · ${t.space.designs.event} ${shortDate(r.eventDate, locale)}` : ""}
                  </p>
                </div>

                {r.quoteAmount ? (
                  <div className="text-right">
                    <p className="text-xs text-muted">{t.space.designs.quote}</p>
                    <p className="font-[family-name:var(--font-display)] text-2xl">
                      {money(r.quoteAmount, locale)}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="mt-6">
                <RequestTimeline
                  status={r.status}
                  labels={t.status.request}
                  cancelledText={t.status.cancelled}
                  copy={{
                    title: t.status.trackerTitle,
                    step: t.status.trackerStep,
                    of: t.status.trackerOf,
                    done: t.status.trackerDone,
                  }}
                />
              </div>

              <div className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
                <div>
                  <p className="text-[0.6875rem] font-semibold tracking-wide text-muted uppercase">
                    {t.space.designs.yourIdea}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{r.idea}</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[0.6875rem] font-semibold tracking-wide text-muted uppercase">
                      {t.space.designs.conveys}
                    </p>
                    <p className="mt-1.5 text-sm text-ink-soft">
                      {r.emotions
                        .split(",")
                        .map((e) => t.vocab.emotions[e] ?? e)
                        .join(" · ")}
                    </p>
                  </div>
                  {r.attachments.length > 0 ? (
                    <div>
                      <p className="text-[0.6875rem] font-semibold tracking-wide text-muted uppercase">
                        {t.space.designs.references}
                      </p>
                      <p className="mt-1.5 text-sm text-ink-soft">
                        {r.attachments.map((a) => a.name).join(", ")}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              {r.status === "COTIZADA" ? (
                <div className="mt-6 rounded-2xl border border-amber/40 bg-amber/10 p-5">
                  <p className="font-semibold text-amber-ink">{t.space.designs.quoteSent}</p>
                  {r.quoteNotes ? (
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{r.quoteNotes}</p>
                  ) : null}
                  <div className="mt-5 flex flex-wrap gap-3">
                    <form action={approveQuoteAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <button
                        type="submit"
                        className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-ink-soft"
                      >
                        {t.space.designs.approve}
                      </button>
                    </form>
                    <form action={cancelRequestAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-muted transition-colors hover:border-rose/50 hover:text-rose-deep"
                      >
                        {t.space.designs.decline}
                      </button>
                    </form>
                  </div>
                </div>
              ) : null}

              {r.deliverables.length > 0 ? (
                <div className="mt-6 rounded-2xl border border-orchid/30 bg-orchid-soft/60 p-5">
                  <p className="font-semibold text-orchid-deep">{t.space.designs.deliveredFiles}</p>
                  <ul className="mt-3 space-y-2">
                    {r.deliverables.map((d) => (
                      <li key={d.id}>
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-orchid-deep underline underline-offset-2"
                        >
                          {d.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
