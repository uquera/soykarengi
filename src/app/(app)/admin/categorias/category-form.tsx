"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveCategoryAction } from "@/lib/actions/admin";
import { CATEGORY_GROUPS } from "@/lib/domain";
import { inputClass } from "@/components/ui";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-[0.8125rem] font-semibold text-cream transition-colors hover:bg-ink-soft disabled:opacity-50"
    >
      {pending ? "Guardando…" : label}
    </button>
  );
}

type Category = {
  id: string;
  name: string;
  group: string;
  description: string;
  order: number;
  active: boolean;
  nameEn: string | null;
  descriptionEn: string | null;
};

export function CategoryForm({ category }: { category?: Category }) {
  const [state, action] = useActionState(saveCategoryAction, {});

  return (
    <form action={action} className="space-y-3">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}

      <div className="grid gap-2 sm:grid-cols-[1fr_9rem_5rem]">
        <input
          name="name"
          defaultValue={category?.name}
          placeholder="Nombre de la categoría"
          required
          className={inputClass}
        />
        <select name="group" defaultValue={category?.group ?? "EVENTOS"} className={inputClass}>
          {CATEGORY_GROUPS.map((g) => (
            <option key={g.key} value={g.key}>
              {g.name}
            </option>
          ))}
        </select>
        <input
          name="order"
          type="number"
          min={0}
          defaultValue={category?.order ?? 0}
          className={inputClass}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <input
          name="nameEn"
          defaultValue={category?.nameEn ?? ""}
          placeholder="Name (English)"
          className={inputClass}
        />
        <input
          name="descriptionEn"
          defaultValue={category?.descriptionEn ?? ""}
          placeholder="Description (English)"
          className={inputClass}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          name="description"
          defaultValue={category?.description}
          placeholder="Descripción breve"
          required
          className={`${inputClass} flex-1`}
        />
        <label className="flex items-center gap-2 px-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={category?.active ?? true}
            className="h-4 w-4 accent-[#BC7A52]"
          />
          Visible
        </label>
        <Submit label={category ? "Guardar" : "Crear categoría"} />
      </div>

      {state.error ? <p className="text-sm text-clay-deep">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-sage-deep">Guardado.</p> : null}
    </form>
  );
}
