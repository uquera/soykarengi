import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { buscarAccion } from "@/lib/acciones-correo";
import { cuandoHumano } from "@/lib/simple";
import { BrandMark } from "@/components/brand";
import { ConfirmarCita } from "./confirmar-cita";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Confirmar cita", robots: { index: false } };

/**
 * Destino del botón «Confirmar cita» del correo de Karen. Abrir la página no
 * cambia nada: muestra la cita y espera su «Sí». Así, si el programa de
 * correo abre el enlace por su cuenta para revisarlo, no confirma nada.
 */
export default async function AccionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const accion = await buscarAccion(token);
  const vigente = Boolean(accion && !accion.usedAt && accion.expiresAt > new Date());
  const cita =
    accion?.tipo === "CONFIRMAR_CITA"
      ? await db.appointment.findUnique({ where: { id: accion.refId }, include: { user: true, service: true } })
      : null;

  return (
    <main className="grid min-h-dvh place-items-center bg-cream px-5 py-12">
      <div className="w-full max-w-md rounded-3xl border border-line bg-white p-8 text-center">
        <div className="flex justify-center">
          <BrandMark size={52} />
        </div>

        {/* Ya confirmada (recién, con este botón, o antes desde el panel): se dice así,
            no como error. Pasa también justo después de tocar «Sí, confirmar». */}
        {cita && cita.status === "CONFIRMADA" ? (
          <>
            <p className="mt-6 text-[2rem]" aria-hidden="true">
              ✓
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-[1.75rem] text-moss-deep">Cita confirmada</h1>
            <p className="mt-2 text-[1.0625rem] text-ink-soft">
              {cita.user.name} · {cuandoHumano(cita.startsAt)}
            </p>
            <p className="mt-1 text-[1rem] text-muted">A {cita.user.name.split(" ")[0]} le llegó el aviso por correo.</p>
            <Link href={`/panel/cita/${cita.id}`} className="mt-6 inline-flex rounded-2xl bg-ink px-6 py-3.5 text-base font-semibold text-cream">
              Ver la cita
            </Link>
          </>
        ) : !cita || !vigente ? (
          <>
            <h1 className="mt-6 font-[family-name:var(--font-display)] text-[1.75rem] text-ink">Este enlace ya no sirve</h1>
            <p className="mt-2 text-[1.0625rem] text-ink-soft">Ya se usó o venció. Puedes ver la cita en tu panel.</p>
            <Link href="/panel" className="mt-6 inline-flex rounded-2xl bg-ink px-6 py-3.5 text-base font-semibold text-cream">
              Ir a mi panel
            </Link>
          </>
        ) : cita.status !== "PENDIENTE" ? (
          <>
            <h1 className="mt-6 font-[family-name:var(--font-display)] text-[1.75rem] text-ink">
              {cita.status === "CONFIRMADA" ? "Esta cita ya está confirmada" : "Esta cita ya no está por confirmar"}
            </h1>
            <p className="mt-2 text-[1.0625rem] text-ink-soft">
              {cita.user.name} · {cuandoHumano(cita.startsAt)}
            </p>
            <Link href={`/panel/cita/${cita.id}`} className="mt-6 inline-flex rounded-2xl bg-ink px-6 py-3.5 text-base font-semibold text-cream">
              Ver la cita
            </Link>
          </>
        ) : (
          <>
            <p className="mt-6 text-[1rem] font-semibold text-muted">¿Confirmas esta cita?</p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-[1.875rem] leading-tight text-ink">{cita.user.name}</h1>
            <p className="mt-2 text-[1.125rem] text-ink">{cuandoHumano(cita.startsAt)}</p>
            <p className="text-[1rem] text-ink-soft">
              {cita.service.name} · {cita.modality}
            </p>
            <ConfirmarCita token={token} nombre={cita.user.name.split(" ")[0]} citaId={cita.id} />
          </>
        )}
      </div>
    </main>
  );
}
