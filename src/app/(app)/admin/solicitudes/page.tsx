import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { money, shortDate } from "@/lib/format";
import { REQUEST_FLOW, REQUEST_LABEL } from "@/lib/domain";
import {
  quoteRequestAction,
  advanceRequestAction,
  addDeliverableAction,
} from "@/lib/actions/designs";
import { Badge, EmptyState, inputClass } from "@/components/ui";
import { RequestTimeline, StatusPill } from "@/components/request-timeline";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Solicitudes" };

const FILTERS = [
  { key: "abiertas", label: "Abiertas" },
  { key: "SOLICITUD", label: "Nuevas" },
  { key: "COTIZADA", label: "Cotizadas" },
  { key: "APROBADA", label: "Aprobadas" },
  { key: "ENTREGADA", label: "Entregadas" },
  { key: "todas", label: "Todas" },
];

export default async function AdminSolicitudesPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>;
}) {
  await requireAdmin();
  const { f = "abiertas" } = await searchParams;

  const where =
    f === "abiertas"
      ? { status: { notIn: ["ENTREGADA", "CANCELADA"] } }
      : f === "todas"
        ? {}
        : { status: f };

  const requests = await db.designRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { user: true, design: true, attachments: true, deliverables: true },
    take: 100,
  });

  return (
    <div className="space-y-7">
      <header>
        <p className="eyebrow text-rose-deep">Unidad Diseños</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">Solicitudes</h1>
        <p className="mt-2 text-ink-soft">Del configurador a la entrega, sin salir de esta pantalla.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <a
            key={filter.key}
            href={`/admin/solicitudes?f=${filter.key}`}
            className={`rounded-full border px-4 py-2 text-[0.8125rem] font-medium transition-colors ${
              f === filter.key ? "border-ink bg-ink text-cream" : "border-line bg-white hover:border-ink/40"
            }`}
          >
            {filter.label}
          </a>
        ))}
      </div>

      {requests.length === 0 ? (
        <EmptyState title="Sin solicitudes en este filtro" lead="Prueba con otro estado." />
      ) : (
        <div className="space-y-5">
          {requests.map((r) => (
            <article key={r.id} className="card-soft p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={r.status} />
                    <Badge tone="muted">{r.purpose}</Badge>
                    <Badge tone="muted">{r.format}</Badge>
                    <Badge tone="muted">
                      {r.quantity} {r.quantity === 1 ? "pieza" : "piezas"}
                    </Badge>
                  </div>

                  <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl leading-snug">
                    {r.design?.name ?? "Diseño desde cero"}
                  </h2>
                  <p className="mt-1.5 text-sm text-ink-soft">
                    {r.user.name} · {r.user.email}
                    {r.user.phone ? ` · ${r.user.phone}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {r.code} · {shortDate(r.createdAt)}
                    {r.eventDate ? ` · evento ${shortDate(r.eventDate)}` : ""}
                  </p>
                </div>

                {r.quoteAmount ? (
                  <div className="text-right">
                    <p className="text-xs text-muted">Cotizado</p>
                    <p className="font-[family-name:var(--font-display)] text-2xl">{money(r.quoteAmount)}</p>
                  </div>
                ) : null}
              </div>

              <div className="mt-6">
                <RequestTimeline status={r.status} />
              </div>

              <div className="mt-6 grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="text-[0.6875rem] font-semibold tracking-wide text-muted uppercase">
                      Para quién
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">{r.recipient}</p>
                  </div>
                  <div>
                    <p className="text-[0.6875rem] font-semibold tracking-wide text-muted uppercase">
                      Qué transmite
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">{r.emotions.split(",").join(" · ")}</p>
                  </div>
                  {r.details ? (
                    <div>
                      <p className="text-[0.6875rem] font-semibold tracking-wide text-muted uppercase">
                        Preferencias
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-soft">{r.details}</p>
                    </div>
                  ) : null}
                  {r.attachments.length > 0 ? (
                    <div>
                      <p className="text-[0.6875rem] font-semibold tracking-wide text-muted uppercase">
                        Referencias del cliente
                      </p>
                      <p className="mt-1 text-sm text-ink-soft">
                        {r.attachments.map((a) => a.name).join(", ")}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-xl bg-shell/70 p-4">
                  <p className="text-[0.6875rem] font-semibold tracking-wide text-muted uppercase">
                    Su idea, en sus palabras
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{r.idea}</p>
                </div>
              </div>

              {/* Cotizar */}
              <form action={quoteRequestAction} className="mt-6 grid gap-3 border-t border-line pt-5 sm:grid-cols-[10rem_1fr_auto]">
                <input type="hidden" name="id" value={r.id} />
                <input
                  name="quoteAmount"
                  type="number"
                  min={1}
                  defaultValue={r.quoteAmount ?? ""}
                  placeholder="Monto"
                  className={inputClass}
                />
                <input
                  name="quoteNotes"
                  defaultValue={r.quoteNotes ?? ""}
                  placeholder="Qué incluye la cotización…"
                  className={inputClass}
                />
                <button
                  type="submit"
                  className="rounded-full bg-rose px-5 py-2.5 text-[0.8125rem] font-semibold text-white transition-colors hover:bg-rose-deep"
                >
                  {r.quoteAmount ? "Actualizar cotización" : "Enviar cotización"}
                </button>
              </form>

              {/* Avanzar el pipeline */}
              <form action={advanceRequestAction} className="mt-3 flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={r.id} />
                <select name="status" defaultValue={r.status} className={`${inputClass} w-auto py-2`}>
                  {[...REQUEST_FLOW, "CANCELADA"].map((s) => (
                    <option key={s} value={s}>
                      {REQUEST_LABEL[s]}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-full bg-ink px-5 py-2.5 text-[0.8125rem] font-semibold text-cream transition-colors hover:bg-ink-soft"
                >
                  Cambiar estado
                </button>
              </form>

              {/* Entregables */}
              <div className="mt-5 border-t border-line pt-5">
                <p className="text-[0.6875rem] font-semibold tracking-wide text-muted uppercase">
                  Archivos entregados
                </p>
                {r.deliverables.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {r.deliverables.map((d) => (
                      <li key={d.id}>
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-full border border-orchid/30 bg-orchid-soft px-3.5 py-1.5 text-[0.75rem] font-semibold text-orchid-deep"
                        >
                          {d.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <form action={addDeliverableAction} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1.5fr_auto]">
                  <input type="hidden" name="requestId" value={r.id} />
                  <input name="name" placeholder="Nombre del archivo" className={inputClass} />
                  <input name="url" placeholder="https://enlace-al-archivo" className={inputClass} />
                  <button
                    type="submit"
                    className="rounded-full border border-line px-5 py-2.5 text-[0.8125rem] font-semibold text-ink-soft transition-colors hover:border-ink/40"
                  >
                    Adjuntar
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
