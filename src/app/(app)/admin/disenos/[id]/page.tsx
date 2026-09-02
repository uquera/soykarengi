import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { DesignForm } from "../design-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Editar diseño" };

export default async function EditarDisenoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [design, categories] = await Promise.all([
    db.design.findUnique({ where: { id } }),
    db.designCategory.findMany({ orderBy: [{ group: "asc" }, { order: "asc" }] }),
  ]);
  if (!design) notFound();

  return (
    <div className="max-w-3xl space-y-7">
      <header>
        <Link href="/admin/disenos" className="text-[0.8125rem] text-muted hover:text-ink">
          ← Diseños
        </Link>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">{design.name}</h1>
      </header>

      <DesignForm design={design} categories={categories} />
    </div>
  );
}
