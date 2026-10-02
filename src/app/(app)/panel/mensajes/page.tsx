import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { cuandoHumano, whatsappDe } from "@/lib/simple";
import { toggleMessageAction } from "@/lib/actions/admin";
import { FormAccion } from "@/components/form-accion";
import { BTN, Encabezado, Seccion, Vacio } from "@/components/panel-sencillo-ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Mensajes" };

const UNIDAD: Record<string, string> = {
  Acompañamiento: "Sobre acompañamiento",
  Diseños: "Sobre diseños",
  General: "Consulta general",
};

/** Lo que llega desde el formulario de contacto: nuevos arriba, atendidos abajo. */
export default async function MensajesPage() {
  await requireAdmin();
  const [nuevos, atendidos] = await Promise.all([
    db.contactMessage.findMany({ where: { handled: false }, orderBy: { createdAt: "asc" } }),
    db.contactMessage.findMany({ where: { handled: true }, orderBy: { createdAt: "desc" }, take: 15 }),
  ]);

  return (
    <div className="space-y-8">
      <Encabezado titulo="Mensajes" bajada="Lo que te escriben desde la web. Responde por WhatsApp o por correo." />

      {nuevos.length === 0 ? (
        <Vacio titulo="No tienes mensajes nuevos" />
      ) : (
        <Seccion titulo={`Nuevos · ${nuevos.length}`}>
          {nuevos.map((m) => {
            const whatsapp = whatsappDe(m.phone);
            return (
              <article key={m.id} className="rounded-2xl border border-line border-l-4 border-l-orchid bg-white p-5 sm:p-6">
                <p className="text-[0.875rem] font-semibold text-muted">
                  {UNIDAD[m.unit] ?? m.unit} · {cuandoHumano(m.createdAt)}
                </p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-[1.375rem] text-ink">{m.name}</p>
                <p className="mt-3 text-[1.0625rem] leading-relaxed whitespace-pre-line text-ink">{m.message}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {whatsapp ? (
                    <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener" className={BTN.confirmar}>
                      WhatsApp
                    </a>
                  ) : null}
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent("Respuesta de Karen Ramos")}`} className={BTN.secundario}>
                    Responder por correo
                  </a>
                  <FormAccion action={toggleMessageAction} className="flex flex-1">
                    <input type="hidden" name="id" value={m.id} />
                    <button type="submit" className={BTN.secundario}>
                      Ya lo atendí
                    </button>
                  </FormAccion>
                </div>
              </article>
            );
          })}
        </Seccion>
      )}

      {atendidos.length > 0 ? (
        <Seccion titulo="Ya atendidos">
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
            {atendidos.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink-soft">{m.name}</span>
                  <span className="block truncate text-[0.9375rem] text-muted">{m.message}</span>
                </span>
                <FormAccion action={toggleMessageAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className="shrink-0 text-[0.875rem] font-semibold text-muted underline underline-offset-4">
                    Volver a nuevos
                  </button>
                </FormAccion>
              </li>
            ))}
          </ul>
        </Seccion>
      ) : null}

    </div>
  );
}
