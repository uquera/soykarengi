"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseDay } from "@/lib/availability";
import { accionValida, consumirAccion } from "@/lib/acciones-correo";
import { getLicenciaStatus } from "@/lib/licencia";
import { correoCitaConfirmada } from "@/lib/email";
import { adminCreateAppointmentAction, createBlackoutAction, rescheduleAppointmentAction } from "./booking";

/**
 * Acciones del panel sencillo de Karen. Las del día a día (confirmar,
 * cotizar, marcar pagado, entregar) reutilizan las del panel completo; aquí
 * va solo lo que el panel sencillo hace distinto.
 */

type Resultado = { ok?: boolean; error?: string };

async function soloAdmin() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN" ? user : null;
}

/** Mover una cita eligiendo día y hora, sin arrastrar nada en un calendario. */
export async function moverCitaAction(formData: FormData): Promise<Resultado> {
  if (!(await soloAdmin())) return { error: "Tu sesión expiró. Vuelve a ingresar." };

  const dia = parseDay(String(formData.get("dia") ?? ""));
  const hora = Number(formData.get("hora"));
  if (!dia) return { error: "Elige el día nuevo." };
  if (!Number.isInteger(hora) || hora < 0 || hora > 23) return { error: "Elige la hora nueva." };

  const inicio = new Date(dia);
  inicio.setHours(hora, 0, 0, 0);
  if (inicio <= new Date()) return { error: "Elige un horario que todavía no haya pasado." };

  const fd = new FormData();
  fd.set("id", String(formData.get("id") ?? ""));
  fd.set("startsAt", inicio.toISOString());
  return rescheduleAppointmentAction(fd);
}

/** Agendar a alguien eligiendo día y hora; la hora se arma en la zona de Karen. */
export async function agendarSencilloAction(formData: FormData): Promise<Resultado> {
  if (!(await soloAdmin())) return { error: "Tu sesión expiró. Vuelve a ingresar." };

  const dia = parseDay(String(formData.get("dia") ?? ""));
  const hora = Number(formData.get("hora"));
  if (!dia) return { error: "Elige el día." };
  if (String(formData.get("hora") ?? "") === "" || !Number.isInteger(hora)) return { error: "Elige la hora." };

  const inicio = new Date(dia);
  inicio.setHours(hora, 0, 0, 0);
  if (inicio <= new Date()) return { error: "Elige un horario que todavía no haya pasado." };

  const fd = new FormData();
  for (const campo of ["serviceId", "name", "email", "phone", "modality", "reason"]) {
    fd.set(campo, String(formData.get(campo) ?? ""));
  }
  fd.set("startsAt", inicio.toISOString());
  const r = await adminCreateAppointmentAction(fd);
  if (r.error) return r;
  redirect("/panel/agenda?agendada=1");
}

/** Días libres completos: desde un día hasta otro, ambos incluidos. */
export async function diasLibresAction(formData: FormData): Promise<Resultado> {
  if (!(await soloAdmin())) return { error: "Tu sesión expiró. Vuelve a ingresar." };

  const desde = parseDay(String(formData.get("desde") ?? ""));
  const hasta = parseDay(String(formData.get("hasta") ?? "") || String(formData.get("desde") ?? ""));
  if (!desde || !hasta) return { error: "Elige desde qué día." };
  if (hasta < desde) return { error: "El último día no puede ser antes del primero." };

  const fin = new Date(hasta);
  fin.setDate(fin.getDate() + 1);

  const fd = new FormData();
  fd.set("startsAt", desde.toISOString());
  fd.set("endsAt", fin.toISOString());
  fd.set("allDay", "on");
  fd.set("reason", String(formData.get("motivo") ?? "").trim() || "Día libre");
  return createBlackoutAction(fd);
}

/** Precios de los servicios: un número o «a convenir». */
export async function guardarPreciosAction(_prev: Resultado, formData: FormData): Promise<Resultado> {
  if (!(await soloAdmin())) return { error: "Tu sesión expiró. Vuelve a ingresar." };

  const ids = formData.getAll("servicio").map(String);
  for (const id of ids) {
    const aConvenir = formData.get(`convenir-${id}`) === "on";
    const precio = Number(formData.get(`precio-${id}`));
    if (!aConvenir && (!Number.isFinite(precio) || precio < 0 || precio > 100000)) {
      return { error: "Revisa los precios: tienen que ser números." };
    }
    await db.service.update({
      where: { id },
      data: aConvenir ? { priceNote: "A convenir" } : { price: Math.round(precio), priceNote: null },
    });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/** «Ya los vi»: los archivos que mandó una clienta salen de «Hoy». */
export async function marcarArchivosVistosAction(formData: FormData): Promise<Resultado> {
  if (!(await soloAdmin())) return { error: "Tu sesión expiró. Vuelve a ingresar." };
  await db.archivo.updateMany({
    where: { userId: String(formData.get("userId") ?? ""), tipo: { in: ["DE_CLIENTA", "REFERENCIA"] }, vistoAt: null },
    data: { vistoAt: new Date() },
  });
  revalidatePath("/panel", "layout");
  return { ok: true };
}

/** Pasar del panel sencillo al completo y de vuelta. */
export async function cambiarPanelAction(formData: FormData) {
  const user = await soloAdmin();
  if (!user) redirect("/ingresar");

  const sencillo = formData.get("modo") === "sencillo";
  await db.user.update({ where: { id: user.id }, data: { panelSimple: sencillo } });
  redirect(sencillo ? "/panel" : "/admin");
}

/**
 * «Sí, confirmar» desde el enlace del correo. No pide sesión (es el punto:
 * resolver sin entrar al panel), pero el token es de un solo uso, vence y
 * solo sirve para esa cita.
 */
export async function confirmarDesdeCorreoAction(formData: FormData): Promise<Resultado> {
  if ((await getLicenciaStatus()).bloqueada) return { error: "La plataforma no está disponible en este momento." };
  const accion = await accionValida(String(formData.get("token") ?? ""));
  if (!accion || accion.tipo !== "CONFIRMAR_CITA") return { error: "Este enlace ya se usó o venció." };

  const cita = await db.appointment.findUnique({ where: { id: accion.refId }, include: { user: true, service: true } });
  if (!cita) return { error: "Esa cita ya no existe." };
  if (cita.status !== "PENDIENTE") {
    await consumirAccion(accion.id);
    return { error: "Esta cita ya no estaba por confirmar: alguien la confirmó, la movió o la canceló." };
  }

  await db.appointment.update({ where: { id: cita.id }, data: { status: "CONFIRMADA" } });
  await consumirAccion(accion.id);
  await correoCitaConfirmada(cita.user.email, cita.user.name, {
    servicio: cita.service.name,
    fecha: cita.startsAt,
    modalidad: cita.modality,
    codigo: cita.code,
    enlace: cita.meetingUrl,
  });

  revalidatePath("/panel", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/mi-espacio", "layout");
  return { ok: true };
}
