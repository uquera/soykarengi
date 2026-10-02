import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/format";
import { cuandoHumano, diaKaren, primerNombre, whatsappDe } from "@/lib/simple";
import {
  cancelAppointmentAction,
  guardarEnlaceAction,
  saveAppointmentNotesAction,
  setAppointmentStatusAction,
} from "@/lib/actions/booking";
import { FormAccion } from "@/components/form-accion";
import { BTN, Encabezado } from "@/components/panel-sencillo-ui";
import { MoverCita } from "./mover-cita";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Cita" };

const ESTADO: Record<string, { texto: string; clase: string }> = {
  PENDIENTE: { texto: "Por confirmar", clase: "bg-amber/15 text-amber-ink" },
  CONFIRMADA: { texto: "Confirmada", clase: "bg-moss-soft text-moss-deep" },
  COMPLETADA: { texto: "Realizada", clase: "bg-shell text-ink-soft" },
  CANCELADA: { texto: "Cancelada", clase: "bg-shell text-muted" },
};

/** Todo de una cita en una pantalla: quién, cuándo, qué escribió y qué hacer. */
export default async function CitaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const cita = await db.appointment.findUnique({ where: { id }, include: { user: true, service: true } });
  if (!cita) notFound();

  const ahora = new Date();
  const futura = cita.startsAt > ahora;
  const activa = cita.status === "PENDIENTE" || cita.status === "CONFIRMADA";
  const porCerrar = activa && !futura;
  const whatsapp = whatsappDe(cita.user.phone);
  const nombre = primerNombre(cita.user.name);
  const estado = ESTADO[cita.status] ?? ESTADO.PENDIENTE;
  const precio = cita.price ?? cita.service.price;

  return (
    <div className="space-y-6">
      <Encabezado titulo={cita.user.name} volver={{ href: "/panel/agenda", label: "Agenda" }} />

      <section className="rounded-2xl border border-line bg-white p-6">
        <span className={`inline-block rounded-full px-3 py-1 text-[0.875rem] font-semibold ${estado.clase}`}>{estado.texto}</span>
        <p className="mt-3 font-[family-name:var(--font-display)] text-[1.625rem] leading-snug text-ink">
          {cuandoHumano(cita.startsAt)}
        </p>
        <p className="mt-1 text-[1.0625rem] text-ink-soft">
          {cita.service.name} · {cita.modality}
          {precio > 0 ? ` · ${money(precio)}` : ""}
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          {cita.status === "PENDIENTE" && futura ? (
            <FormAccion action={setAppointmentStatusAction} className="flex flex-1">
              <input type="hidden" name="id" value={cita.id} />
              <input type="hidden" name="status" value="CONFIRMADA" />
              <button type="submit" className={BTN.confirmar}>
                Confirmar
              </button>
            </FormAccion>
          ) : null}

          {porCerrar ? (
            <>
              <FormAccion action={setAppointmentStatusAction} className="flex flex-1">
                <input type="hidden" name="id" value={cita.id} />
                <input type="hidden" name="status" value="COMPLETADA" />
                <button type="submit" className={BTN.confirmar}>
                  Sí, se hizo
                </button>
              </FormAccion>
              <FormAccion
                action={setAppointmentStatusAction}
                className="flex flex-1"
                confirmar={`¿Marcar que ${nombre} no vino?`}
              >
                <input type="hidden" name="id" value={cita.id} />
                <input type="hidden" name="status" value="CANCELADA" />
                <button type="submit" className={BTN.secundario}>
                  No se hizo
                </button>
              </FormAccion>
            </>
          ) : null}

          {activa && futura ? <MoverCita id={cita.id} servicioId={cita.serviceId} minimo={diaKaren(ahora)} /> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-6">
        <p className="text-[0.9375rem] font-semibold text-muted">Contacto</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {whatsapp ? (
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener" className={BTN.confirmar}>
              WhatsApp
            </a>
          ) : null}
          <a href={`mailto:${cita.user.email}`} className={BTN.secundario}>
            Escribirle un correo
          </a>
          <Link href={`/panel/clientas/${cita.userId}`} className={BTN.secundario}>
            Ver su ficha
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-shell/60 p-6">
        <p className="text-[0.9375rem] font-semibold text-muted">Lo que escribió antes de la sesión</p>
        <p className="mt-2 text-[1.0625rem] leading-relaxed whitespace-pre-line text-ink">{cita.reason}</p>
      </section>

      {cita.modality === "Online" && activa ? (
        <section className="rounded-2xl border border-line bg-white p-6">
          <p className="text-[0.9375rem] font-semibold text-muted">Enlace de la videollamada</p>
          <p className="mt-1 text-[0.9375rem] text-ink-soft">
            Pega aquí el enlace de Zoom o Meet. Si la cita está confirmada, a {nombre} le llega por correo.
          </p>
          <FormAccion action={guardarEnlaceAction} okMensaje="Enlace guardado." className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input type="hidden" name="id" value={cita.id} />
            <input
              name="meetingUrl"
              type="url"
              defaultValue={cita.meetingUrl ?? ""}
              placeholder="https://meet.google.com/…"
              aria-label="Enlace de la videollamada"
              className="min-w-0 flex-1 rounded-xl border border-line px-4 py-3 text-[1.0625rem]"
            />
            <button type="submit" className={`${BTN.principal} sm:flex-none`}>
              Guardar enlace
            </button>
          </FormAccion>
        </section>
      ) : null}

      <section className="rounded-2xl border border-line bg-white p-6">
        <p className="text-[0.9375rem] font-semibold text-muted">Tus notas · solo tú las ves</p>
        <FormAccion action={saveAppointmentNotesAction} okMensaje="Nota guardada." className="mt-3 space-y-3">
          <input type="hidden" name="id" value={cita.id} />
          <textarea
            name="notes"
            rows={5}
            defaultValue={cita.notes ?? ""}
            placeholder="Lo que quieras recordar de esta sesión…"
            aria-label="Notas privadas"
            className="w-full rounded-xl border border-line px-4 py-3 text-[1.0625rem] leading-relaxed"
          />
          <button type="submit" className={BTN.principal}>
            Guardar nota
          </button>
        </FormAccion>
      </section>

      {activa && futura ? (
        <FormAccion
          action={cancelAppointmentAction}
          confirmar={`¿Cancelar la cita de ${nombre}? Le llegará un aviso por correo.`}
          className="text-center"
        >
          <input type="hidden" name="id" value={cita.id} />
          <button type="submit" className="text-[1rem] font-semibold text-rose-deep underline underline-offset-4">
            Cancelar esta cita
          </button>
        </FormAccion>
      ) : null}
    </div>
  );
}
