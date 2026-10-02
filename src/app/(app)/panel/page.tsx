import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/format";
import { cuandoHumano, fechaLargaHoy, primerNombre, saludo } from "@/lib/simple";
import { setAppointmentStatusAction } from "@/lib/actions/booking";
import { advanceRequestAction } from "@/lib/actions/designs";
import { marcarArchivosVistosAction } from "@/lib/actions/panel";
import { FormAccion } from "@/components/form-accion";
import { BTN, Seccion, Tarjeta } from "@/components/panel-sencillo-ui";
import { cargarPendientes } from "./pendientes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Hoy" };

const pieza = (r: { design: { name: string } | null; recipient: string }) =>
  r.design?.name ?? `Un diseño para ${r.recipient}`;

/**
 * «Lo que te toca hoy». Cada tarjeta es una cosa que espera a Karen y trae el
 * botón que la resuelve. Cuando no queda nada, lo dice.
 */
export default async function HoyPage() {
  const user = await requireAdmin();
  const p = await cargarPendientes();

  const [proximas, enPreparacion] = await Promise.all([
    db.appointment.findMany({
      where: { status: "CONFIRMADA", startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 3,
      include: { user: true, service: true },
    }),
    db.designRequest.findMany({
      where: { status: { in: ["PAGADA", "EN_DISENO", "REVISION", "APROBACION_FINAL"] } },
      orderBy: { paidAt: "asc" },
      include: { user: true, design: true },
    }),
  ]);

  const total =
    p.porConfirmar.length + p.porCerrar.length + p.nuevos.length + p.porCobrar.length + p.archivos.length + (p.mensajes ? 1 : 0);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[1rem] text-muted">{fechaLargaHoy()}</p>
        <h1 className="font-[family-name:var(--font-display)] text-[2.25rem] leading-tight text-ink">
          {saludo()}, {primerNombre(user.name)}
        </h1>
        <p className="mt-1 text-[1.0625rem] text-ink-soft">
          {total === 0
            ? "No tienes nada pendiente."
            : total === 1
              ? "Tienes 1 cosa por hacer."
              : `Tienes ${total} cosas por hacer.`}
        </p>
      </header>

      {total === 0 ? (
        <div className="rounded-2xl border border-moss/40 bg-moss-soft px-6 py-8 text-center">
          <p className="text-[2rem]" aria-hidden="true">
            ✓
          </p>
          <p className="font-[family-name:var(--font-display)] text-[1.5rem] text-moss-deep">Todo al día</p>
          <p className="mt-1 text-[1rem] text-ink-soft">Cuando llegue una reserva o un pedido, aparecerá aquí y te llegará un correo.</p>
        </div>
      ) : null}

      {p.porConfirmar.length > 0 ? (
        <Seccion titulo="Citas por confirmar">
          {p.porConfirmar.map((c) => (
            <Tarjeta
              key={c.id}
              tono="cita"
              etiqueta="Cita nueva"
              titulo={c.user.name}
              detalle={
                <>
                  {cuandoHumano(c.startsAt)}
                  <br />
                  {c.service.name} · {c.modality}
                  {c.firstTime ? " · primera vez" : ""}
                </>
              }
            >
              <FormAccion action={setAppointmentStatusAction} className="flex flex-1">
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="status" value="CONFIRMADA" />
                <button type="submit" className={BTN.confirmar}>
                  Confirmar
                </button>
              </FormAccion>
              <Link href={`/panel/cita/${c.id}`} className={BTN.secundario}>
                Ver o cambiar
              </Link>
            </Tarjeta>
          ))}
        </Seccion>
      ) : null}

      {p.porCerrar.length > 0 ? (
        <Seccion titulo="¿Se hicieron estas sesiones?">
          {p.porCerrar.map((c) => (
            <Tarjeta
              key={c.id}
              tono="cita"
              etiqueta="Sesión que ya pasó"
              titulo={c.user.name}
              detalle={`${cuandoHumano(c.startsAt)} · ${c.service.name}`}
            >
              <FormAccion action={setAppointmentStatusAction} className="flex flex-1">
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="status" value="COMPLETADA" />
                <button type="submit" className={BTN.confirmar}>
                  Sí, se hizo
                </button>
              </FormAccion>
              <FormAccion
                action={setAppointmentStatusAction}
                className="flex flex-1"
                confirmar={`¿Marcar que ${primerNombre(c.user.name)} no vino? La sesión queda como no realizada.`}
              >
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="status" value="CANCELADA" />
                <button type="submit" className={BTN.secundario}>
                  No se hizo
                </button>
              </FormAccion>
            </Tarjeta>
          ))}
        </Seccion>
      ) : null}

      {p.nuevos.length > 0 ? (
        <Seccion titulo="Pedidos nuevos">
          {p.nuevos.map((r) => (
            <Tarjeta
              key={r.id}
              tono="diseno"
              etiqueta="Pedido de diseño"
              titulo={`${primerNombre(r.user.name)} quiere: ${pieza(r)}`}
              detalle={`Para ${r.recipient} · ${r.quantity} ${r.quantity === 1 ? "pieza" : "piezas"}`}
            >
              <Link href={`/panel/pedido/${r.id}`} className={BTN.principal}>
                Ponerle precio
              </Link>
            </Tarjeta>
          ))}
        </Seccion>
      ) : null}

      {p.porCobrar.length > 0 ? (
        <Seccion titulo="Precios aprobados">
          {p.porCobrar.map((r) => (
            <Tarjeta
              key={r.id}
              tono="dinero"
              etiqueta={`${primerNombre(r.user.name)} aprobó tu precio`}
              titulo={`${pieza(r)} · ${money(r.quoteAmount)}`}
              detalle="Cuando te pague, márcalo aquí y el pedido pasa a preparación."
            >
              <FormAccion
                action={advanceRequestAction}
                className="flex flex-1"
                confirmar={`¿${primerNombre(r.user.name)} ya te pagó ${money(r.quoteAmount)}?`}
              >
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="status" value="PAGADA" />
                <button type="submit" className={BTN.principal}>
                  Ya me pagó
                </button>
              </FormAccion>
              <Link href={`/panel/pedido/${r.id}`} className={BTN.secundario}>
                Ver pedido
              </Link>
            </Tarjeta>
          ))}
        </Seccion>
      ) : null}

      {p.archivos.length > 0 ? (
        <Seccion titulo="Archivos que te mandaron">
          {p.archivos.map(({ clienta, cantidad }) => (
            <Tarjeta
              key={clienta.id}
              etiqueta="Archivos nuevos"
              titulo={`${primerNombre(clienta.name)} te mandó ${cantidad === 1 ? "un archivo" : `${cantidad} archivos`}`}
            >
              <Link href={`/panel/clientas/${clienta.id}`} className={BTN.principal}>
                Verlos
              </Link>
              <FormAccion action={marcarArchivosVistosAction} className="flex flex-1">
                <input type="hidden" name="userId" value={clienta.id} />
                <button type="submit" className={BTN.secundario}>
                  Ya los vi
                </button>
              </FormAccion>
            </Tarjeta>
          ))}
        </Seccion>
      ) : null}

      {p.mensajes > 0 ? (
        <Tarjeta
          etiqueta="Mensajes"
          titulo={p.mensajes === 1 ? "Tienes un mensaje nuevo" : `Tienes ${p.mensajes} mensajes nuevos`}
          detalle="Llegaron desde el formulario de contacto de la web."
        >
          <Link href="/panel/mensajes" className={BTN.principal}>
            Leerlos
          </Link>
        </Tarjeta>
      ) : null}

      {enPreparacion.length > 0 ? (
        <Seccion titulo="Pedidos en preparación">
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
            {enPreparacion.map((r) => (
              <li key={r.id}>
                <Link href={`/panel/pedido/${r.id}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-shell/50">
                  <span>
                    <span className="block font-semibold text-ink">{pieza(r)}</span>
                    <span className="text-[0.9375rem] text-muted">{r.user.name}</span>
                  </span>
                  <span className="shrink-0 text-[0.9375rem] font-semibold text-moss-deep">Abrir →</span>
                </Link>
              </li>
            ))}
          </ul>
        </Seccion>
      ) : null}

      {proximas.length > 0 ? (
        <Seccion titulo="Tus próximas citas">
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
            {proximas.map((c) => (
              <li key={c.id}>
                <Link href={`/panel/cita/${c.id}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-shell/50">
                  <span>
                    <span className="block font-semibold text-ink">{c.user.name}</span>
                    <span className="text-[0.9375rem] text-muted">
                      {cuandoHumano(c.startsAt)} · {c.service.name}
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-muted">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Seccion>
      ) : null}
    </div>
  );
}
