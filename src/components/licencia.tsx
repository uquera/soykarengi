import Link from "next/link";
import { BrandMark } from "@/components/brand";
import { CONTACTO_SOPORTE, type LicenciaStatus } from "@/lib/licencia";

/** La licencia se cuenta en días de calendario, no en horas de zona horaria. */
function fechaLarga(d: Date) {
  return d.toLocaleDateString("es-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Aviso previo al vencimiento. Vive en la cabecera del panel de Karen: es ella
 * quien paga, así que es la única que necesita verlo. La web pública sigue
 * intacta.
 */
export function LicenciaBanner({ licencia }: { licencia: LicenciaStatus }) {
  if (!licencia.mostrarBanner) return null;

  const dias = licencia.diasRestantes;
  const cuenta = dias <= 1 ? "queda 1 día" : `quedan ${dias} días`;

  return (
    <div className="border-b border-amber/40 bg-amber/12">
      <div className="shell flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-[0.8125rem] text-amber-ink">
        <span aria-hidden="true">⚠</span>
        <span>
          Tu suscripción vence el{" "}
          <strong>{licencia.fechaVencimiento ? fechaLarga(licencia.fechaVencimiento) : "—"}</strong> (
          {cuenta}). Envía el comprobante a{" "}
          <a href={`mailto:${CONTACTO_SOPORTE}`} className="font-semibold underline underline-offset-2">
            {CONTACTO_SOPORTE}
          </a>{" "}
          para renovar.
        </span>
        <Link href="/admin/licencia" className="ml-auto font-semibold underline underline-offset-2">
          Ver licencia
        </Link>
      </div>
    </div>
  );
}

/**
 * Interruptor de corte. Reemplaza el contenido de las zonas privadas cuando la
 * licencia está suspendida o vencida; la web pública y /admin/licencia siguen
 * abiertas, para que Karen pueda ver qué pasó y a quién escribirle.
 */
export function LicenciaBloqueada({ licencia }: { licencia: LicenciaStatus }) {
  const porFecha = !licencia.suspendidaManual;

  return (
    <div className="grid min-h-dvh place-items-center bg-cream px-5 py-16">
      <div className="card-soft w-full max-w-md p-9 text-center">
        <div className="flex justify-center">
          <BrandMark size={56} />
        </div>

        <h1 className="mt-6 font-[family-name:var(--font-display)] text-2xl">
          {porFecha ? "Tu suscripción venció" : "Servicio suspendido"}
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          {porFecha ? (
            <>
              El acceso a la plataforma está pausado desde el{" "}
              <strong>
                {licencia.fechaVencimiento ? fechaLarga(licencia.fechaVencimiento) : "vencimiento"}
              </strong>
              . Tus datos están intactos: al renovar vuelve todo tal como lo dejaste.
            </>
          ) : (
            <>
              El acceso a la plataforma está pausado temporalmente. Tus datos están intactos: al
              reactivar vuelve todo tal como lo dejaste.
            </>
          )}
        </p>

        <a
          href={`mailto:${CONTACTO_SOPORTE}`}
          className="mt-7 inline-flex rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-ink-soft"
        >
          Escribir a soporte
        </a>

        <p className="mt-4 text-xs text-muted">
          {CONTACTO_SOPORTE} · Si ya hiciste el pago, la reactivación es inmediata.
        </p>

        <p className="mt-6 border-t border-line pt-5 text-xs text-muted">
          <Link href="/admin/licencia" className="underline underline-offset-2 hover:text-ink">
            Ver el detalle de la licencia
          </Link>
        </p>
      </div>
    </div>
  );
}
