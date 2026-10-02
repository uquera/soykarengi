import "server-only";
import { db } from "@/lib/db";

/**
 * Lo que espera a Karen. Cada cosa de esta lista se resuelve con un botón en
 * «Hoy»; cuando está vacía, no tiene nada que hacer en la plataforma.
 */

const HACE_30_DIAS = () => new Date(Date.now() - 30 * 86_400_000);

export async function cargarPendientes() {
  const ahora = new Date();

  const [porConfirmar, confirmadasPasadas, nuevos, porCobrar, archivos, mensajes] = await Promise.all([
    // Reservas que esperan su «sí».
    db.appointment.findMany({
      where: { status: "PENDIENTE", startsAt: { gte: ahora } },
      orderBy: { startsAt: "asc" },
      include: { user: true, service: true },
    }),
    // Sesiones que ya pasaron y nadie marcó: sin esto no entran en Finanzas.
    db.appointment.findMany({
      where: { status: { in: ["CONFIRMADA", "PENDIENTE"] }, startsAt: { lt: ahora, gte: HACE_30_DIAS() } },
      orderBy: { startsAt: "asc" },
      include: { user: true, service: true },
    }),
    // Pedidos de diseño sin precio.
    db.designRequest.findMany({
      where: { status: "SOLICITUD" },
      orderBy: { createdAt: "asc" },
      include: { user: true, design: true },
    }),
    // Precio aprobado: falta que la clienta pague y Karen lo marque.
    db.designRequest.findMany({
      where: { status: "APROBADA" },
      orderBy: { createdAt: "asc" },
      include: { user: true, design: true },
    }),
    // Lo que las clientas le mandaron y Karen todavía no abrió.
    db.archivo.findMany({
      where: { tipo: { in: ["DE_CLIENTA", "REFERENCIA"] }, vistoAt: null, requestId: null },
      orderBy: { createdAt: "desc" },
      include: { user: true },
    }),
    db.contactMessage.count({ where: { handled: false } }),
  ]);

  // Las sesiones pasadas se cierran solo cuando ya terminaron.
  const porCerrar = confirmadasPasadas.filter(
    (c) => c.startsAt.getTime() + c.service.durationMin * 60_000 < ahora.getTime(),
  );

  // Archivos agrupados por clienta: «Ana te mandó 3 archivos».
  const porClienta = new Map<string, { clienta: { id: string; name: string }; cantidad: number }>();
  for (const a of archivos) {
    if (!a.user) continue;
    const actual = porClienta.get(a.user.id) ?? { clienta: { id: a.user.id, name: a.user.name }, cantidad: 0 };
    actual.cantidad++;
    porClienta.set(a.user.id, actual);
  }

  return {
    porConfirmar,
    porCerrar,
    nuevos,
    porCobrar,
    archivos: [...porClienta.values()],
    mensajes,
  };
}

export async function contarPendientes() {
  const p = await cargarPendientes();
  // Lo mismo que cuenta «Hoy» en su encabezado: los mensajes nuevos también son una tarea.
  return (
    p.porConfirmar.length + p.porCerrar.length + p.nuevos.length + p.porCobrar.length + p.archivos.length + (p.mensajes ? 1 : 0)
  );
}
