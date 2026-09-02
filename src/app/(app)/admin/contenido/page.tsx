import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { shortDate } from "@/lib/format";
import { deletePostAction } from "@/lib/actions/admin";
import { Badge, ButtonLink, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Contenido" };

export default async function AdminContenidoPage() {
  await requireAdmin();

  const posts = await db.post.findMany({ orderBy: { publishedAt: "desc" } });
  const blog = posts.filter((p) => p.kind === "BLOG");
  const recursos = posts.filter((p) => p.kind === "RECURSO");

  const sections = [
    { title: "Blog", items: blog },
    { title: "Recursos", items: recursos },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-muted">Transversal</p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">Contenido</h1>
        </div>
        <ButtonLink href="/admin/contenido/nuevo" tone="ink">
          Nueva entrada
        </ButtonLink>
      </header>

      {posts.length === 0 ? (
        <EmptyState title="Todavía no hay contenido" lead="Publica la primera entrada del blog o un recurso." />
      ) : (
        sections.map((section) => (
          <section key={section.title}>
            <h2 className="eyebrow mb-3 text-muted">
              {section.title} · {section.items.length}
            </h2>

            {section.items.length === 0 ? (
              <p className="card-soft px-6 py-5 text-sm text-muted">Sin entradas.</p>
            ) : (
              <div className="card-soft divide-y divide-line">
                {section.items.map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{p.title}</span>
                        {!p.published ? <Badge tone="muted">Borrador</Badge> : null}
                      </div>
                      <p className="mt-0.5 text-[0.8125rem] text-muted">
                        {p.tag || "Sin etiqueta"} · {shortDate(p.publishedAt)} · {p.readMinutes} min
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/blog/${p.slug}`}
                        className="rounded-full border border-line px-4 py-2 text-[0.8125rem] text-ink-soft transition-colors hover:border-ink/40"
                      >
                        Ver
                      </Link>
                      <Link
                        href={`/admin/contenido/${p.id}`}
                        className="rounded-full bg-ink px-4 py-2 text-[0.8125rem] font-semibold text-cream transition-colors hover:bg-ink-soft"
                      >
                        Editar
                      </Link>
                      <form action={deletePostAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-line px-4 py-2 text-[0.8125rem] text-muted transition-colors hover:border-rose/50 hover:text-rose-deep"
                        >
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))
      )}
    </div>
  );
}
