import type { Design, DesignCategory, Post, Service } from "@prisma/client";
import { pick, type Locale } from "./i18n";

/**
 * El contenido se escribe en español y, opcionalmente, en inglés desde el panel.
 * Estas vistas resuelven el idioma una sola vez y devuelven la fila ya traducida,
 * para que las páginas no tengan que acordarse del fallback en cada campo.
 */

export function serviceView(s: Service, locale: Locale) {
  return {
    ...s,
    name: pick(locale, s.name, s.nameEn),
    summary: pick(locale, s.summary, s.summaryEn),
    description: pick(locale, s.description, s.descriptionEn),
    forWho: pick(locale, s.forWho, s.forWhoEn),
    whatToExpect: pick(locale, s.whatToExpect, s.whatToExpectEn),
    specialty: pick(locale, s.specialty, s.specialtyEn),
    modalityLabel: pick(locale, s.modality, s.modalityEn),
  };
}

export function categoryView(c: DesignCategory, locale: Locale) {
  return {
    ...c,
    name: pick(locale, c.name, c.nameEn),
    description: pick(locale, c.description, c.descriptionEn),
  };
}

export function designView<T extends Design & { category?: DesignCategory }>(d: T, locale: Locale) {
  return {
    ...d,
    name: pick(locale, d.name, d.nameEn),
    tagline: pick(locale, d.tagline, d.taglineEn),
    description: pick(locale, d.description, d.descriptionEn),
    delivery: pick(locale, d.delivery, d.deliveryEn),
    customFields: pick(locale, d.customFields, d.customFieldsEn),
    categoryName: d.category ? pick(locale, d.category.name, d.category.nameEn) : "",
  };
}

export function postView(p: Post, locale: Locale) {
  return {
    ...p,
    title: pick(locale, p.title, p.titleEn),
    excerpt: pick(locale, p.excerpt, p.excerptEn),
    content: pick(locale, p.content, p.contentEn),
    tag: pick(locale, p.tag, p.tagEn),
  };
}

/** Nombre de un diseño para listados donde puede no venir la relación cargada. */
export function designName(
  d: { name: string; nameEn: string | null } | null | undefined,
  locale: Locale,
  fallback: string,
) {
  return d ? pick(locale, d.name, d.nameEn) : fallback;
}
