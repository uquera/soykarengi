import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { PostForm } from "../post-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Nueva entrada" };

export default async function NuevaEntradaPage() {
  await requireAdmin();

  return (
    <div className="max-w-3xl space-y-7">
      <header>
        <Link href="/admin/contenido" className="text-[0.8125rem] text-muted hover:text-ink">
          ← Contenido
        </Link>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">Nueva entrada</h1>
      </header>

      <PostForm />
    </div>
  );
}
