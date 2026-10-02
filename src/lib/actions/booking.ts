"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { makeCode } from "@/lib/format";
import { conflicto, parseDay, slotsForDay } from "@/lib/availability";
import { getConfig } from "@/lib/config";
import { getLicenciaStatus } from "@/lib/licencia";
import { aceptoVigente, registrarAceptaciones } from "@/lib/legal";
import { enviarActivacion } from "@/lib/password-reset";
import { enlaceAccion } from "@/lib/acciones-correo";
import {
  avisoCitaCancelada,
  avisoNuevaReserva,
  correoCitaCancelada,
  correoCitaConfirmada,
  correoCitaReprogramada,
  correoEnlaceSesion,
  correoReservaRecibida,
} from "@/lib/email";
import type { FormState } from "./auth";

export type AccionState = { ok?: boolean; error?: string };

const MODALIDADES = ["Online", "Presencial"];
const ACTIVAS = ["PENDIENTE", "CONFIRMADA"];

const schema = z.object({
  serviceId: z.string().min(1, "Elige un servicio."),
  day: z.string().min(1, "Elige un día."),
  // Vacío no puede convertirse en 0 (las 00:00): sin hora elegida, se avisa.
  hour: z
    .string()
    .min(1, "Elige una hora para tu sesión.")
    .transform(Number)
    .pipe(z.number().int().min(0).max(23)),
  modality: z.string().refine((m) => MODALIDADES.includes(m), "Elige la modalidad."),
  reason: z.string().trim().min(15, "Cuéntame en un par de líneas qué te trae. Ayuda mucho."),
  firstTime: z.string().optional(),
});

const MENSAJE_CHOQUE = {
  cita: "Justo tomaron ese horario. Elige otro, por favor.",
  bloqueo: "Karen no atiende en ese horario. Elige otro, por favor.",
};

