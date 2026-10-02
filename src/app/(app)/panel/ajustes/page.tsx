import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getConfig, HORAS_EDITABLES } from "@/lib/config";
import { cambiarPanelAction } from "@/lib/actions/panel";
import { HorarioForm } from "@/app/(app)/admin/configuracion/config-forms";
import { BTN, Encabezado, Seccion } from "@/components/panel-sencillo-ui";
import { PreciosForm } from "./precios-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Ajustes" };

/** WhatsApp de soporte de Hypnos: catálogo, fotos, textos y lo que no está aquí. */
const WHATSAPP_HYPNOS = "56933688302";

/**
 * Lo que Karen ajusta sola: horario, precios, blog y su contraseña. El resto
 * (catálogo, fotos, textos legales, finanzas) lo maneja Hypnos, y aquí hay un
 * botón directo para pedírselo.
 */
export default async function AjustesPage() {
  await requireAdmin();
  const [config, servicios] = await Promise.all([
    getConfig(),
    db.service.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
  ]);

  return (
    <div className="space-y-10">
      <Encabezado titulo="Ajustes" bajada="Lo que puedes cambiar tú misma." />

      <Seccion titulo="Tu horario de atención">
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="mb-4 text-[1rem] text-ink-soft">
            Toca las horas en que puede empezar una sesión. Las oscuras están abiertas.
          </p>
          <HorarioForm inicial={config.semana} horas={HORAS_EDITABLES} />
        </div>
      </Seccion>

      <Seccion titulo="Precios de tus sesiones">
        <PreciosForm
          servicios={servicios.map((s) => ({ id: s.id, nombre: s.name, precio: s.price, aConvenir: Boolean(s.priceNote) }))}
        />
      </Seccion>

      <Seccion titulo="Blog">
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/contenido/nuevo" className={BTN.principal}>
            Escribir una entrada
          </Link>
          <Link href="/admin/contenido" className={BTN.secundario}>
            Ver mis entradas
          </Link>
        </div>
      </Seccion>

      <Seccion titulo="Tu cuenta">
        <div className="flex flex-wrap gap-3">
          <Link href="/mi-espacio/datos" className={BTN.secundario}>
            Cambiar mi contraseña
          </Link>
        </div>
      </Seccion>

      <Seccion titulo="¿Necesitas cambiar otra cosa?">
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="text-[1rem] text-ink-soft">
            Fotos de la vitrina, textos de la web, servicios nuevos o cualquier duda: escríbele al equipo de Hypnos y lo
            hacemos por ti.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_HYPNOS}?text=${encodeURIComponent("Hola, soy Karen de SoyKarengi. Necesito ayuda con: ")}`}
            target="_blank"
            rel="noopener"
            className={`${BTN.confirmar} mt-4 flex-none`}
          >
            Escribir a Hypnos por WhatsApp
          </a>
        </div>
      </Seccion>

      <form action={cambiarPanelAction} className="border-t border-line pt-6 text-center">
        <input type="hidden" name="modo" value="completo" />
        <button type="submit" className="text-[0.9375rem] font-semibold text-muted underline underline-offset-4 hover:text-ink">
          Abrir el panel completo
        </button>
        <p className="mt-1 text-[0.8125rem] text-muted">Tiene todas las opciones. Desde ahí puedes volver a este panel.</p>
      </form>

    </div>
  );
}
