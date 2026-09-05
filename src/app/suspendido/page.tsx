import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLicenciaStatus } from "@/lib/licencia";
import { LicenciaBloqueada } from "@/components/licencia";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Servicio pausado", robots: { index: false } };

/**
 * Pantalla del corte por licencia, en una ruta propia.
 *
 * Vive aparte a propósito. Si el layout privado se limitara a devolver esta
 * pantalla en vez de sus hijos, la página bloqueada igual se renderizaría y sus
 * datos viajarían en el payload RSC: se vería el bloqueo, pero la información
 * saldría del servidor igual. Redirigiendo aquí, la página nunca llega a correr.
 */
export default async function SuspendidoPage() {
  const licencia = await getLicenciaStatus();
  if (!licencia.bloqueada) redirect("/mi-espacio");

  return <LicenciaBloqueada licencia={licencia} />;
}
