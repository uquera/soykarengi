"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { savePostAction } from "@/lib/actions/admin";
import { Field, inputClass } from "@/components/ui";

type Post = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  kind: string;
  tag: string;
  readMinutes: number;
  published: boolean;
  titleEn: string | null;
  excerptEn: string | null;
  contentEn: string | null;
  tagEn: string | null;
};

function Submit({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-ink px-7 py-3 text-sm font-semibold text-cream transition-colors hover:bg-ink-soft disabled:opacity-50"
    >
      {pending ? "Guardando…" : isNew ? "Publicar" : "Guardar cambios"}
    </button>
  );
}

export function PostForm({ post }: { post?: Post }) {
  const [state, action] = useActionState(savePostAction, {});

  return (
    <form action={action} className="space-y-6">
      {post ? <input type="hidden" name="id" value={post.id} /> : null}

      <div className="card-soft space-y-5 p-7">
        <Field label="Título">
          <input name="title" defaultValue={post?.title} required className={inputClass} />
        </Field>

        <Field label="Bajada" hint="Aparece en el listado y en los buscadores.">
          <textarea name="excerpt" rows={2} defaultValue={post?.excerpt} required className={inputClass} />
        </Field>

        <Field label="Contenido" hint="Un párrafo por línea. Usa «## » al inicio de una línea para un subtítulo.">
          <textarea name="content" rows={14} defaultValue={post?.content} required className={inputClass} />
        </Field>
      </div>

      <div className="card-soft grid gap-5 p-7 sm:grid-cols-3">
        <Field label="Tipo">
          <select name="kind" defaultValue={post?.kind ?? "BLOG"} className={inputClass}>
            <option value="BLOG">Blog</option>
            <option value="RECURSO">Recurso</option>
          </select>
        </Field>

        <Field label="Etiqueta">
          <input name="tag" defaultValue={post?.tag ?? ""} className={inputClass} placeholder="Bienestar" />
        </Field>

        <Field label="Minutos de lectura">
          <input
            name="readMinutes"
            type="number"
            min={1}
            max={60}
            defaultValue={post?.readMinutes ?? 4}
            className={inputClass}
          />
        </Field>

        <label className="flex items-center gap-3 text-sm font-semibold sm:col-span-3">
          <input
            type="checkbox"
            name="published"
            defaultChecked={post?.published ?? true}
            className="h-4 w-4 accent-[#8257A0]"
          />
          Publicado
        </label>
      </div>

      {/* Versión en inglés. Lo que dejes vacío se muestra en español. */}
      <details className="card-soft p-7">
        <summary className="cursor-pointer text-sm font-semibold">
          Versión en inglés <span className="font-normal text-muted">(opcional)</span>
        </summary>

        <div className="mt-6 space-y-5">
          <div className="grid gap-5 sm:grid-cols-[1fr_10rem]">
            <Field label="Title">
              <input name="titleEn" defaultValue={post?.titleEn ?? ""} className={inputClass} />
            </Field>
            <Field label="Tag">
              <input name="tagEn" defaultValue={post?.tagEn ?? ""} className={inputClass} />
            </Field>
          </div>

          <Field label="Excerpt">
            <textarea name="excerptEn" rows={2} defaultValue={post?.excerptEn ?? ""} className={inputClass} />
          </Field>

          <Field label="Content">
            <textarea name="contentEn" rows={14} defaultValue={post?.contentEn ?? ""} className={inputClass} />
          </Field>
        </div>
      </details>

      {state.error ? (
        <p className="rounded-xl border border-rose/40 bg-rose-soft px-4 py-3 text-sm text-rose-deep">
          {state.error}
        </p>
      ) : null}

      <Submit isNew={!post} />
    </form>
  );
}
