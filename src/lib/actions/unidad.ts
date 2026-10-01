"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { parseUnidad, UNIDAD_COOKIE } from "@/lib/unidad";

/** La puerta de la portada: guarda la elección y lleva a esa unidad. */
export async function elegirUnidadAction(formData: FormData) {
  const unidad = parseUnidad(formData.get("unidad"));
  if (!unidad) redirect("/");

  const store = await cookies();
  store.set(UNIDAD_COOKIE, unidad, {
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  redirect(unidad === "acompanamiento" ? "/acompanamiento" : "/disenos");
}

/** Para volver a ver la portada completa, sin lado elegido. */
export async function limpiarUnidadAction() {
  const store = await cookies();
  store.delete(UNIDAD_COOKIE);
  revalidatePath("/", "layout");
  redirect("/");
}
