import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { shortDate } from "@/lib/format";
import { documentoVigente, esTipoLegal, LEGAL_META } from "@/lib/legal";
import { LegalEditor } from "./legal-editor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Documento legal" };

export default async function EditarLegalPage({ params }: { params: Promise<{ tipo: string }> }) {
  await requireAdmin();
  const tipo = (await params).tipo.toUpperCase();
  if (!esTipoLegal(tipo)) notFound();

  const vigente = await documentoVigente(tipo);
  const versiones = await db.documentoLegal.findMany({
    where: { tipo },
    orderBy: { version: "desc" },
    include: { _count: { select: { aceptaciones: true } } },
  });

  const aviso =
    tipo === "CONSENTIMIENTO"
      ? "Tus clientas tendrán que aceptarla antes de su próxima reserva."
      : "Tus clientas verán un aviso en su espacio para aceptarla.";

  return (
    <div className="space-y-8">
      <header>
        <Link href="/admin/configuracion#legales" className="text-[0.8125rem] text-muted hover:text-ink">
          ← Configuración
        </Link>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">{LEGAL_META[tipo].titulo}</h1>
        <p className="mt-2 text-ink-soft">
          Estás editando sobre la versión {vigente.version}. Al publicar se crea la versión {vigente.version + 1}; las
          anteriores se conservan con quién las aceptó y cuándo.
        </p>
      </header>

      <section className="card-soft p-6 sm:p-7">
        <LegalEditor
          tipo={tipo}
          titulo={vigente.titulo}
          contenido={vigente.contenido}
          version={vigente.version}
          avisoReaceptar={aviso}
        />
      </section>

      <section className="card-soft p-6">
        <p className="eyebrow text-muted">Historial de versiones</p>
        <ul className="mt-4 divide-y divide-line">
          {versiones.map((v) => (
            <li key={v.id} className="flex items-center justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0">
              <span>
                <span className="font-semibold">Versión {v.version}</span>
                {v.id === vigente.id ? <span className="ml-2 text-moss-deep">· vigente</span> : null}
              </span>
              <span className="text-muted">
                {shortDate(v.createdAt)} · {v._count.aceptaciones}{" "}
                {v._count.aceptaciones === 1 ? "aceptación" : "aceptaciones"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
