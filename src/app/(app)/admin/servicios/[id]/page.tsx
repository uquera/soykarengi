import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ServiceForm } from "../service-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Editar servicio" };

export default async function EditarServicioPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const service = await db.service.findUnique({ where: { id } });
  if (!service) notFound();

  return (
    <div className="max-w-3xl space-y-7">
      <header>
        <Link href="/admin/servicios" className="text-[0.8125rem] text-muted hover:text-ink">
          ← Servicios
        </Link>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">{service.name}</h1>
      </header>

      <ServiceForm service={service} />
    </div>
  );
}
