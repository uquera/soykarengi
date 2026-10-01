"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { HORAS_EDITABLES, serializarSemana, type Semana } from "@/lib/config";
import { documentoVigente, esTipoLegal, LEGAL_META } from "@/lib/legal";

export type ConfigState = { ok?: boolean; error?: string };

async function soloAdmin() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN" ? user : null;
}

const texto = (formData: FormData, campo: string, max = 2000) =>
  String(formData.get(campo) ?? "").trim().slice(0, max);

function refrescar() {
  revalidatePath("/", "layout");
}

export async function guardarContactoAction(_prev: ConfigState, formData: FormData): Promise<ConfigState> {
  if (!(await soloAdmin())) return { error: "Tu sesión expiró." };

  const contactoEmail = texto(formData, "contactoEmail", 200).toLowerCase();
  if (contactoEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactoEmail)) {
    return { error: "Revisa el correo de contacto." };
  }
  const instagram = texto(formData, "instagram", 100).replace(/^@/, "");

  const data = {
    contactoEmail,
    whatsapp: texto(formData, "whatsapp", 40),
    instagram,
    direccion: texto(formData, "direccion", 300),
  };
  await db.configuracion.upsert({ where: { id: "general" }, update: data, create: { id: "general", ...data } });
  refrescar();
  return { ok: true };
}

export async function guardarHorarioAction(_prev: ConfigState, formData: FormData): Promise<ConfigState> {
  if (!(await soloAdmin())) return { error: "Tu sesión expiró." };

  const semana: Semana = Array.from({ length: 7 }, (_, dia) =>
    formData
      .getAll(`dia-${dia}`)
      .map(Number)
      .filter((h) => HORAS_EDITABLES.includes(h))
      .sort((a, b) => a - b),
  );
  if (semana.every((horas) => horas.length === 0)) {
    return { error: "Deja al menos un bloque abierto; si no, nadie podrá reservar." };
  }

  const horario = serializarSemana(semana);
  await db.configuracion.upsert({
    where: { id: "general" },
    update: { horario },
    create: { id: "general", horario },
  });
  refrescar();
  return { ok: true };
}

export async function guardarPoliticasAction(_prev: ConfigState, formData: FormData): Promise<ConfigState> {
  if (!(await soloAdmin())) return { error: "Tu sesión expiró." };

  const horas = Number(formData.get("cancelacionHoras"));
  if (!Number.isInteger(horas) || horas < 0 || horas > 168) {
    return { error: "La anticipación para cancelar va de 0 a 168 horas." };
  }

  const data = {
    cancelacionHoras: horas,
    cancelacionTexto: texto(formData, "cancelacionTexto"),
    instruccionesPago: texto(formData, "instruccionesPago"),
    avisoCrisis: texto(formData, "avisoCrisis"),
  };
  await db.configuracion.upsert({ where: { id: "general" }, update: data, create: { id: "general", ...data } });
  refrescar();
  return { ok: true };
}

/** Publicar un cambio crea una versión nueva; las anteriores no se tocan. */
export async function publicarDocumentoAction(_prev: ConfigState, formData: FormData): Promise<ConfigState> {
  if (!(await soloAdmin())) return { error: "Tu sesión expiró." };

  const tipo = String(formData.get("tipo") ?? "");
  if (!esTipoLegal(tipo)) return { error: "Documento desconocido." };

  const titulo = texto(formData, "titulo", 120) || LEGAL_META[tipo].titulo;
  const contenido = String(formData.get("contenido") ?? "").replace(/\r\n/g, "\n").trim().slice(0, 60000);
  if (contenido.length < 100) return { error: "El documento es demasiado corto." };

  const vigente = await documentoVigente(tipo);
  if (vigente.contenido.trim() === contenido && vigente.titulo === titulo) {
    return { error: "No hay cambios respecto de la versión vigente." };
  }

  await db.documentoLegal.create({ data: { tipo, version: vigente.version + 1, titulo, contenido } });
  revalidatePath(LEGAL_META[tipo].ruta);
  revalidatePath("/admin/configuracion", "layout");
  return { ok: true };
}
