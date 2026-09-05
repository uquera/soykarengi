import "server-only";
import { cache } from "react";
import { db } from "./db";

/**
 * Gobernanza SaaS · estado de la licencia de esta instalación.
 *
 * El operador (Hypnos) mueve la fecha de vencimiento y el interruptor de
 * suspensión desde su panel, vía PATCH /api/gobernanza/licencia. Aquí solo se
 * lee y se traduce a las tres preguntas que hace la interfaz: ¿se bloquea?,
 * ¿se avisa?, ¿cuánto queda?
 */
export type LicenciaStatus = {
  /** Sin fila en la base la instalación no está gobernada y no se restringe nada. */
  existe: boolean;
  /** Bloquea el acceso: suspensión explícita del operador o licencia vencida. */
  bloqueada: boolean;
  /** El operador apagó el servicio a mano, no es un vencimiento por fecha. */
  suspendidaManual: boolean;
  /** Negativo cuando ya venció. */
  diasRestantes: number;
  fechaVencimiento: Date | null;
  plan: string;
  /** Aviso previo: aún funciona, pero queda poco. */
  mostrarBanner: boolean;
};

const SIN_LICENCIA: LicenciaStatus = {
  existe: false,
  bloqueada: false,
  suspendidaManual: false,
  diasRestantes: 9999,
  fechaVencimiento: null,
  plan: "BASICO",
  mostrarBanner: false,
};

const DIA_MS = 86_400_000;

/** Umbral de aviso, en días, antes del vencimiento. */
export const AVISO_DIAS = 7;

export const getLicenciaStatus = cache(async (): Promise<LicenciaStatus> => {
  // Una consulta que falle no puede tumbar la plataforma: sin dato, no se
  // restringe. El corte lo decide el operador, no un error de base de datos.
  const lic = await db.licencia.findFirst().catch(() => null);
  if (!lic) return SIN_LICENCIA;

  const diasRestantes = Math.ceil((lic.fechaVencimiento.getTime() - Date.now()) / DIA_MS);
  const vencida = diasRestantes <= 0;

  return {
    existe: true,
    bloqueada: lic.suspendida || vencida,
    suspendidaManual: lic.suspendida,
    diasRestantes,
    fechaVencimiento: lic.fechaVencimiento,
    plan: lic.plan,
    mostrarBanner: !lic.suspendida && !vencida && diasRestantes <= AVISO_DIAS,
  };
});

/** Correo al que se pide la renovación. Se muestra en el banner y en el bloqueo. */
export const CONTACTO_SOPORTE =
  process.env.NEXT_PUBLIC_GOBERNANZA_CONTACTO ?? "hypnosapps@gmail.com";
