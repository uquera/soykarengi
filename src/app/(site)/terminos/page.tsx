import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Términos y condiciones" };

export default function Page() {
  return <LegalPage tipo="TERMINOS" />;
}
