import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getLicenciaStatus, CONTACTO_SOPORTE, AVISO_DIAS } from "@/lib/licencia";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Licencia" };

/** Las fechas de licencia son días de calendario: se formatean en UTC. */
function fecha(d: Date) {
  return d.toLocaleDateString("es-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function periodo(inicio: Date, fin: Date) {
  const mismoMes =
    inicio.getUTCMonth() === fin.getUTCMonth() && inicio.getUTCFullYear() === fin.getUTCFullYear();
  if (mismoMes) {
    const label = inicio.toLocaleDateString("es-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  const corto = (d: Date) =>
    d.toLocaleDateString("es-US", { day: "numeric", month: "short", timeZone: "UTC" });
  return `${corto(inicio)} – ${corto(fin)} ${fin.getUTCFullYear()}`;
}

function dinero(monto: number, moneda: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: moneda || "USD",
    maximumFractionDigits: monto % 1 === 0 ? 0 : 2,
  }).format(monto);
}

function Fila({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-line py-4 first:border-0 first:pt-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-semibold">{children}</span>
    </div>
  );
}

export default async function LicenciaPage() {
  await requireAdmin();

  const [licencia, pagos] = await Promise.all([
    getLicenciaStatus(),
    db.pagoLicencia.findMany({ orderBy: { fechaPago: "desc" }, take: 12 }).catch(() => []),
  ]);

  const estado = !licencia.existe
    ? { label: "Sin configurar", color: "#857060" }
    : licencia.suspendidaManual
      ? { label: "Suspendida", color: "#9C3B52" }
      : licencia.diasRestantes <= 0
        ? { label: "Vencida", color: "#9C3B52" }
        : licencia.mostrarBanner
          ? { label: "Por vencer", color: "#B4823C" }
          : { label: "Activa", color: "#494C31" };

  return (
    <div className="max-w-2xl space-y-8">
      <header>
        <p className="eyebrow text-muted">Transversal</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">Licencia</h1>
        <p className="mt-2 text-ink-soft">
          El estado de tu suscripción a la plataforma y el historial de pagos.
        </p>
      </header>

      <section className="card-soft p-6 sm:p-7">
        <Fila label="Estado">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.6875rem] font-semibold"
            style={{ background: `${estado.color}1F`, color: estado.color }}
          >
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: estado.color }} />
            {estado.label}
          </span>
        </Fila>

        {licencia.existe ? (
          <>
            <Fila label="Plan">{licencia.plan}</Fila>
            <Fila label="Vencimiento">
              {licencia.fechaVencimiento ? fecha(licencia.fechaVencimiento) : "—"}
            </Fila>
            <Fila label="Días restantes">
              <span
                style={{
                  color: licencia.diasRestantes <= AVISO_DIAS ? "#B4823C" : undefined,
                }}
              >
                {Math.max(licencia.diasRestantes, 0)}
              </span>
            </Fila>

            {!licencia.bloqueada ? (
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-shell">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(3, (licencia.diasRestantes / 365) * 100))}%`,
                    background: licencia.diasRestantes <= AVISO_DIAS ? "#B4823C" : "#494C31",
                  }}
                />
              </div>
            ) : null}
          </>
        ) : null}
      </section>

      {/* Qué significa el estado, en una frase */}
      {licencia.bloqueada ? (
        <div className="rounded-2xl border border-rose/40 bg-rose-soft p-6 text-sm leading-relaxed text-rose-deep">
          <p className="font-semibold">
            {licencia.suspendidaManual ? "Servicio suspendido" : "Suscripción vencida"}
          </p>
          <p className="mt-2">
            El acceso al panel y a Mi espacio está pausado. Tus datos están intactos. Escribe a{" "}
            <a href={`mailto:${CONTACTO_SOPORTE}`} className="font-semibold underline underline-offset-2">
              {CONTACTO_SOPORTE}
            </a>{" "}
            para reactivar.
          </p>
        </div>
      ) : licencia.mostrarBanner ? (
        <div className="rounded-2xl border border-amber/40 bg-amber/10 p-6 text-sm leading-relaxed text-amber-ink">
          <p className="font-semibold">Tu suscripción está por vencer</p>
          <p className="mt-2">
            Quedan <strong>{licencia.diasRestantes}</strong> días. Realiza el pago y envía el
            comprobante a{" "}
            <a href={`mailto:${CONTACTO_SOPORTE}`} className="font-semibold underline underline-offset-2">
              {CONTACTO_SOPORTE}
            </a>{" "}
            para evitar la suspensión.
          </p>
        </div>
      ) : licencia.existe ? (
        <div className="rounded-2xl border border-moss/40 bg-moss-soft p-6 text-sm leading-relaxed text-moss-deep">
          Tu suscripción está activa y vigente. No hace falta que hagas nada.
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-shell/60 p-6 text-sm leading-relaxed text-ink-soft">
          Todavía no hay una licencia registrada en esta instalación, así que la plataforma funciona
          sin restricciones. Se activa cuando Hypnos la sincroniza desde su panel.
        </div>
      )}

      <section className="card-soft p-6 sm:p-7">
        <h2 className="eyebrow text-muted">Historial de pagos</h2>

        {pagos.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Todavía no hay pagos registrados.</p>
        ) : (
          <div className="mt-4 divide-y divide-line">
            {pagos.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 py-3.5">
                <div className="min-w-0">
                  <p className="font-semibold">{periodo(p.periodoInicio, p.periodoFin)}</p>
                  <p className="mt-0.5 text-[0.8125rem] text-muted">
                    Pagado el {fecha(p.fechaPago)}
                    {p.notas ? ` · ${p.notas}` : ""}
                  </p>
                </div>
                <span className="font-[family-name:var(--font-display)] text-lg tabular-nums whitespace-nowrap">
                  {dinero(p.monto, p.moneda)}
                </span>
              </div>
            ))}
          </div>
        )}

        <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
          Consultas sobre la suscripción:{" "}
          <a href={`mailto:${CONTACTO_SOPORTE}`} className="underline underline-offset-2 hover:text-ink">
            {CONTACTO_SOPORTE}
          </a>
        </p>
      </section>

      <section className="rounded-2xl border border-line bg-shell/50 p-5">
        <p className="eyebrow mb-3 text-muted">Información técnica</p>
        <dl className="space-y-1.5 font-mono text-xs text-muted">
          <div>
            Endpoint: <span className="text-ink-soft">/api/gobernanza/licencia</span>
          </div>
          <div>
            App: <span className="text-ink-soft">karengi.srv1485601.hstgr.cloud</span>
          </div>
          <div>
            Puerto interno: <span className="text-ink-soft">3023</span>
          </div>
        </dl>
      </section>
    </div>
  );
}
