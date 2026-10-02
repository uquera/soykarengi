import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { money, shortDate } from "@/lib/format";
import { iconoArchivo, urlArchivo } from "@/lib/archivos";
import { PASO_LABEL, pasoPedido, primerNombre, whatsappDe, type PasoPedido } from "@/lib/simple";
import { advanceRequestAction, cancelRequestAction, quoteRequestAction } from "@/lib/actions/designs";
import { FormAccion } from "@/components/form-accion";
import { FileUploader } from "@/components/file-uploader";
import { ArchivoList } from "@/components/archivo-list";
import { BTN, Encabezado } from "@/components/panel-sencillo-ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Pedido" };

const PASOS: PasoPedido[] = ["NUEVO", "ESPERANDO", "PREPARANDO", "ENTREGADO"];

/** Un pedido de diseño: lo que pidió la clienta y el único paso que toca. */
export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const r = await db.designRequest.findUnique({
    where: { id },
    include: { user: true, design: true, attachments: true, archivos: { orderBy: { createdAt: "asc" } } },
  });
  if (!r) notFound();

  const paso = pasoPedido(r.status);
  const nombre = primerNombre(r.user.name);
  const titulo = r.design?.name ?? `Diseño para ${r.recipient}`;
  const fotos = r.archivos.filter((a) => a.tipo === "REFERENCIA");
  const entregables = r.archivos.filter((a) => a.tipo === "ENTREGABLE");
  const whatsapp = whatsappDe(r.user.phone);
  const indice = PASOS.indexOf(paso);

  return (
    <div className="space-y-6">
      <Encabezado titulo={titulo} bajada={`Pedido de ${r.user.name}`} volver={{ href: "/panel", label: "Hoy" }} />

      {/* Los cuatro pasos, con el actual marcado */}
      {paso !== "CANCELADO" ? (
        <ol className="grid grid-cols-4 gap-1.5">
          {PASOS.map((p, i) => (
            <li
              key={p}
              className={`rounded-xl px-2 py-2.5 text-center text-[0.8125rem] font-semibold leading-tight sm:text-[0.9375rem] ${
                i < indice ? "bg-moss-soft text-moss-deep" : i === indice ? "bg-ink text-cream" : "bg-shell text-muted"
              }`}
            >
              {PASO_LABEL[p]}
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-2xl bg-shell px-5 py-4 text-[1rem] text-muted">Este pedido se canceló.</p>
      )}

      {/* ── Lo que toca ahora ─────────────────────────────────────────── */}
      {paso === "NUEVO" || r.status === "COTIZADA" ? (
        <section className="rounded-2xl border-2 border-ink/80 bg-white p-6">
          <p className="font-[family-name:var(--font-display)] text-[1.5rem] text-ink">
            {r.status === "COTIZADA" ? "Le enviaste un precio" : "Ponerle precio"}
          </p>
          <p className="mt-1 text-[1rem] text-ink-soft">
            {r.status === "COTIZADA"
              ? `Le enviaste ${money(r.quoteAmount)}. Esperando que ${nombre} lo apruebe; si quieres, puedes cambiarlo.`
              : `Escribe cuánto cuesta y qué incluye. A ${nombre} le llega un correo para aprobarlo.`}
          </p>
          <FormAccion action={quoteRequestAction} okMensaje={`Listo, ${nombre} ya tiene el precio.`} className="mt-4 space-y-4">
            <input type="hidden" name="id" value={r.id} />
            <label className="block">
              <span className="text-[1rem] font-semibold text-ink">Precio en dólares</span>
              <div className="mt-2 flex items-center rounded-xl border border-line bg-white px-4">
                <span className="text-[1.375rem] text-muted">$</span>
                <input
                  name="quoteAmount"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  required
                  defaultValue={r.quoteAmount ?? ""}
                  className="w-full bg-transparent px-2 py-3 text-[1.5rem] font-semibold outline-none"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-[1rem] font-semibold text-ink">¿Qué incluye?</span>
              <textarea
                name="quoteNotes"
                rows={3}
                defaultValue={r.quoteNotes ?? ""}
                placeholder="Por ejemplo: 2 tazas impresas, entrega en 10 días."
                className="mt-2 w-full rounded-xl border border-line px-4 py-3 text-[1.0625rem]"
              />
            </label>
            <button type="submit" className={`${BTN.principal} w-full`}>
              {r.status === "COTIZADA" ? "Cambiar el precio" : "Enviar precio"}
            </button>
          </FormAccion>
        </section>
      ) : null}

      {r.status === "APROBADA" ? (
        <section className="rounded-2xl border-2 border-ink/80 bg-white p-6">
          <p className="font-[family-name:var(--font-display)] text-[1.5rem] text-ink">
            {nombre} aprobó {money(r.quoteAmount)}
          </p>
          <p className="mt-1 text-[1rem] text-ink-soft">Cuando te pague, márcalo y el pedido pasa a preparación.</p>
          <FormAccion
            action={advanceRequestAction}
            confirmar={`¿${nombre} ya te pagó ${money(r.quoteAmount)}?`}
            className="mt-4 flex"
          >
            <input type="hidden" name="id" value={r.id} />
            <input type="hidden" name="status" value="PAGADA" />
            <button type="submit" className={BTN.principal}>
              Ya me pagó
            </button>
          </FormAccion>
        </section>
      ) : null}

      {paso === "PREPARANDO" ? (
        <section className="rounded-2xl border-2 border-ink/80 bg-white p-6">
          <p className="font-[family-name:var(--font-display)] text-[1.5rem] text-ink">En preparación</p>
          <p className="mt-1 text-[1rem] text-ink-soft">
            Cuando esté listo, sube los archivos finales y entrégalo. A {nombre} le llega un correo para descargarlos.
          </p>
          <div className="mt-4">
            <FileUploader tipo="ENTREGABLE" requestId={r.id} compacto />
          </div>
          {entregables.length > 0 ? (
            <div className="mt-5">
              <ArchivoList archivos={entregables} puedeBorrar />
            </div>
          ) : null}
          {/* Sin archivos también se puede: una pieza impresa se entrega en mano. */}
          <FormAccion
            action={advanceRequestAction}
            confirmar={
              entregables.length > 0
                ? `¿Entregar el pedido? A ${nombre} le llega un correo con sus archivos.`
                : `¿Marcar el pedido como entregado? No subiste archivos: úsalo si lo entregaste en mano.`
            }
            className="mt-5 flex"
          >
            <input type="hidden" name="id" value={r.id} />
            <input type="hidden" name="status" value="ENTREGADA" />
            <button type="submit" className={BTN.confirmar}>
              {entregables.length > 0 ? "Está listo: entregar" : "Marcar como entregado"}
            </button>
          </FormAccion>
        </section>
      ) : null}

      {paso === "ENTREGADO" ? (
        <section className="rounded-2xl border border-moss/40 bg-moss-soft p-6">
          <p className="font-[family-name:var(--font-display)] text-[1.5rem] text-moss-deep">
            Entregado{r.deliveredAt ? ` el ${shortDate(r.deliveredAt)}` : ""}
          </p>
          {entregables.length > 0 ? (
            <div className="mt-4 rounded-xl bg-white p-4">
              <ArchivoList archivos={entregables} />
            </div>
          ) : null}
        </section>
      ) : null}

      {/* ── Lo que pidió ─────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-line bg-white p-6">
        <p className="text-[0.9375rem] font-semibold text-muted">Lo que pidió</p>
        <p className="mt-2 text-[1.125rem] leading-relaxed whitespace-pre-line text-ink">{r.idea}</p>
        <dl className="mt-4 grid gap-x-6 gap-y-2 text-[1rem] sm:grid-cols-2">
          <div>
            <dt className="text-muted">Para</dt>
            <dd className="text-ink">{r.recipient}</dd>
          </div>
          <div>
            <dt className="text-muted">Cantidad</dt>
            <dd className="text-ink">
              {r.quantity} · {r.format}
            </dd>
          </div>
          {r.eventDate ? (
            <div>
              <dt className="text-muted">Fecha del evento</dt>
              <dd className="text-ink">{shortDate(r.eventDate)}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-muted">Quiere transmitir</dt>
            <dd className="text-ink">{r.emotions.split(",").join(", ")}</dd>
          </div>
        </dl>
        {r.details ? <p className="mt-4 text-[1rem] leading-relaxed whitespace-pre-line text-ink-soft">{r.details}</p> : null}

        {fotos.length > 0 ? (
          <div className="mt-5">
            <p className="text-[0.9375rem] font-semibold text-muted">Fotos que te mandó</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {fotos.map((f) => (
                <li key={f.id}>
                  <a
                    href={urlArchivo(f.id)}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex rounded-xl border border-line px-4 py-2.5 text-[1rem] font-semibold text-ink hover:border-ink/40"
                  >
                    {iconoArchivo(f.mime)} {f.nombre}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {r.attachments.length > 0 ? (
          <p className="mt-4 text-[0.9375rem] text-ink-soft">
            Enlaces: {r.attachments.map((a) => a.name).join(" · ")}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-line bg-white p-6">
        <p className="text-[0.9375rem] font-semibold text-muted">Contacto</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {whatsapp ? (
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener" className={BTN.confirmar}>
              WhatsApp
            </a>
          ) : null}
          <a href={`mailto:${r.user.email}`} className={BTN.secundario}>
            Escribirle un correo
          </a>
          <Link href={`/panel/clientas/${r.userId}`} className={BTN.secundario}>
            Ver su ficha
          </Link>
        </div>
      </section>

      {paso !== "ENTREGADO" && paso !== "CANCELADO" ? (
        <FormAccion
          action={cancelRequestAction}
          confirmar={`¿Cancelar este pedido de ${nombre}?`}
          className="text-center"
        >
          <input type="hidden" name="id" value={r.id} />
          <button type="submit" className="text-[1rem] font-semibold text-rose-deep underline underline-offset-4">
            Ya no va este pedido
          </button>
        </FormAccion>
      ) : null}
    </div>
  );
}
