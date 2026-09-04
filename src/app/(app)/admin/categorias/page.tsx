import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { CATEGORY_GROUPS } from "@/lib/domain";
import { deleteCategoryAction } from "@/lib/actions/admin";
import { Badge } from "@/components/ui";
import { CategoryForm } from "./category-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Categorías" };

export default async function AdminCategoriasPage() {
  await requireAdmin();

  const categories = await db.designCategory.findMany({
    orderBy: [{ group: "asc" }, { order: "asc" }],
    include: { _count: { select: { designs: true } } },
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-moss-deep">Unidad Diseños</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">Categorías</h1>
        <p className="mt-2 text-ink-soft">
          Los tres grupos de la vitrina: Eventos, Personal y Con propósito.
        </p>
      </header>

      <section className="card-soft p-6">
        <p className="eyebrow mb-4 text-muted">Nueva categoría</p>
        <CategoryForm />
      </section>

      {CATEGORY_GROUPS.map((group) => {
        const items = categories.filter((c) => c.group === group.key);
        return (
          <section key={group.key}>
            <h2 className="eyebrow mb-3 text-muted">
              {group.name} · {items.length}
            </h2>

            {items.length === 0 ? (
              <p className="card-soft px-6 py-5 text-sm text-muted">Sin categorías en este grupo.</p>
            ) : (
              <div className="space-y-3">
                {items.map((c) => (
                  <div key={c.id} className="card-soft p-5">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{c.name}</span>
                        <Badge tone="muted">{c._count.designs} diseños</Badge>
                        {!c.active ? <Badge tone="muted">Oculta</Badge> : null}
                      </div>
                      <form action={deleteCategoryAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-line px-4 py-1.5 text-[0.75rem] text-muted transition-colors hover:border-rose/50 hover:text-rose-deep"
                        >
                          {c._count.designs > 0 ? "Ocultar" : "Eliminar"}
                        </button>
                      </form>
                    </div>
                    <CategoryForm category={c} />
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
