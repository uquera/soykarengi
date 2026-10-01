import Link from "next/link";
import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui";
import { businessHoursLabel } from "@/lib/availability";
import { timezoneLabel } from "@/lib/timezone";
import { getDict, getLocale } from "@/lib/i18n";
import { ContactForm } from "./contact-form";
import { getConfig } from "@/lib/config";
import { AvisoCrisis } from "@/components/aviso-crisis";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDict();
  return { title: t.contact.title, description: t.contact.lead };
}

export default async function ContactoPage() {
  const [locale, t, config] = await Promise.all([getLocale(), getDict(), getConfig()]);
  const whatsapp = config.whatsapp.replace(/\D/g, "");
  // Sin dirección configurada no se promete atención presencial.
  const modalidad = config.direccion ? `${t.contact.modalityValue} · ${config.direccion}` : "Online";

  return (
    <div className="shell grid gap-14 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
      <div className="lg:sticky lg:top-28">
        <Eyebrow>{t.contact.eyebrow}</Eyebrow>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl leading-[1.1] text-balance sm:text-5xl">
          {t.contact.title}
        </h1>
        <p className="mt-5 leading-relaxed text-ink-soft">{t.contact.lead}</p>

        <dl className="mt-9 space-y-5 border-t border-line pt-8 text-sm">
          <div>
            <dt className="text-muted">{t.contact.hours}</dt>
            <dd className="mt-1 font-semibold">{await businessHoursLabel(locale)}</dd>
            <dd className="mt-0.5 text-xs text-muted">{timezoneLabel(locale)}</dd>
          </div>
          <div>
            <dt className="text-muted">{t.contact.modality}</dt>
            <dd className="mt-1 font-semibold">{modalidad}</dd>
          </div>
          <div>
            <dt className="text-muted">{t.contact.responseTime}</dt>
            <dd className="mt-1 font-semibold">{t.contact.responseValue}</dd>
          </div>
          {config.contactoEmail || whatsapp ? (
            <div>
              <dt className="text-muted">{locale === "en" ? "Direct contact" : "Contacto directo"}</dt>
              {config.contactoEmail ? (
                <dd className="mt-1 font-semibold">
                  <a href={`mailto:${config.contactoEmail}`} className="underline underline-offset-2">
                    {config.contactoEmail}
                  </a>
                </dd>
              ) : null}
              {whatsapp ? (
                <dd className="mt-1 font-semibold">
                  <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener" className="underline underline-offset-2">
                    WhatsApp {config.whatsapp}
                  </a>
                </dd>
              ) : null}
            </div>
          ) : null}
        </dl>

        <div className="mt-8">
          <AvisoCrisis compacto />
        </div>

        <div className="mt-9 space-y-3">
          <Link
            href="/acompanamiento/agenda"
            className="block rounded-2xl border border-orchid/25 bg-orchid-soft/60 px-5 py-4 transition-colors hover:border-orchid/50"
          >
            <p className="font-semibold text-orchid-deep">{t.contact.knowTitle}</p>
            <p className="mt-1 text-[0.8125rem] text-ink-soft">{t.contact.knowLead}</p>
          </Link>
          <Link
            href="/configurador"
            className="block rounded-2xl border border-rose/25 bg-rose-soft/60 px-5 py-4 transition-colors hover:border-rose/50"
          >
            <p className="font-semibold text-rose-deep">{t.contact.ideaTitle}</p>
            <p className="mt-1 text-[0.8125rem] text-ink-soft">{t.contact.ideaLead}</p>
          </Link>
        </div>
      </div>

      <ContactForm
        copy={{
          name: t.contact.name,
          namePlaceholder: t.contact.namePlaceholder,
          email: t.contact.email,
          phone: t.contact.phone,
          phonePlaceholder: "+1 …",
          optional: t.contact.optional,
          about: t.contact.about,
          unitSupport: t.nav.acompanamiento,
          unitDesigns: t.footer.colDisenos,
          unitGeneral: t.contact.unitGeneral,
          message: t.contact.message,
          messagePlaceholder: t.contact.messagePlaceholder,
          send: t.contact.send,
          sending: t.contact.sending,
          sentTitle: t.contact.sentTitle,
          sentLead: t.contact.sentLead,
        }}
      />
    </div>
  );
}
