import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { shortDate } from "@/lib/format";
import { getDict, getLocale } from "@/lib/i18n";
import { designName } from "@/lib/content";
import { ArchivoList } from "@/components/archivo-list";
import { FileUploader } from "@/components/file-uploader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Mis archivos" };

/**
 * La carpeta compartida entre la clienta y Karen: arriba lo que Karen le
 * mandó (materiales y entregas), abajo lo que ella le envía a Karen.
 */
export default async function MisArchivosPage() {
  const [user, locale, t] = await Promise.all([requireUser(), getLocale(), getDict()]);
  const c = t.space.files;

  const [archivos, enlaces] = await Promise.all([
    db.archivo.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    // Entregas antiguas que Karen dejó como enlace externo.
    db.deliverable.findMany({
      where: { request: { userId: user.id } },
      orderBy: { createdAt: "desc" },
      include: { request: { include: { design: true } } },
    }),
  ]);

  const deKaren = archivos.filter((a) => a.tipo === "COMPARTIDO" || a.tipo === "ENTREGABLE");
  const enviados = archivos.filter((a) => a.tipo === "DE_CLIENTA" || a.tipo === "REFERENCIA");

  const listCopy = {
    open: c.open,
    download: c.download,
    remove: c.remove,
    confirmRemove: c.confirmRemove,
    seen: "",
    notSeen: "",
    isNew: c.isNew,
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-moss-deep">{c.eyebrow}</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">{c.title}</h1>
        <p className="mt-2 text-ink-soft">{c.lead}</p>
      </header>

      <section className="card-soft p-6 sm:p-7">
        <p className="eyebrow text-orchid-deep">{c.fromKaren}</p>
        {deKaren.length === 0 && enlaces.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{c.fromKarenEmpty}</p>
        ) : null}

        {deKaren.length > 0 ? (
          <div className="mt-5">
            <ArchivoList archivos={deKaren} locale={locale} copy={listCopy} marcarNuevos />
          </div>
        ) : null}

        {enlaces.length > 0 ? (
          <div className="mt-6 border-t border-line pt-5">
            <p className="mb-3 text-sm font-semibold">{c.links}</p>
            <ul className="divide-y divide-line">
              {enlaces.map((f) => (
                <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="font-semibold">{f.name}</p>
                    <p className="mt-0.5 text-[0.8125rem] text-muted">
                      {designName(f.request.design, locale, c.custom)} · {f.request.code} ·{" "}
                      {shortDate(f.createdAt, locale)}
                    </p>
                  </div>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-ink px-4 py-2 text-[0.8125rem] font-semibold text-cream transition-colors hover:bg-ink-soft"
                  >
                    {c.open}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="card-soft p-6 sm:p-7">
        <p className="eyebrow text-moss-deep">{c.toKaren}</p>
        <p className="mt-2 text-sm text-ink-soft">{c.toKarenLead}</p>
        <div className="mt-5">
          <FileUploader tipo="DE_CLIENTA" conNota copy={c.uploader} />
        </div>

        {enviados.length > 0 ? (
          <div className="mt-7 border-t border-line pt-6">
            <p className="mb-4 text-sm font-semibold">
              {c.sent} · {enviados.length}
            </p>
            <ArchivoList archivos={enviados} locale={locale} copy={listCopy} puedeBorrar />
          </div>
        ) : null}
      </section>
    </div>
  );
}
