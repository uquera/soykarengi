import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { dateTime, money, shortDate } from "@/lib/format";
import { APPOINTMENT_LABEL, SEGMENT_LABEL, segmentOf } from "@/lib/domain";
import { INTERES_LABEL, parseInteres } from "@/lib/unidad";
import { LEGAL_META, type TipoLegal } from "@/lib/legal";
import { Badge } from "@/components/ui";
import { StatusPill } from "@/components/request-timeline";
import { FileUploader } from "@/components/file-uploader";
import { ArchivoList } from "@/components/archivo-list";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const user = await db.user.findUnique({ where: { id }, select: { name: true } });
  return { title: user?.name ?? "Clienta" };
}

/**
 * La ficha de una clienta: sus datos, su historial en las dos unidades y su
 * carpeta de archivos. Es donde Karen le comparte material a una persona.
 */
export default async function FichaClientePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const cliente = await db.user.findUnique({
    where: { id },
    include: {
      appointments: { orderBy: { startsAt: "desc" }, include: { service: true } },
      designRequests: { orderBy: { createdAt: "desc" }, include: { design: true } },
      archivos: { orderBy: { createdAt: "desc" } },
      aceptaciones: { orderBy: { aceptadoAt: "desc" }, include: { documento: true } },
    },
  });
  if (!cliente || cliente.role === "ADMIN") notFound();

  const compartidos = cliente.archivos.filter((a) => a.tipo === "COMPARTIDO" || a.tipo === "ENTREGABLE");
  const recibidos = cliente.archivos.filter((a) => a.tipo === "DE_CLIENTA" || a.tipo === "REFERENCIA");
  const segmento = segmentOf(cliente.appointments.length, cliente.designRequests.length);
  const interes = parseInteres(cliente.interest);

  return (
    <div className="space-y-8">
      <header>
        <Link href="/admin/clientes" className="text-[0.8125rem] text-muted hover:text-ink">
          ← Clientes
        </Link>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">{cliente.name}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone="muted">{SEGMENT_LABEL[segmento]}</Badge>
          {interes ? <Badge tone="muted">{INTERES_LABEL[interes]}</Badge> : null}
        </div>
        <p className="mt-3 text-ink-soft">
          <a href={`mailto:${cliente.email}`} className="underline underline-offset-2">
            {cliente.email}
          </a>
          {cliente.phone ? ` · ${cliente.phone}` : ""}
          {cliente.city ? ` · ${cliente.city}` : ""}
          {` · desde ${shortDate(cliente.createdAt)}`}
        </p>
      </header>

      {/* ── Carpeta ─────────────────────────────────────────────────────── */}
      <section className="card-soft p-6 sm:p-7">
        <p className="eyebrow text-orchid-deep">Compartir con {cliente.name.split(" ")[0]}</p>
        <p className="mt-2 text-sm text-ink-soft">
          Materiales, ejercicios, lecturas o documentos. Le llega un aviso por correo y los descarga desde su
          espacio. Solo ella y tú pueden abrirlos.
        </p>
        <div className="mt-5">
          <FileUploader tipo="COMPARTIDO" userId={cliente.id} conNota />
        </div>

        {compartidos.length > 0 ? (
          <div className="mt-7 border-t border-line pt-6">
            <p className="mb-4 text-sm font-semibold">Lo que le has compartido · {compartidos.length}</p>
            <ArchivoList archivos={compartidos} puedeBorrar estadoVisto />
          </div>
        ) : null}
      </section>

      <section className="card-soft p-6 sm:p-7">
        <p className="eyebrow text-moss-deep">Lo que ella te envió · {recibidos.length}</p>
        {recibidos.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Todavía no te ha enviado archivos. Puede hacerlo desde «Mis archivos» o al pedir un diseño.
          </p>
        ) : (
          <div className="mt-5">
            <ArchivoList archivos={recibidos} puedeBorrar />
          </div>
        )}
      </section>

      {/* ── Documentos aceptados ───────────────────────────────────────── */}
      <section className="card-soft p-6">
        <p className="eyebrow text-muted">Documentos aceptados</p>
        {cliente.aceptaciones.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Todavía no aceptó ningún documento. Se le pedirá al entrar a su espacio y antes de su próxima reserva.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {cliente.aceptaciones.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm first:pt-0 last:pb-0">
                <span>
                  <span className="font-semibold">{LEGAL_META[a.documento.tipo as TipoLegal]?.titulo ?? a.documento.tipo}</span>{" "}
                  <span className="text-muted">· versión {a.documento.version}</span>
                </span>
                <span className="text-[0.8125rem] text-muted">
                  {dateTime(a.aceptadoAt)}
                  {a.ip ? ` · IP ${a.ip}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Historial ───────────────────────────────────────────────────── */}
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="card-soft p-6">
          <p className="eyebrow text-orchid-deep">Citas · {cliente.appointments.length}</p>
          {cliente.appointments.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Sin citas.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {cliente.appointments.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{a.service.name}</p>
                    <p className="mt-0.5 text-[0.8125rem] text-muted">
                      {dateTime(a.startsAt)} · {a.modality} · {a.code}
                    </p>
                  </div>
                  <Badge tone={a.status === "CANCELADA" ? "muted" : a.status === "PENDIENTE" ? "rose" : "moss"}>
                    {APPOINTMENT_LABEL[a.status] ?? a.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-soft p-6">
          <div className="flex items-center justify-between">
            <p className="eyebrow text-moss-deep">Diseños · {cliente.designRequests.length}</p>
            <Link href="/admin/solicitudes?f=todas" className="text-[0.8125rem] text-muted hover:text-ink">
              Ver solicitudes →
            </Link>
          </div>
          {cliente.designRequests.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Sin solicitudes.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {cliente.designRequests.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{r.design?.name ?? "Diseño a medida"}</p>
                    <p className="mt-0.5 text-[0.8125rem] text-muted">
                      {r.code} · {shortDate(r.createdAt)}
                      {r.quoteAmount ? ` · ${money(r.quoteAmount)}` : ""}
                    </p>
                  </div>
                  <StatusPill status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
