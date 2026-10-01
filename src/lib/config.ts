import "server-only";
import { cache } from "react";
import { db } from "./db";

/**
 * Configuración que Karen edita desde /admin/configuracion. Todo campo vacío
 * cae a un valor por defecto razonable, así la plataforma funciona bien aunque
 * ella todavía no haya llenado nada.
 */

/** Horas de inicio de cada bloque, por día (0 = domingo). */
export type Semana = number[][];

export const SEMANA_POR_DEFECTO: Semana = [
  [], // domingo
  [10, 11, 12, 15, 16, 17, 18],
  [10, 11, 12, 15, 16, 17, 18],
  [10, 11, 12, 15, 16, 17, 18],
  [10, 11, 12, 15, 16, 17, 18],
  [10, 11, 12, 15, 16, 17],
  [10, 11, 12, 13], // sábado
];

/** Rango de horas que se pueden elegir en el editor de horario. */
export const HORAS_EDITABLES = Array.from({ length: 15 }, (_, i) => i + 7); // 07 a 21

export const AVISO_CRISIS_POR_DEFECTO =
  "Esta plataforma no es un servicio de emergencias. Si estás en crisis o tu vida o la de otra persona corre peligro, llama al 911 o a la Línea de Crisis y Suicidio 988 (llamada o mensaje de texto, con atención en español) en Estados Unidos. Si estás en otro país, llama al número de emergencias local.";

export type Config = {
  contactoEmail: string;
  whatsapp: string;
  instagram: string;
  direccion: string;
  semana: Semana;
  cancelacionHoras: number;
  cancelacionTexto: string;
  instruccionesPago: string;
  avisoCrisis: string;
};

export function parseSemana(json: string): Semana {
  if (!json) return SEMANA_POR_DEFECTO;
  try {
    const crudo = JSON.parse(json) as Record<string, unknown>;
    return Array.from({ length: 7 }, (_, dia) => {
      const horas = crudo[String(dia)];
      if (!Array.isArray(horas)) return [];
      return [...new Set(horas.map(Number).filter((h) => Number.isInteger(h) && h >= 0 && h <= 23))].sort(
        (a, b) => a - b,
      );
    });
  } catch {
    return SEMANA_POR_DEFECTO;
  }
}

export function serializarSemana(semana: Semana) {
  return JSON.stringify(Object.fromEntries(semana.map((horas, dia) => [String(dia), horas])));
}

export function textoCancelacion(horas: number, locale: "es" | "en" = "es") {
  return locale === "en"
    ? `You can cancel your session from your space up to ${horas} hours before. With less notice, please write to Karen.`
    : `Puedes cancelar tu sesión desde tu espacio hasta ${horas} horas antes. Con menos anticipación, escríbele a Karen.`;
}

export const getConfig = cache(async (): Promise<Config> => {
  const fila = await db.configuracion.findUnique({ where: { id: "general" } });
  const horas = fila?.cancelacionHoras ?? 24;

  return {
    contactoEmail: fila?.contactoEmail || process.env.EMAIL_REPLY_TO || "",
    whatsapp: fila?.whatsapp ?? "",
    instagram: fila?.instagram ?? "",
    direccion: fila?.direccion ?? "",
    semana: parseSemana(fila?.horario ?? ""),
    cancelacionHoras: horas,
    cancelacionTexto: fila?.cancelacionTexto || textoCancelacion(horas),
    instruccionesPago: fila?.instruccionesPago ?? "",
    avisoCrisis: fila?.avisoCrisis || AVISO_CRISIS_POR_DEFECTO,
  };
});

// ─── Horario en palabras ──────────────────────────────────────────────────────

const DIAS = {
  es: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

/** [10,11,12,15,16] → "10:00–13:00 y 15:00–17:00" */
function tramos(horas: number[], y: string) {
  if (horas.length === 0) return "";
  const partes: string[] = [];
  let inicio = horas[0];
  let previa = horas[0];
  for (const h of horas.slice(1)) {
    if (h !== previa + 1) {
      partes.push(`${hh(inicio)}–${hh(previa + 1)}`);
      inicio = h;
    }
    previa = h;
  }
  partes.push(`${hh(inicio)}–${hh(previa + 1)}`);
  return partes.join(` ${y} `);
}

/**
 * Agrupa días consecutivos con el mismo horario:
 * "Lun a Jue 10:00–13:00 y 15:00–19:00 · Vie 10:00–13:00 y 15:00–18:00 · Sáb 10:00–14:00"
 */
export function horarioEnPalabras(semana: Semana, locale: "es" | "en" = "es") {
  const nombres = DIAS[locale];
  const y = locale === "en" ? "and" : "y";
  const a = locale === "en" ? "to" : "a";
  // Lunes primero, domingo al final: así se lee una semana de trabajo.
  const orden = [1, 2, 3, 4, 5, 6, 0];
  const grupos: { desde: number; hasta: number; texto: string }[] = [];

  for (const dia of orden) {
    const texto = tramos(semana[dia] ?? [], y);
    if (!texto) continue;
    const ultimo = grupos.at(-1);
    const consecutivo = ultimo && orden.indexOf(dia) === orden.indexOf(ultimo.hasta) + 1;
    if (ultimo && consecutivo && ultimo.texto === texto) ultimo.hasta = dia;
    else grupos.push({ desde: dia, hasta: dia, texto });
  }

  if (grupos.length === 0) return locale === "en" ? "No hours published" : "Sin horario publicado";

  return grupos
    .map((g) => {
      const dias = g.desde === g.hasta ? nombres[g.desde] : `${nombres[g.desde]} ${a} ${nombres[g.hasta]}`;
      return `${dias} ${g.texto}`;
    })
    .join(" · ");
}

/** Días cerrados, para la nota bajo el horario. */
export function diasCerrados(semana: Semana, locale: "es" | "en" = "es") {
  const largos = {
    es: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
    en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  }[locale];
  return [1, 2, 3, 4, 5, 6, 0].filter((d) => (semana[d] ?? []).length === 0).map((d) => largos[d]);
}

/** El horario en el formato de FullCalendar (businessHours). */
export function rangosCalendario(semana: Semana) {
  return semana.flatMap((horas, dia) => {
    if (horas.length === 0) return [];
    const rangos: { daysOfWeek: number[]; startTime: string; endTime: string }[] = [];
    let inicio = horas[0];
    let previa = horas[0];
    for (const h of horas.slice(1)) {
      if (h !== previa + 1) {
        rangos.push({ daysOfWeek: [dia], startTime: `${hh(inicio)}:00`, endTime: `${hh(previa + 1)}:00` });
        inicio = h;
      }
      previa = h;
    }
    rangos.push({ daysOfWeek: [dia], startTime: `${hh(inicio)}:00`, endTime: `${hh(previa + 1)}:00` });
    return rangos;
  });
}
