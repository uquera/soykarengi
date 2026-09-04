import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SPECIALTY_PAGES } from "@/lib/domain";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://karengi.srv1485601.hstgr.cloud";

/** El buscador tiene que poder llegar a cada ficha, no sólo a la portada. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, categories, designs, posts] = await Promise.all([
    db.service.findMany({ where: { active: true }, select: { slug: true } }),
    db.designCategory.findMany({ where: { active: true }, select: { slug: true } }),
    db.design.findMany({ where: { active: true }, select: { slug: true } }),
    db.post.findMany({ where: { published: true }, select: { slug: true, publishedAt: true } }),
  ]);

  const url = (path: string) => `${SITE_URL}${path}`;
  const now = new Date();

  const fixed: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: url("/acompanamiento"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: url("/acompanamiento/servicios"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: url("/acompanamiento/especialidades"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: url("/acompanamiento/agenda"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: url("/crp"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: url("/disenos"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: url("/configurador"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: url("/recursos"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: url("/blog"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: url("/contacto"), lastModified: now, changeFrequency: "yearly", priority: 0.5 },
  ];

  return [
    ...fixed,
    ...SPECIALTY_PAGES.map((p) => ({
      url: url(`/acompanamiento/${p.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...services.map((s) => ({
      url: url(`/acompanamiento/servicios/${s.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...categories.map((c) => ({
      url: url(`/disenos/categoria/${c.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...designs.map((d) => ({
      url: url(`/disenos/${d.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...posts.map((p) => ({
      url: url(`/blog/${p.slug}`),
      lastModified: p.publishedAt,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
  ];
}
