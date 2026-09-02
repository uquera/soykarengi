import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { DesignForm } from "../design-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Nuevo diseño" };

export default async function NuevoDisenoPage() {
  await requireAdmin();
  const categories = await db.designCategory.findMany({
    where: { active: true },
    orderBy: [{ group: "asc" }, { order: "asc" }],
  });

  return (
    <div className="max-w-3xl space-y-7">
      <header>
        <Link href="/admin/disenos" className="text-[0.8125rem] text-muted hover:text-ink">
          ← Diseños
        </Link>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">Nuevo diseño</h1>
      </header>

      <DesignForm categories={categories} />
    </div>
  );
}
