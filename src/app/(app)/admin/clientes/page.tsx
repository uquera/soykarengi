import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { shortDate } from "@/lib/format";
import { SEGMENT_LABEL, segmentOf } from "@/lib/domain";
import { Badge, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Clientes" };

const SEGMENT_TONE = {
  AMBAS: "amber",
  SERVICIOS: "orchid",
  DISENOS: "rose",
  SIN_ACTIVIDAD: "muted",
} as const;

export default async function AdminClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  await requireAdmin();
  const { s } = await searchParams;

  const users = await db.user.findMany({
    where: { role: "CLIENT" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { appointments: true, designRequests: true } } },
  });

  const enriched = users.map((u) => ({
    ...u,
    segment: segmentOf(u._count.appointments, u._count.designRequests),
  }));

  const filtered = s ? enriched.filter((u) => u.segment === s) : enriched;

  const tally = {
    AMBAS: enriched.filter((u) => u.segment === "AMBAS").length,
    SERVICIOS: enriched.filter((u) => u.segment === "SERVICIOS").length,
    DISENOS: enriched.filter((u) => u.segment === "DISENOS").length,
    SIN_ACTIVIDAD: enriched.filter((u) => u.segment === "SIN_ACTIVIDAD").length,
  };

  return (
    <div className="space-y-7">
      <header>
        <p className="eyebrow text-muted">Transversal</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">Clientes</h1>
        <p className="mt-2 text-ink-soft">
          Una sola base. Un cliente puede llegar por los diseños y quedarse por los servicios.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <a
          href="/admin/clientes"
          className={`rounded-full border px-4 py-2 text-[0.8125rem] font-medium transition-colors ${
            !s ? "border-ink bg-ink text-cream" : "border-line bg-white hover:border-ink/40"
          }`}
        >
          Todos · {enriched.length}
        </a>
        {(Object.keys(tally) as (keyof typeof tally)[]).map((key) => (
          <a
            key={key}
            href={`/admin/clientes?s=${key}`}
            className={`rounded-full border px-4 py-2 text-[0.8125rem] font-medium transition-colors ${
              s === key ? "border-ink bg-ink text-cream" : "border-line bg-white hover:border-ink/40"
            }`}
          >
            {SEGMENT_LABEL[key]} · {tally[key]}
          </a>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Sin clientes en este segmento" lead="Prueba con otro filtro." />
      ) : (
        <div className="card-soft divide-y divide-line">
          {filtered.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{u.name}</span>
                  <Badge tone={SEGMENT_TONE[u.segment]}>{SEGMENT_LABEL[u.segment]}</Badge>
                </div>
                <p className="mt-1 text-[0.8125rem] text-muted">
                  {u.email}
                  {u.phone ? ` · ${u.phone}` : ""}
                  {u.city ? ` · ${u.city}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-6 text-center">
                <div>
                  <p className="font-[family-name:var(--font-display)] text-xl">{u._count.appointments}</p>
                  <p className="text-[0.6875rem] text-muted">citas</p>
                </div>
                <div>
                  <p className="font-[family-name:var(--font-display)] text-xl">{u._count.designRequests}</p>
                  <p className="text-[0.6875rem] text-muted">diseños</p>
                </div>
                <div className="hidden sm:block">
                  <p className="text-[0.8125rem] text-muted">desde</p>
                  <p className="text-[0.8125rem] font-semibold">{shortDate(u.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
