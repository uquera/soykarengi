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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://karengi.srv1485601.hstgr.cloud";

const META = {
  es: {
    title: "SoyKarengi · Mente entrenada, vida con propósito",
    description:
      "Acompañamiento para transformar lo que estás viviendo y diseños para convertir lo que sientes en algo que permanece. Psicología, Life Coaching y mentoría en español, junto a Diseños con Propósito para eventos, regalos y homenajes.",
    og: "Porque hay momentos que necesitan ser acompañados… y otros que merecen ser recordados.",
    keywords: [
      "psicóloga online en español",
      "life coach en español",
      "mentoría para mujeres",
      "diseños personalizados",
      "regalos personalizados",
      "diseños para homenajes",
      "invitaciones personalizadas",
      "diseños para eventos",
      "SoyKarengi",
      "Karen Ramos",
    ],
  },
  en: {
    title: "SoyKarengi · Trained mind, life with purpose",
    description:
      "Support to transform what you are going through, and designs to turn what you feel into something that lasts. Psychology, Life Coaching and mentoring in Spanish, alongside Designs with Purpose for events, gifts and tributes.",
    og: "Because some moments need company… and others deserve to be remembered.",
    keywords: [
      "online psychologist in Spanish",
      "life coach in Spanish",
      "mentoring for women",
      "custom designs",
      "personalized gifts",
      "tribute designs",
      "custom invitations",
      "event designs",
      "SoyKarengi",
      "Karen Ramos",
    ],
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = META[locale];

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: m.title, template: "%s · SoyKarengi" },
    description: m.description,
    keywords: [...m.keywords],
    alternates: { canonical: "/" },
    openGraph: {
      title: m.title,
      description: m.og,
      siteName: "SoyKarengi",
      type: "website",
      locale: locale === "en" ? "en_US" : "es_US",
      images: [{ url: "/soykarengi-logo.png", width: 900, height: 1324, alt: "SoyKarengi · Karen Ramos" }],
    },
    twitter: { card: "summary_large_image", title: m.title, description: m.og },
    icons: { icon: "/soykarengi-isotipo.png", apple: "/soykarengi-isotipo.png" },
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
