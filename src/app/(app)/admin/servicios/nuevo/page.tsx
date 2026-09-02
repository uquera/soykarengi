import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { ServiceForm } from "../service-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Nuevo servicio" };

export default async function NuevoServicioPage() {
  await requireAdmin();

  return (
    <div className="max-w-3xl space-y-7">
      <header>
        <Link href="/admin/servicios" className="text-[0.8125rem] text-muted hover:text-ink">
          ← Servicios
        </Link>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">Nuevo servicio</h1>
      </header>

      <ServiceForm />
    </div>
  );
}