export async function createAppointmentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Necesitas una cuenta para reservar. Ingresa o regístrate." };
  // Con la plataforma pausada no se toman reservas nuevas.
  if ((await getLicenciaStatus()).bloqueada) return { error: "La agenda no está disponible en este momento." };

  const parsed = schema.safeParse({
    serviceId: formData.get("serviceId"),
    day: formData.get("day"),
    hour: String(formData.get("hour") ?? ""),
    modality: formData.get("modality"),
    reason: formData.get("reason"),
    firstTime: formData.get("firstTime"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { serviceId, day, hour, modality, reason, firstTime } = parsed.data;

  const service = await db.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.active) return { error: "Ese servicio ya no está disponible." };
  if (service.modality !== "Ambas" && service.modality !== modality) {
    return { error: `Este servicio es solo ${service.modality.toLowerCase()}.` };
  }

  const base = parseDay(day);
  if (!base) return { error: "La fecha no es válida." };
  if (!(await slotsForDay(base)).includes(hour)) return { error: "Ese horario no está dentro del horario de atención." };

  const startsAt = new Date(base);
  startsAt.setHours(hour, 0, 0, 0);
  if (startsAt <= new Date()) return { error: "Elige un horario futuro." };

  // El consentimiento informado se acepta antes de la primera reserva y cada
  // vez que Karen publica una versión nueva.
  const consentimiento = await aceptoVigente(user.id, "CONSENTIMIENTO");
  if (!consentimiento.aceptada) {
    if (formData.get("aceptaConsentimiento") !== consentimiento.doc.id) {
      return { error: "Para reservar necesitas leer y aceptar el consentimiento informado." };
    }
    await registrarAceptaciones(user.id, [consentimiento.doc.id]);
  }

  // El hueco pudo ocuparse mientras el formulario estaba abierto.
  const choque = await conflicto(startsAt, service.durationMin);
  if (choque) return { error: MENSAJE_CHOQUE[choque] };

  const appointment = await db.appointment.create({
    data: {
      code: makeCode("CITA"),
      userId: user.id,
      serviceId: service.id,
      startsAt,
      modality,
      reason,
      firstTime: firstTime === "si",
      price: service.price,
    },
  });

  // Antes del redirect: redirect() lanza, y lo que vaya después no se ejecuta.
  await Promise.all([
    correoReservaRecibida(user.email, user.name, {
      servicio: service.name,
      fecha: startsAt,
      modalidad: modality,
      codigo: appointment.code,
    }),
    // El aviso a Karen no lleva el motivo de consulta: es un dato clínico y el
    // correo deja copias fuera de la plataforma. Lo lee en el panel.
    avisoNuevaReserva({
      citaId: appointment.id,
      enlaceConfirmar: await enlaceAccion("CONFIRMAR_CITA", appointment.id),
      cliente: user.name,
      servicio: service.name,
      fecha: startsAt,
      modalidad: modality,
      primeraVez: firstTime === "si",
    }),
  ]);

  revalidatePath("/mi-espacio", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/panel", "layout");
  redirect(`/mi-espacio/citas?nueva=${appointment.code}`);
}

/**
 * La clienta cancela desde su espacio (o Karen desde el panel). La clienta
 * solo puede hacerlo con la anticipación de la política de cancelación.
 */
export async function cancelAppointmentAction(formData: FormData): Promise<AccionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Tu sesión expiró. Vuelve a ingresar." };

  const id = String(formData.get("id") ?? "");
  const appointment = await db.appointment.findUnique({
    where: { id },
    include: { user: true, service: true },
  });
  if (!appointment) return { error: "Esa cita ya no existe." };

  const esAdmin = user.role === "ADMIN";
  const mia = appointment.userId === user.id;
  if (!mia && !esAdmin) return { error: "Esa cita no es tuya." };
  if (!ACTIVAS.includes(appointment.status)) return { error: "Esa cita ya no se puede cancelar." };

  if (!esAdmin) {
    const { cancelacionHoras } = await getConfig();
    const faltanHoras = (appointment.startsAt.getTime() - Date.now()) / 3_600_000;
    if (faltanHoras < cancelacionHoras) {
      return {
        error: `Falta menos de ${cancelacionHoras} horas para tu sesión: para cancelarla, escríbele a Karen.`,
      };
    }
  }

  await db.appointment.update({ where: { id }, data: { status: "CANCELADA" } });

  // Quien cancela ya lo sabe: el aviso va para la otra parte.
  const datos = { servicio: appointment.service.name, fecha: appointment.startsAt };
  if (mia && !esAdmin) {
    await avisoCitaCancelada({ cliente: appointment.user.name, ...datos });
  } else {
    await correoCitaCancelada(appointment.user.email, appointment.user.name, datos);
  }

  revalidatePath("/mi-espacio", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/panel", "layout");
  return { ok: true };
}

export async function setAppointmentStatusAction(formData: FormData): Promise<AccionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/ingresar");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["PENDIENTE", "CONFIRMADA", "COMPLETADA", "CANCELADA"].includes(status)) {
    return { error: "Estado desconocido." };
  }

  const antes = await db.appointment.findUnique({
    where: { id },
    include: { user: true, service: true },
  });
  if (!antes) return { error: "Esa cita ya no existe." };
  if (status === antes.status) return { ok: true };

  // Volver a activar una cita cancelada exige que el hueco siga libre.
  if (ACTIVAS.includes(status) && !ACTIVAS.includes(antes.status)) {
    const choque = await conflicto(antes.startsAt, antes.service.durationMin, antes.id);
    if (choque) return { error: "Ese horario ya está ocupado; muévela a otra hora primero." };
  }

  await db.appointment.update({ where: { id }, data: { status } });

  const datos = {
    servicio: antes.service.name,
    fecha: antes.startsAt,
    modalidad: antes.modality,
    codigo: antes.code,
    enlace: antes.meetingUrl,
  };
  if (status === "CONFIRMADA") await correoCitaConfirmada(antes.user.email, antes.user.name, datos);
  // Una sesión que ya pasó y no se hizo no merece un «tu sesión fue cancelada».
  if (status === "CANCELADA" && antes.startsAt > new Date()) {
    await correoCitaCancelada(antes.user.email, antes.user.name, datos);
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/panel", "layout");
  revalidatePath("/mi-espacio", "layout");
  return { ok: true };
}

export async function saveAppointmentNotesAction(formData: FormData): Promise<AccionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/ingresar");

  const id = String(formData.get("id") ?? "");
  await db.appointment.update({
    where: { id },
    data: { notes: String(formData.get("notes") ?? "").trim().slice(0, 20000) || null },
  });
  revalidatePath("/admin/agenda");
  return { ok: true };
}

/** Enlace de la videollamada. Si la cita ya está confirmada, le llega a la clienta. */
export async function guardarEnlaceAction(formData: FormData): Promise<AccionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/ingresar");

  const id = String(formData.get("id") ?? "");
  const enlace = String(formData.get("meetingUrl") ?? "").trim();
  if (enlace && !/^https:\/\/\S+$/i.test(enlace)) {
    return { error: "El enlace tiene que empezar con https://" };
  }

  const antes = await db.appointment.findUnique({ where: { id }, include: { user: true, service: true } });
  if (!antes) return { error: "Esa cita ya no existe." };

  await db.appointment.update({ where: { id }, data: { meetingUrl: enlace || null } });

  if (enlace && enlace !== antes.meetingUrl && ACTIVAS.includes(antes.status)) {
    await correoEnlaceSesion(antes.user.email, antes.user.name, {
      servicio: antes.service.name,
      fecha: antes.startsAt,
      enlace,
    });
  }

  revalidatePath("/admin/agenda");
  revalidatePath("/mi-espacio", "layout");
  return { ok: true };
}

// ─────────────────── Acciones del calendario del panel ───────────────────

async function adminGuard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/ingresar?next=/admin/agenda");
  return user;
}

