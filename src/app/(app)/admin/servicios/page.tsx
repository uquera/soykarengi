import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { money, duration } from "@/lib/format";
import { deleteServiceAction } from "@/lib/actions/admin";
import { Badge, ButtonLink, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Servicios" };

export default async function AdminServiciosPage() {
  await requireAdmin();

  const services = await db.service.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { appointments: true } } },
  });

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-sage-deep">Unidad Servicios</p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">Servicios</h1>
        </div>
        <ButtonLink href="/admin/servicios/nuevo" tone="ink">
          Nuevo servicio
        </ButtonLink>
      </header>

      {services.length === 0 ? (
        <EmptyState title="No hay servicios cargados" lead="Crea el primero para que aparezca en la web." />
      ) : (
        <div className="card-soft divide-y divide-line">
          {services.map((s) => (
            <div key={s.id} className="grid gap-4 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span>{s.accentEmoji}</span>
                  <Badge tone="sage">{s.specialty}</Badge>
                  {!s.active ? <Badge tone="muted">Archivado</Badge> : null}
                </div>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl">{s.name}</p>
                <p className="mt-1 text-[0.8125rem] text-muted">
                  {duration(s.durationMin)} · {s.modality} · {money(s.price)} · {s._count.appointments} citas
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/acompanamiento/servicios/${s.slug}`}
                  className="rounded-full border border-line px-4 py-2 text-[0.8125rem] text-ink-soft transition-colors hover:border-ink/40"
                >
                  Ver
                </Link>
                <Link
                  href={`/admin/servicios/${s.id}`}
                  className="rounded-full bg-ink px-4 py-2 text-[0.8125rem] font-semibold text-cream transition-colors hover:bg-ink-soft"
                >
                  Editar
                </Link>
                <form action={deleteServiceAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-line px-4 py-2 text-[0.8125rem] text-muted transition-colors hover:border-clay/50 hover:text-clay-deep"
                  >
                    {s._count.appointments > 0 ? "Archivar" : "Eliminar"}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
