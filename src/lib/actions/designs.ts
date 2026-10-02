"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getLicenciaStatus } from "@/lib/licencia";
import { makeCode } from "@/lib/format";
import { ORDER_STATUSES, REQUEST_FLOW } from "@/lib/domain";
import { urlArchivo } from "@/lib/archivos";
import {
  avisoNuevaSolicitud,
  avisoRespuestaCotizacion,
  correoCotizacion,
  correoEntrega,
  correoPagoConfirmado,
  correoPropuestaLista,
  correoSolicitudRecibida,
} from "@/lib/email";
import type { FormState } from "./auth";

/** El nombre con el que la pieza aparece en los correos. */
const nombrePieza = (nombre?: string | null) => nombre ?? "Diseño a medida";

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
  if ((await getLicenciaStatus()).bloqueada) return { error: "El configurador no está disponible en este momento." };

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

  // Enlaces que anotó (Pinterest, Drive…). Las fotos van aparte, como Archivo.
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

  // Las fotos ya se subieron mientras llenaba el paso 4; aquí se atan a la
  // solicitud. Solo las suyas, sueltas y de tipo referencia.
  const archivoIds = formData.getAll("archivoIds").map(String).filter(Boolean).slice(0, 30);
  const vinculadas =
    archivoIds.length > 0
      ? await db.archivo.updateMany({
          where: {
            id: { in: archivoIds },
            userId: user.id,
            subidoPorId: user.id,
            tipo: "REFERENCIA",
            requestId: null,
          },
          data: { requestId: request.id },
        })
      : { count: 0 };

  // Antes del redirect: redirect() lanza y corta lo que venga después.
  const [quien, base] = await Promise.all([
    db.user.findUnique({ where: { id: user.id } }),
    designId ? db.design.findUnique({ where: { id: designId } }) : Promise.resolve(null),
  ]);

  if (quien) {
    const pieza = nombrePieza(base?.name ?? null);
    await Promise.all([
      correoSolicitudRecibida(quien.email, quien.name, {
        codigo: request.code,
        pieza,
        destinatario: d.recipient,
      }),
      avisoNuevaSolicitud({
        requestId: request.id,
        cliente: quien.name,
        email: quien.email,
        telefono: quien.phone,
        codigo: request.code,
        pieza,
        destinatario: d.recipient,
        idea: d.idea,
        cantidad: d.quantity,
        formato: d.format,
        fotos: vinculadas.count,
      }),
    ]);
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
type Resultado = { ok?: boolean; error?: string };

/** Antes del pago una solicitud se puede cotizar, aprobar o cancelar. */
const ANTES_DEL_PAGO = ["SOLICITUD", "COTIZADA", "APROBADA"];

export async function approveQuoteAction(formData: FormData): Promise<Resultado> {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");

  const id = String(formData.get("id") ?? "");
  const request = await db.designRequest.findUnique({ where: { id }, include: { design: true } });
  if (!request || request.userId !== user.id) return { error: "Esa solicitud no es tuya." };
  if (request.status !== "COTIZADA") return { error: "Esta cotización ya no está esperando respuesta." };

  await db.designRequest.update({ where: { id }, data: { status: "APROBADA" } });

  await avisoRespuestaCotizacion({
    requestId: request.id,
    cliente: user.name,
    codigo: request.code,
    pieza: nombrePieza(request.design?.name),
    monto: request.quoteAmount,
    aprobada: true,
  });

  revalidatePath("/mi-espacio", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/panel", "layout");
  return { ok: true };
}

/**
 * La clienta puede bajarse mientras no haya pagado. Karen puede cancelar en
 * cualquier momento salvo un pedido ya entregado.
 */
export async function cancelRequestAction(formData: FormData): Promise<Resultado> {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");

  const id = String(formData.get("id") ?? "");
  const request = await db.designRequest.findUnique({ where: { id }, include: { design: true } });
  if (!request) return { error: "Esa solicitud ya no existe." };

  const esAdmin = user.role === "ADMIN";
  if (request.userId !== user.id && !esAdmin) return { error: "Esa solicitud no es tuya." };
  if (!esAdmin && !ANTES_DEL_PAGO.includes(request.status)) {
    return { error: "Tu pedido ya está en producción. Para cambiar algo, escríbele a Karen." };
  }
  if (request.status === "ENTREGADA" || request.status === "CANCELADA") {
    return { error: "Esta solicitud ya está cerrada." };
  }

  await db.designRequest.update({ where: { id }, data: { status: "CANCELADA" } });

  // Si la clienta es quien se baja, Karen necesita enterarse.
  if (request.userId === user.id && !esAdmin) {
    await avisoRespuestaCotizacion({
      requestId: request.id,
      cliente: user.name,
      codigo: request.code,
      pieza: nombrePieza(request.design?.name),
      monto: request.quoteAmount,
      aprobada: false,
    });
  }
  revalidatePath("/mi-espacio", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/panel", "layout");
  return { ok: true };
}

/**
 * Karen cotiza: monto + notas, y la solicitud pasa a COTIZADA. Solo antes de
 * que la clienta apruebe: «Actualizar cotización» sobre un pedido pagado lo
 * devolvía a COTIZADA y el ingreso desaparecía de Finanzas.
 */
export async function quoteRequestAction(formData: FormData): Promise<Resultado> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/ingresar");

  const id = String(formData.get("id") ?? "");
  const amount = Number(formData.get("quoteAmount"));
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Escribe un monto mayor que cero." };

  const actual = await db.designRequest.findUnique({ where: { id } });
  if (!actual) return { error: "Esa solicitud ya no existe." };
  if (actual.status !== "SOLICITUD" && actual.status !== "COTIZADA") {
    return { error: "Esta solicitud ya fue aprobada; su cotización no se puede cambiar." };
  }

  const notas = String(formData.get("quoteNotes") ?? "").trim().slice(0, 2000) || null;
  const request = await db.designRequest.update({
    where: { id },
    data: {
      quoteAmount: Math.round(amount),
      quoteNotes: notas,
      quotedAt: new Date(),
      status: "COTIZADA",
    },
    include: { user: true, design: true },
  });

  await correoCotizacion(request.user.email, request.user.name, {
    codigo: request.code,
    pieza: nombrePieza(request.design?.name),
    monto: Math.round(amount),
    notas,
  });

  revalidatePath("/admin", "layout");

  revalidatePath("/panel", "layout");
  revalidatePath("/mi-espacio", "layout");
  return { ok: true };
}

export async function advanceRequestAction(formData: FormData): Promise<Resultado> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/ingresar");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!REQUEST_FLOW.includes(status as (typeof REQUEST_FLOW)[number]) && status !== "CANCELADA") {
    return { error: "Estado desconocido." };
  }

  const antes = await db.designRequest.findUnique({ where: { id } });
  if (!antes) return { error: "Esa solicitud ya no existe." };
  if (status === antes.status) return { ok: true };

  const pagadaAntes = ORDER_STATUSES.includes(antes.status);
  const pagadaDespues = ORDER_STATUSES.includes(status);

  if (pagadaDespues && !antes.quoteAmount) {
    return { error: "Primero envía una cotización: sin monto, el pago no puede registrarse." };
  }
  // Un pedido pagado no vuelve a ser solicitud: el ingreso ya está en Finanzas.
  if (pagadaAntes && !pagadaDespues && status !== "CANCELADA") {
    return { error: "Este pedido ya está pagado; no puede volver a una etapa anterior al pago." };
  }

  const request = await db.designRequest.update({
    where: { id },
    data: {
      status,
      // Las fechas se fijan la primera vez y no se pisan al volver a guardar.
      ...(pagadaDespues && !antes.paidAt ? { paidAt: new Date() } : {}),
      ...(status === "ENTREGADA" && !antes.deliveredAt ? { deliveredAt: new Date() } : {}),
    },
    include: { user: true, design: true, deliverables: true, archivos: { where: { tipo: "ENTREGABLE" } } },
  });

  // Tres momentos valen un correo; el resto del avance se ve en Mi espacio.
  const datos = { codigo: request.code, pieza: nombrePieza(request.design?.name) };
  const { email, name } = request.user;

  if (status === "PAGADA") {
    await correoPagoConfirmado(email, name, { ...datos, monto: request.quoteAmount });
  } else if (status === "REVISION") {
    await correoPropuestaLista(email, name, datos);
  } else if (status === "ENTREGADA") {
    await correoEntrega(email, name, {
      ...datos,
      archivos: [
        ...request.archivos.map((a) => ({ name: a.nombre, url: `${process.env.APP_URL ?? ""}${urlArchivo(a.id)}` })),
        ...request.deliverables.map((d) => ({ name: d.name, url: d.url })),
      ],
    });
  }

  revalidatePath("/admin", "layout");

  revalidatePath("/panel", "layout");
  revalidatePath("/mi-espacio", "layout");
  return { ok: true };
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
