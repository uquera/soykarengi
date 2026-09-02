"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { makeCode } from "@/lib/format";
import { parseDay, slotsForDay } from "@/lib/availability";
import type { FormState } from "./auth";

const schema = z.object({
  serviceId: z.string().min(1, "Elige un servicio."),
  day: z.string().min(1, "Elige un día."),
  hour: z.coerce.number().int().min(0).max(23),
  modality: z.string().min(1, "Elige la modalidad."),
  reason: z.string().trim().min(15, "Cuéntame en un par de líneas qué te trae. Ayuda mucho."),
  firstTime: z.string().optional(),
});

export async function createAppointmentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Necesitas una cuenta para reservar. Ingresa o regístrate." };

  const parsed = schema.safeParse({
    serviceId: formData.get("serviceId"),
    day: formData.get("day"),
    hour: formData.get("hour"),
    modality: formData.get("modality"),
    reason: formData.get("reason"),
    firstTime: formData.get("firstTime"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { serviceId, day, hour, modality, reason, firstTime } = parsed.data;

  const service = await db.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.active) return { error: "Ese servicio ya no está disponible." };

  const base = parseDay(day);
  if (!base) return { error: "La fecha no es válida." };
  if (!slotsForDay(base).includes(hour)) return { error: "Ese bloque no está dentro del horario de atención." };

  const startsAt = new Date(base);
  startsAt.setHours(hour, 0, 0, 0);
  if (startsAt <= new Date()) return { error: "Elige un bloque futuro." };

  // El slot pudo tomarse mientras el formulario estaba abierto.
  const clash = await db.appointment.findFirst({
    where: { startsAt, status: { in: ["PENDIENTE", "CONFIRMADA"] } },
  });
  if (clash) return { error: "Justo tomaron ese bloque. Elige otro horario, por favor." };

  const appointment = await db.appointment.create({
    data: {
      code: makeCode("CITA"),
      userId: user.id,
      serviceId: service.id,
      startsAt,
      modality,
      reason,
      firstTime: firstTime === "si",
    },
  });

  revalidatePath("/mi-espacio/citas");
  revalidatePath("/admin/agenda");
  redirect(`/mi-espacio/citas?nueva=${appointment.code}`);
}

export async function cancelAppointmentAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");

  const id = String(formData.get("id") ?? "");
  const appointment = await db.appointment.findUnique({ where: { id } });
  if (!appointment) return;

  const mine = appointment.userId === user.id;
  if (!mine && user.role !== "ADMIN") return;

  await db.appointment.update({ where: { id }, data: { status: "CANCELADA" } });
  revalidatePath("/mi-espacio/citas");
  revalidatePath("/admin/agenda");
}

export async function setAppointmentStatusAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/ingresar");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["PENDIENTE", "CONFIRMADA", "COMPLETADA", "CANCELADA"].includes(status)) return;

  await db.appointment.update({ where: { id }, data: { status } });
  revalidatePath("/admin/agenda");
  revalidatePath("/mi-espacio/citas");
}

export async function saveAppointmentNotesAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/ingresar");

  const id = String(formData.get("id") ?? "");
  await db.appointment.update({
    where: { id },
    data: { notes: String(formData.get("notes") ?? "").trim() || null },
  });
  revalidatePath("/admin/agenda");
}
