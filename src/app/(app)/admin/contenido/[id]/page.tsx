import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PostForm } from "../post-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Editar entrada" };

export default async function EditarEntradaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const post = await db.post.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <div className="max-w-3xl space-y-7">
      <header>
        <Link href="/admin/contenido" className="text-[0.8125rem] text-muted hover:text-ink">
          ← Contenido
        </Link>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">{post.title}</h1>
      </header>

      <PostForm post={post} />
    </div>
  );
}
