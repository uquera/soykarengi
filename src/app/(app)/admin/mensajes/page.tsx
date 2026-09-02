import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { dateTime } from "@/lib/format";
import { toggleMessageAction } from "@/lib/actions/admin";
import { Badge, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Mensajes" };

export default async function AdminMensajesPage() {
  await requireAdmin();

  const messages = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div className="space-y-7">
      <header>
        <p className="eyebrow text-muted">Transversal</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">Mensajes</h1>
        <p className="mt-2 text-ink-soft">Lo que llega desde el formulario de contacto.</p>
      </header>

      {messages.length === 0 ? (
        <EmptyState title="Sin mensajes" lead="Cuando alguien escriba desde la web, aparecerá aquí." />
      ) : (
        <div className="space-y-4">
          {messages.map((m) => (
            <article key={m.id} className={`card-soft p-6 ${m.handled ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={m.unit === "Acompañamiento" ? "orchid" : m.unit === "Diseños" ? "rose" : "neutral"}>
                      {m.unit}
                    </Badge>
                    {m.handled ? <Badge tone="muted">Atendido</Badge> : null}
                  </div>
                  <p className="mt-2 font-semibold">{m.name}</p>
                  <p className="mt-0.5 text-[0.8125rem] text-muted">
                    {m.email}
                    {m.phone ? ` · ${m.phone}` : ""} · {dateTime(m.createdAt)}
                  </p>
                </div>

                <form action={toggleMessageAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-line px-4 py-2 text-[0.8125rem] font-semibold text-ink-soft transition-colors hover:border-ink/40"
                  >
                    {m.handled ? "Reabrir" : "Marcar atendido"}
                  </button>
                </form>
              </div>

              <p className="mt-4 rounded-xl bg-shell/70 px-4 py-3 text-sm leading-relaxed text-ink-soft">
                {m.message}
              </p>

              <a
                href={`mailto:${m.email}?subject=Respuesta a tu mensaje`}
                className="mt-4 inline-block text-[0.8125rem] font-semibold underline underline-offset-2"
              >
                Responder por correo
              </a>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
