import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { getLocale } from "@/lib/i18n";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const META = {
  es: {
    title: "Karen Ramos · Acompañamiento, Creación y Propósito",
    description:
      "Un espacio para acompañarte y crear momentos con propósito. Psicología, Life Coaching y mentoría junto a Diseños con Propósito para eventos, regalos y celebraciones.",
    og: "Porque hay momentos que necesitan ser acompañados… y otros que merecen ser recordados.",
    keywords: ["psicología", "life coach", "mentoría", "diseños personalizados", "SoyKarengi", "Karen Ramos"],
  },
  en: {
    title: "Karen Ramos · Support, Creation and Purpose",
    description:
      "A space to walk with you and to create moments with purpose. Psychology, Life Coaching and mentoring alongside Designs with Purpose for events, gifts and celebrations.",
    og: "Because some moments need company… and others deserve to be remembered.",
    keywords: ["psychologist", "life coach", "mentoring", "custom designs", "SoyKarengi", "Karen Ramos"],
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = META[locale];

  return {
    title: { default: m.title, template: "%s · Karen Ramos" },
    description: m.description,
    keywords: [...m.keywords],
    openGraph: {
      title: m.title,
      description: m.og,
      type: "website",
      locale: locale === "en" ? "en_US" : "es_US",
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body className={`${fraunces.variable} ${manrope.variable} antialiased`}>{children}</body>
    </html>
  );
}
