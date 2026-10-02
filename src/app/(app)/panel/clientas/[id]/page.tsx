import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { cuandoHumano, PASO_LABEL, pasoPedido, primerNombre, whatsappDe } from "@/lib/simple";
import { FileUploader } from "@/components/file-uploader";
import { ArchivoList } from "@/components/archivo-list";
import { BTN, Encabezado, Seccion } from "@/components/panel-sencillo-ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Clienta" };

const ESTADO_CITA: Record<string, string> = {
  PENDIENTE: "Por confirmar",
  CONFIRMADA: "Confirmada",
  COMPLETADA: "Realizada",
  CANCELADA: "Cancelada",
};

/** Todo de una persona: contacto, archivos, citas y pedidos. */
export default async function ClientaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const c = await db.user.findUnique({
    where: { id },
    include: {
      appointments: { orderBy: { startsAt: "desc" }, include: { service: true } },
      designRequests: { orderBy: { createdAt: "desc" }, include: { design: true } },
      archivos: { where: { requestId: null }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!c || c.role === "ADMIN") notFound();

  const nombre = primerNombre(c.name);
  const whatsapp = whatsappDe(c.phone);
  const enviados = c.archivos.filter((a) => a.tipo === "COMPARTIDO");
  const recibidos = c.archivos.filter((a) => a.tipo === "DE_CLIENTA" || a.tipo === "REFERENCIA");
  const ahora = new Date();
  const proximas = c.appointments.filter((a) => a.startsAt >= ahora && (a.status === "PENDIENTE" || a.status === "CONFIRMADA"));
  const pasadas = c.appointments.filter((a) => !proximas.includes(a)).slice(0, 10);

  return (
    <div className="space-y-8">
      <Encabezado titulo={c.name} volver={{ href: "/panel/clientas", label: "Clientas" }} />

      <div className="flex flex-wrap gap-3">
        {whatsapp ? (
          <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener" className={BTN.confirmar}>
            WhatsApp
          </a>
        ) : null}
        <a href={`mailto:${c.email}`} className={BTN.secundario}>
          Escribirle un correo
        </a>
      </div>
      <p className="-mt-5 px-1 text-[0.9375rem] text-muted">
        {c.email}
        {c.phone ? ` · ${c.phone}` : ""}
      </p>

      <Seccion titulo={`Mandarle un archivo a ${nombre}`}>
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="mb-4 text-[1rem] text-ink-soft">
            Un ejercicio, una lectura, un audio… Le llega un aviso por correo y solo ella puede abrirlo.
          </p>
          <FileUploader tipo="COMPARTIDO" userId={c.id} conNota />
        </div>
        {enviados.length > 0 ? (
          <div className="rounded-2xl border border-line bg-white p-5">
            <p className="mb-3 text-[0.9375rem] font-semibold text-muted">Lo que le has mandado</p>
            <ArchivoList archivos={enviados} puedeBorrar estadoVisto />
          </div>
        ) : null}
      </Seccion>

      {recibidos.length > 0 ? (
        <Seccion titulo={`Lo que ${nombre} te mandó`}>
          <div className="rounded-2xl border border-line bg-white p-5">
            <ArchivoList archivos={recibidos} />
          </div>
        </Seccion>
      ) : null}

      <Seccion titulo="Citas">
        {c.appointments.length === 0 ? (
          <p className="px-1 text-ink-soft">Todavía no ha tenido citas.</p>
        ) : (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
            {[...proximas.reverse(), ...pasadas].map((a) => (
              <li key={a.id}>
                <Link href={`/panel/cita/${a.id}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-shell/50">
                  <span>
                    <span className="block font-semibold text-ink">{cuandoHumano(a.startsAt)}</span>
                    <span className="text-[0.9375rem] text-muted">{a.service.name}</span>
                  </span>
                  <span className="shrink-0 text-[0.875rem] font-semibold text-muted">{ESTADO_CITA[a.status] ?? a.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Seccion>

      {c.designRequests.length > 0 ? (
        <Seccion titulo="Pedidos de diseño">
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
            {c.designRequests.map((r) => (
              <li key={r.id}>
                <Link href={`/panel/pedido/${r.id}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-shell/50">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink">{r.design?.name ?? `Diseño para ${r.recipient}`}</span>
                    <span className="text-[0.9375rem] text-muted">{r.code}</span>
                  </span>
                  <span className="shrink-0 text-[0.875rem] font-semibold text-muted">{PASO_LABEL[pasoPedido(r.status)]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Seccion>
      ) : null}
    </div>
  );
}
