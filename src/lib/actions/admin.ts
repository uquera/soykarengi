"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { FormState } from "./auth";

async function guard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/ingresar?next=/admin");
  return user;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

/** Un slug libre, agregando sufijo si ya existe. */
async function uniqueSlug(base: string, taken: (slug: string) => Promise<boolean>) {
  const root = slugify(base) || "item";
  let candidate = root;
  let n = 2;
  while (await taken(candidate)) {
    candidate = `${root}-${n++}`;
  }
  return candidate;
}

/** Campo opcional en inglés: la cadena vacía se guarda como null para que caiga al español. */
const optionalEn = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v !== "" ? v : null));

// ───────────────────────────── SERVICIOS ─────────────────────────────

const serviceSchema = z.object({
  name: z.string().trim().min(3, "El nombre es muy corto."),
  summary: z.string().trim().min(10, "Escribe un resumen."),
  description: z.string().trim().min(10, "Escribe la descripción."),
  forWho: z.string().trim().min(3, "Completa «¿Para quién es?»."),
  whatToExpect: z.string().trim().min(3, "Completa «¿Qué puedes esperar?»."),
  modality: z.string().min(1),
  specialty: z.string().trim().min(2),
  durationMin: z.coerce.number().int().min(15).max(480),
  price: z.coerce.number().int().min(0),
  priceNote: optionalEn,
  accentEmoji: z.string().trim().min(1).max(4),
  order: z.coerce.number().int().min(0).max(999),
  nameEn: optionalEn,
  summaryEn: optionalEn,
  descriptionEn: optionalEn,
  forWhoEn: optionalEn,
  whatToExpectEn: optionalEn,
  specialtyEn: optionalEn,
  modalityEn: optionalEn,
  priceNoteEn: optionalEn,
});

export async function saveServiceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await guard();

  const parsed = serviceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "on";

  if (id) {
    await db.service.update({ where: { id }, data: { ...parsed.data, active } });
  } else {
    const slug = await uniqueSlug(parsed.data.name, async (s) => !!(await db.service.findUnique({ where: { slug: s } })));
    await db.service.create({ data: { ...parsed.data, slug, active } });
  }

  revalidatePath("/admin/servicios");
  revalidatePath("/acompanamiento");
  revalidatePath("/acompanamiento/servicios");
  redirect("/admin/servicios");
}

export async function deleteServiceAction(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "");
  const used = await db.appointment.count({ where: { serviceId: id } });
  // Un servicio con historial se archiva, no se borra: las citas deben seguir legibles.
  if (used > 0) await db.service.update({ where: { id }, data: { active: false } });
  else await db.service.delete({ where: { id } });
  revalidatePath("/admin/servicios");
}

// ───────────────────────────── DISEÑOS ─────────────────────────────

const designSchema = z.object({
  name: z.string().trim().min(3, "El nombre es muy corto."),
  tagline: z.string().trim().min(5, "Escribe una bajada."),
  description: z.string().trim().min(10, "Escribe la descripción."),
  categoryId: z.string().min(1, "Elige una categoría."),
  basePrice: z.coerce.number().int().min(0),
  delivery: z.string().trim().min(2),
  customFields: z.string().trim().min(2),
  palette: z.string().min(1),
  order: z.coerce.number().int().min(0).max(999),
  image: optionalEn,
  nameEn: optionalEn,
  taglineEn: optionalEn,
  descriptionEn: optionalEn,
  deliveryEn: optionalEn,
  customFieldsEn: optionalEn,
});

export async function saveDesignAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await guard();

  const parsed = designSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "on";
  const featured = formData.get("featured") === "on";

  // Las intenciones vienen como casillas; se guardan en una sola columna.
  // Vacío es una respuesta válida: el diseño hereda el grupo de su categoría.
  const intents = formData.getAll("intents").map(String).filter(Boolean).join(",") || null;

  if (id) {
    await db.design.update({ where: { id }, data: { ...parsed.data, active, featured, intents } });
  } else {
    const slug = await uniqueSlug(parsed.data.name, async (s) => !!(await db.design.findUnique({ where: { slug: s } })));
    await db.design.create({ data: { ...parsed.data, slug, active, featured, intents } });
  }

  revalidatePath("/admin/disenos");
  revalidatePath("/disenos");
  revalidatePath("/disenos/categoria", "layout");
  redirect("/admin/disenos");
}

export async function deleteDesignAction(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "");
  const used = await db.designRequest.count({ where: { designId: id } });
  if (used > 0) await db.design.update({ where: { id }, data: { active: false } });
  else {
    await db.favorite.deleteMany({ where: { designId: id } });
    await db.design.delete({ where: { id } });
  }
  revalidatePath("/admin/disenos");
}

// ──────────────────────────── CATEGORÍAS ────────────────────────────

const categorySchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto."),
  group: z.string().min(1),
  description: z.string().trim().min(5, "Escribe una descripción breve."),
  order: z.coerce.number().int().min(0).max(999),
  nameEn: optionalEn,
  descriptionEn: optionalEn,
});

export async function saveCategoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await guard();

  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "on";

  if (id) {
    await db.designCategory.update({ where: { id }, data: { ...parsed.data, active } });
  } else {
    const slug = await uniqueSlug(parsed.data.name, async (s) =>
      !!(await db.designCategory.findUnique({ where: { slug: s } })),
    );
    await db.designCategory.create({ data: { ...parsed.data, slug, active } });
  }

  revalidatePath("/admin/categorias");
  revalidatePath("/disenos");
  return { ok: true };
}

export async function deleteCategoryAction(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "");
  const used = await db.design.count({ where: { categoryId: id } });
  if (used > 0) await db.designCategory.update({ where: { id }, data: { active: false } });
  else await db.designCategory.delete({ where: { id } });
  revalidatePath("/admin/categorias");
}

// ───────────────────────────── CONTENIDO ─────────────────────────────

const postSchema = z.object({
  title: z.string().trim().min(4, "El título es muy corto."),
  excerpt: z.string().trim().min(10, "Escribe una bajada."),
  content: z.string().trim().min(20, "El contenido es muy corto."),
  kind: z.string().min(1),
  tag: z.string().trim().default(""),
  readMinutes: z.coerce.number().int().min(1).max(60),
  titleEn: optionalEn,
  excerptEn: optionalEn,
  contentEn: optionalEn,
  tagEn: optionalEn,
});

export async function savePostAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await guard();

  const parsed = postSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const id = String(formData.get("id") ?? "");
  const published = formData.get("published") === "on";

  if (id) {
    await db.post.update({ where: { id }, data: { ...parsed.data, published } });
  } else {
    const slug = await uniqueSlug(parsed.data.title, async (s) => !!(await db.post.findUnique({ where: { slug: s } })));
    await db.post.create({ data: { ...parsed.data, slug, published } });
  }

  revalidatePath("/admin/contenido");
  revalidatePath("/blog");
  revalidatePath("/recursos");
  redirect("/admin/contenido");
}

export async function deletePostAction(formData: FormData) {
  await guard();
  await db.post.delete({ where: { id: String(formData.get("id") ?? "") } });
  revalidatePath("/admin/contenido");
  revalidatePath("/blog");
  revalidatePath("/recursos");
}

// ───────────────────────────── MENSAJES ─────────────────────────────

export async function toggleMessageAction(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "");
  const message = await db.contactMessage.findUnique({ where: { id } });
  if (!message) return;
  await db.contactMessage.update({ where: { id }, data: { handled: !message.handled } });
  revalidatePath("/admin/mensajes");
}
