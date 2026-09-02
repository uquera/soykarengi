import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/format";
import { deleteDesignAction } from "@/lib/actions/admin";
import { Badge, ButtonLink, EmptyState } from "@/components/ui";
import { DesignVisual } from "@/components/design-visual";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Diseños" };

export default async function AdminDisenosPage() {
  await requireAdmin();

  const designs = await db.design.findMany({
    orderBy: [{ featured: "desc" }, { order: "asc" }],
    include: { category: true, _count: { select: { requests: true, favorites: true } } },
  });

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-rose-deep">Unidad Diseños</p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">Diseños</h1>
        </div>
        <ButtonLink href="/admin/disenos/nuevo" tone="ink">
          Nuevo diseño
        </ButtonLink>
      </header>

      {designs.length === 0 ? (
        <EmptyState title="No hay diseños cargados" lead="Crea la primera pieza para la vitrina." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {designs.map((d) => (
            <article key={d.id} className="card-soft overflow-hidden">
              <DesignVisual slug={d.slug} palette={d.palette} label={d.category.name} image={d.image} alt={d.name} className="h-36" />
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  {d.featured ? <Badge tone="amber">Destacado</Badge> : null}
                  {!d.active ? <Badge tone="muted">Oculto</Badge> : null}
                </div>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl leading-snug">{d.name}</p>
                <p className="mt-1 text-[0.8125rem] text-muted">
                  {money(d.basePrice)} · {d._count.requests} solicitudes · {d._count.favorites} favoritos
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/disenos/${d.slug}`}
                    className="rounded-full border border-line px-4 py-2 text-[0.8125rem] text-ink-soft transition-colors hover:border-ink/40"
                  >
                    Ver
                  </Link>
                  <Link
                    href={`/admin/disenos/${d.id}`}
                    className="rounded-full bg-ink px-4 py-2 text-[0.8125rem] font-semibold text-cream transition-colors hover:bg-ink-soft"
                  >
                    Editar
                  </Link>
                  <form action={deleteDesignAction}>
                    <input type="hidden" name="id" value={d.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-line px-4 py-2 text-[0.8125rem] text-muted transition-colors hover:border-rose/50 hover:text-rose-deep"
                    >
                      {d._count.requests > 0 ? "Ocultar" : "Eliminar"}
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