/** Arrastrar una cita en el calendario la mueve de hora, y se le avisa a la clienta. */
export async function rescheduleAppointmentAction(formData: FormData): Promise<AccionState> {
  await adminGuard();

  const id = String(formData.get("id") ?? "");
  const startsAt = new Date(String(formData.get("startsAt") ?? ""));
  if (!id || Number.isNaN(startsAt.getTime())) return { error: "No se pudo leer la nueva hora." };

  const appointment = await db.appointment.findUnique({ where: { id }, include: { user: true, service: true } });
  if (!appointment) return { error: "Esa cita ya no existe." };
  if (!ACTIVAS.includes(appointment.status)) return { error: "Solo se mueven citas por confirmar o confirmadas." };

  const choque = await conflicto(startsAt, appointment.service.durationMin, id);
  if (choque === "cita") return { error: "Ahí ya hay otra cita. La cita volvió a su hora." };
  if (choque === "bloqueo") return { error: "Ese horario está bloqueado. La cita volvió a su hora." };

  await db.appointment.update({ where: { id }, data: { startsAt } });
  await correoCitaReprogramada(appointment.user.email, appointment.user.name, {
    servicio: appointment.service.name,
    antes: appointment.startsAt,
    ahora: startsAt,
    codigo: appointment.code,
  });

  revalidatePath("/admin", "layout");

  revalidatePath("/panel", "layout");
  revalidatePath("/mi-espacio", "layout");
  return { ok: true };
}

/** Bloquear un rango del calendario: vacaciones, personal, lo que sea. */
export async function createBlackoutAction(formData: FormData): Promise<AccionState> {
  await adminGuard();

  const startsAt = new Date(String(formData.get("startsAt") ?? ""));
  const endsAt = new Date(String(formData.get("endsAt") ?? ""));
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return { error: "Revisa las fechas del bloqueo." };
  }
  if (endsAt <= startsAt) return { error: "El final tiene que ser después del inicio." };

  await db.blackout.create({
    data: {
      startsAt,
      endsAt,
      allDay: formData.get("allDay") === "on",
      reason: String(formData.get("reason") ?? "").trim() || null,
    },
  });

  revalidatePath("/admin/agenda");
  revalidatePath("/acompanamiento/agenda");
  return { ok: true };
}

export async function deleteBlackoutAction(formData: FormData): Promise<AccionState> {
  await adminGuard();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta el bloqueo." };

  await db.blackout.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/agenda");
  revalidatePath("/acompanamiento/agenda");
  return { ok: true };
}

/**
 * Karen agenda a alguien desde el calendario. Si el correo no tiene cuenta, se
 * crea una sin clave conocida y se le manda un enlace para activarla.
 */
export async function adminCreateAppointmentAction(formData: FormData): Promise<AccionState> {
  await adminGuard();

  const startsAt = new Date(String(formData.get("startsAt") ?? ""));
  const serviceId = String(formData.get("serviceId") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const modality = String(formData.get("modality") ?? "Online");

  if (Number.isNaN(startsAt.getTime())) return { error: "Elige un horario en el calendario." };
  if (name.length < 2) return { error: "Escribe el nombre de la persona." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Revisa el correo." };
  if (!MODALIDADES.includes(modality)) return { error: "Elige la modalidad." };

  const service = await db.service.findUnique({ where: { id: serviceId } });
  if (!service) return { error: "Elige un servicio." };

  const choque = await conflicto(startsAt, service.durationMin);
  if (choque) return { error: choque === "cita" ? "Ese horario ya tiene una cita." : "Ese horario está bloqueado." };

  let user = await db.user.findUnique({ where: { email } });
  let cuentaNueva = false;
  if (!user) {
    const bcrypt = (await import("bcryptjs")).default;
    user = await db.user.create({
      data: {
        email,
        name,
        phone: String(formData.get("phone") ?? "").trim() || null,
        // Clave imposible de adivinar: la persona define la suya con el enlace de activación.
        passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 10),
      },
    });
    cuentaNueva = true;
  }

  const appointment = await db.appointment.create({
    data: {
      code: makeCode("CITA"),
      userId: user.id,
      serviceId: service.id,
      startsAt,
      modality,
      status: "CONFIRMADA",
      firstTime: false,
      reason: reason || "Agendada por Karen desde el panel.",
      price: service.price,
    },
  });

  // Nace confirmada: la clienta recibe la confirmación y, si su cuenta es
  // nueva, un enlace para elegir su contraseña y ver la cita en su espacio.
  await correoCitaConfirmada(user.email, user.name, {
    servicio: service.name,
    fecha: startsAt,
    modalidad: modality,
    codigo: appointment.code,
  });
  if (cuentaNueva) await enviarActivacion(user);

  revalidatePath("/admin", "layout");

  revalidatePath("/panel", "layout");
  revalidatePath("/mi-espacio", "layout");
  return { ok: true };
}
