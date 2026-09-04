import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://karengi.srv1485601.hstgr.cloud";

/** Lo público se indexa; la cuenta de cada persona y el panel de Karen, no. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/mi-espacio", "/api"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
