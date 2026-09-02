"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { FormState } from "./auth";

const schema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre."),
  email: z.string().trim().toLowerCase().email("Revisa tu correo."),
  phone: z.string().trim().optional(),
  unit: z.string().min(1),
  message: z.string().trim().min(10, "Cuéntame un poco más."),
});

export async function sendContactAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.contactMessage.create({
    data: { ...parsed.data, phone: parsed.data.phone || null },
  });

  revalidatePath("/admin/mensajes");
  return { ok: true };
}
