"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, METHODS } from "@/lib/finance";
import type { FormState } from "./auth";

async function guard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/ingresar?next=/admin/finanzas");
  return user;
}

const KINDS = ["INGRESO", "EGRESO"] as const;
const CATEGORY_KEYS = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map((c) => c.key);
const METHOD_KEYS = METHODS.map((m) => m.key);

const schema = z.object({
  kind: z.enum(KINDS),
  concept: z.string().trim().min(3, "Escribe un concepto."),
  category: z.string().refine((v) => CATEGORY_KEYS.includes(v as never), "Elige una categoría."),
  amount: z.coerce.number().positive("El monto debe ser mayor que cero.").max(1_000_000),
  method: z.string().refine((v) => METHOD_KEYS.includes(v as never), "Elige un medio de pago."),
  date: z.string().min(1, "Elige una fecha."),
  notes: z.string().trim().optional(),
});

export async function saveMovementAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await guard();

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  // Al mediodía, para que el día no se corra al cambiar de zona horaria.
  const date = new Date(`${d.date}T12:00:00`);
  if (Number.isNaN(date.getTime())) return { error: "La fecha no es válida." };

  const data = {
    kind: d.kind,
    concept: d.concept,
    category: d.category,
    amount: Math.round(d.amount * 100) / 100,
    method: d.method,
    date,
    notes: d.notes?.trim() || null,
  };

  const id = String(formData.get("id") ?? "");
  if (id) await db.movement.update({ where: { id }, data });
  else await db.movement.create({ data });

  revalidatePath("/admin/finanzas");
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteMovementAction(formData: FormData) {
  await guard();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.movement.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/finanzas");
  revalidatePath("/admin");
}
