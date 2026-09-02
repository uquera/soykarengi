"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { makeCode } from "@/lib/format";
import { REQUEST_FLOW } from "@/lib/domain";
import type { FormState } from "./auth";

const schema = z.object({
  purpose: z.string().min(1, "Cuéntanos qué quieres crear."),
  recipient: z.string().trim().min(2, "Cuéntanos para quién es."),
  emotions: z.string().min(1, "Elige al menos una intención."),
  eventDate: z.string().optional(),
  format: z.string().min(1, "Elige el formato de entrega."),
  quantity: z.coerce.number().int().min(1).max(999),
  details: z.string().optional(),
  idea: z.string().trim().min(20, "Cuéntanos tu idea con un poco más de detalle. No hay respuestas malas."),
  designId: z.string().optional(),
  files: z.string().optional(),
});

export async function createDesignRequestAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Necesitas una cuenta para enviar tu solicitud. Ingresa o regístrate." };

  const parsed = schema.safeParse({
    purpose: formData.get("purpose"),
    recipient: formData.get("recipient"),
    emotions: formData.getAll("emotions").join(","),
    eventDate: formData.get("eventDate"),
    format: formData.get("format"),
    quantity: formData.get("quantity") || 1,
    details: formData.get("details"),
    idea: formData.get("idea"),
    designId: formData.get("designId"),
    files: formData.get("files"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const designId = d.designId && d.designId !== "" ? d.designId : null;
  if (designId) {
    const exists = await db.design.findUnique({ where: { id: designId } });
    if (!exists) return { error: "El diseño base ya no está disponible." };
  }

  const request = await db.designRequest.create({
    data: {
      code: makeCode("DIS"),
      userId: user.id,
      designId,
      purpose: d.purpose,
      recipient: d.recipient,
      emotions: d.emotions,
      eventDate: d.eventDate ? new Date(`${d.eventDate}T12:00:00`) : null,
      format: d.format,
      quantity: d.quantity,
      details: d.details?.trim() ?? "",
      idea: d.idea,
    },
  });

  // Las referencias se registran por nombre; la subida real llega en Fase 2.
  const files = (d.files ?? "")
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean)
    .slice(0, 12);

  if (files.length > 0) {
    await db.attachment.createMany({
      data: files.map((name) => ({ requestId: request.id, name })),
    });
  }

  revalidatePath("/mi-espacio/disenos");
  revalidatePath("/admin/solicitudes");
  redirect(`/mi-espacio/disenos?nueva=${request.code}`);
}

export async function toggleFavoriteAction(formData: FormData) {
  const user = await getCurrentUser();
  const designId = String(formData.get("designId") ?? "");
  if (!user) redirect(`/ingresar?next=/disenos`);

  const existing = await db.favorite.findUnique({
    where: { userId_designId: { userId: user.id, designId } },
  });

  if (existing) await db.favorite.delete({ where: { id: existing.id } });
  else await db.favorite.create({ data: { userId: user.id, designId } });

  revalidatePath("/disenos");
  revalidatePath("/mi-espacio/favoritos");
}

/** Cliente aprueba la cotización que Karen le envió. */
export async function approveQuoteAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");

  const id = String(formData.get("id") ?? "");
  const request = await db.designRequest.findUnique({ where: { id } });
  if (!request || request.userId !== user.id || request.status !== "COTIZADA") return;

  await db.designRequest.update({ where: { id }, data: { status: "APROBADA" } });
  revalidatePath("/mi-espacio/disenos");
  revalidatePath("/admin/solicitudes");
}

export async function cancelRequestAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");

  const id = String(formData.get("id") ?? "");
  const request = await db.designRequest.findUnique({ where: { id } });
  if (!request) return;
  if (request.userId !== user.id && user.role !== "ADMIN") return;

  await db.designRequest.update({ where: { id }, data: { status: "CANCELADA" } });
  revalidatePath("/mi-espacio/disenos");
  revalidatePath("/admin/solicitudes");
}

/** Karen cotiza: monto + notas, y la solicitud pasa a COTIZADA. */
export async function quoteRequestAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/ingresar");

  const id = String(formData.get("id") ?? "");
  const amount = Number(formData.get("quoteAmount"));
  if (!Number.isFinite(amount) || amount <= 0) return;

  await db.designRequest.update({
    where: { id },
    data: {
      quoteAmount: Math.round(amount),
      quoteNotes: String(formData.get("quoteNotes") ?? "").trim() || null,
      quotedAt: new Date(),
      status: "COTIZADA",
    },
  });

  revalidatePath("/admin/solicitudes");
  revalidatePath("/mi-espacio/disenos");
}

export async function advanceRequestAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/ingresar");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!REQUEST_FLOW.includes(status as (typeof REQUEST_FLOW)[number]) && status !== "CANCELADA") return;

  await db.designRequest.update({
    where: { id },
    data: {
      status,
      ...(status === "PAGADA" ? { paidAt: new Date() } : {}),
      ...(status === "ENTREGADA" ? { deliveredAt: new Date() } : {}),
    },
  });

  revalidatePath("/admin/solicitudes");
  revalidatePath("/admin/pedidos");
  revalidatePath("/mi-espacio/disenos");
  revalidatePath("/mi-espacio/pedidos");
}

export async function addDeliverableAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/ingresar");

  const requestId = String(formData.get("requestId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!requestId || !name || !url) return;

  await db.deliverable.create({ data: { requestId, name, url } });
  revalidatePath("/admin/solicitudes");
  revalidatePath("/mi-espacio/archivos");
}
