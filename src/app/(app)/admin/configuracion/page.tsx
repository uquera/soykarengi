import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { shortDate } from "@/lib/format";
import {
  AVISO_CRISIS_POR_DEFECTO,
  getConfig,
  HORAS_EDITABLES,
  horarioEnPalabras,
  textoCancelacion,
} from "@/lib/config";
import { documentoVigente, LEGAL_META, TIPOS_LEGALES } from "@/lib/legal";
import { ContactoForm, HorarioForm, PoliticasForm } from "./config-forms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Configuración" };

export default async function ConfiguracionPage() {
  await requireAdmin();
  const [config, fila] = await Promise.all([
    getConfig(),
    db.configuracion.findUnique({ where: { id: "general" } }),
  ]);

  const documentos = await Promise.all(
    TIPOS_LEGALES.map(async (tipo) => {
      const doc = await documentoVigente(tipo);
      const aceptaciones = await db.aceptacion.count({ where: { documentoId: doc.id } });
      return { tipo, doc, aceptaciones };
    }),
  );

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-muted">Transversal</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">Configuración</h1>
        <p className="mt-2 text-ink-soft">
          Tus datos de contacto, tu horario, tus políticas y los documentos legales que aceptan tus clientas.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2 text-[0.8125rem]">
        {[
          ["#contacto", "Contacto"],
          ["#horario", "Horario"],
          ["#politicas", "Políticas y pagos"],
          ["#legales", "Documentos legales"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="rounded-full border border-line bg-white px-4 py-2 font-medium hover:border-ink/40">
            {label}
          </a>
        ))}
      </nav>

      <section id="contacto" className="card-soft scroll-mt-24 p-6 sm:p-7">
        <p className="eyebrow text-orchid-deep">Contacto</p>
        <p className="mt-2 mb-6 text-sm text-ink-soft">Cómo te encuentran tus clientas fuera de la plataforma.</p>
        <ContactoForm
          inicial={{
            contactoEmail: fila?.contactoEmail ?? config.contactoEmail,
            whatsapp: config.whatsapp,
            instagram: config.instagram,
            direccion: config.direccion,
          }}
        />
      </section>

      <section id="horario" className="card-soft scroll-mt-24 p-6 sm:p-7">
        <p className="eyebrow text-orchid-deep">Horario de atención</p>
        <p className="mt-2 text-sm text-ink-soft">
          Hoy se publica así: <span className="font-semibold text-ink">{horarioEnPalabras(config.semana)}</span>
        </p>
        <div className="mt-6">
          <HorarioForm inicial={config.semana} horas={HORAS_EDITABLES} />
        </div>
      </section>

      <section id="politicas" className="card-soft scroll-mt-24 p-6 sm:p-7">
        <p className="eyebrow text-orchid-deep">Políticas y pagos</p>
        <p className="mt-2 mb-6 text-sm text-ink-soft">
          Lo que ven tus clientas al reservar, al cancelar y al aprobar una cotización.
        </p>
        <PoliticasForm
          inicial={{
            cancelacionHoras: config.cancelacionHoras,
            cancelacionTexto: fila?.cancelacionTexto ?? "",
            instruccionesPago: config.instruccionesPago,
            avisoCrisis: fila?.avisoCrisis ?? "",
          }}
          porDefecto={{
            cancelacionTexto: textoCancelacion(config.cancelacionHoras),
            avisoCrisis: AVISO_CRISIS_POR_DEFECTO,
          }}
        />
      </section>

      <section id="legales" className="card-soft scroll-mt-24 p-6 sm:p-7">
        <p className="eyebrow text-orchid-deep">Documentos legales</p>
        <p className="mt-2 text-sm text-ink-soft">
          Cada cambio que publiques es una versión nueva. Las clientas aceptan privacidad y términos al crear su
          cuenta, y el consentimiento informado antes de su primera reserva; si publicas una versión nueva, se les pide
          aceptarla otra vez.
        </p>

        <ul className="mt-6 divide-y divide-line">
          {documentos.map(({ tipo, doc, aceptaciones }) => (
            <li key={tipo} className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
              <div>
                <p className="font-semibold">{LEGAL_META[tipo].titulo}</p>
                <p className="mt-0.5 text-[0.8125rem] text-muted">
                  Versión {doc.version} · desde {shortDate(doc.createdAt)} · {aceptaciones}{" "}
                  {aceptaciones === 1 ? "aceptación" : "aceptaciones"} de esta versión
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={LEGAL_META[tipo].ruta}
                  target="_blank"
                  rel="noopener"
                  className="rounded-full border border-line px-4 py-2 text-[0.8125rem] font-semibold text-ink-soft hover:border-ink/40"
                >
                  Ver
                </a>
                <Link
                  href={`/admin/configuracion/legal/${tipo.toLowerCase()}`}
                  className="rounded-full bg-ink px-4 py-2 text-[0.8125rem] font-semibold text-cream hover:bg-ink-soft"
                >
                  Editar
                </Link>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-6 rounded-xl bg-shell/70 px-4 py-3 text-[0.8125rem] text-ink-soft">
          Los textos iniciales son un punto de partida pensado para tu práctica. Revísalos y, si puedes, valídalos con
          un profesional legal antes de dar la plataforma por definitiva.
        </p>
      </section>
    </div>
  );
}
