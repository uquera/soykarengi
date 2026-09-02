"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveDesignAction } from "@/lib/actions/admin";
import { PALETTES } from "@/lib/domain";
import { Field, inputClass } from "@/components/ui";

type Design = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  categoryId: string;
  basePrice: number;
  delivery: string;
  customFields: string;
  palette: string;
  order: number;
  active: boolean;
  featured: boolean;
  nameEn: string | null;
  taglineEn: string | null;
  descriptionEn: string | null;
  deliveryEn: string | null;
  customFieldsEn: string | null;
};

function Submit({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-ink px-7 py-3 text-sm font-semibold text-cream transition-colors hover:bg-ink-soft disabled:opacity-50"
    >
      {pending ? "Guardando…" : isNew ? "Crear diseño" : "Guardar cambios"}
    </button>
  );
}

export function DesignForm({
  design,
  categories,
}: {
  design?: Design;
  categories: { id: string; name: string; group: string }[];
}) {
  const [state, action] = useActionState(saveDesignAction, {});

  return (
    <form action={action} className="space-y-6">
      {design ? <input type="hidden" name="id" value={design.id} /> : null}

      <div className="card-soft space-y-5 p-7">
        <Field label="Nombre de la pieza" hint="Ej: «Un recuerdo que permanece»">
          <input name="name" defaultValue={design?.name} required className={inputClass} />
        </Field>

        <Field label="Bajada" hint="Una línea. Es lo que se lee bajo el título en la vitrina.">
          <input name="tagline" defaultValue={design?.tagline} required className={inputClass} />
        </Field>

        <Field label="Descripción" hint="Un párrafo por línea.">
          <textarea name="description" rows={5} defaultValue={design?.description} required className={inputClass} />
        </Field>
      </div>

      <div className="card-soft grid gap-5 p-7 sm:grid-cols-2">
        <Field label="Categoría">
          <select name="categoryId" defaultValue={design?.categoryId} required className={inputClass}>
            <option value="">Elige una categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.group}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Precio base (USD)">
          <input
            name="basePrice"
            type="number"
            min={0}
            defaultValue={design?.basePrice ?? 0}
            required
            className={inputClass}
          />
        </Field>

        <Field label="Formato de entrega">
          <input
            name="delivery"
            defaultValue={design?.delivery ?? "Digital / Impresa / Ambas"}
            required
            className={inputClass}
          />
        </Field>

        <Field label="Paleta de la portada">
          <select name="palette" defaultValue={design?.palette ?? "rose"} className={inputClass}>
            {Object.keys(PALETTES).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>

        <div className="sm:col-span-2">
          <Field label="Campos personalizables" hint="Separados por coma.">
            <input
              name="customFields"
              defaultValue={design?.customFields ?? "Nombre,Fecha,Frase,Fotografía,Colores,Formato"}
              required
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Orden">
          <input name="order" type="number" min={0} defaultValue={design?.order ?? 0} className={inputClass} />
        </Field>

        <div className="flex flex-col justify-end gap-3 pb-2">
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              name="active"
              defaultChecked={design?.active ?? true}
              className="h-4 w-4 accent-[#C9506B]"
            />
            Visible en la vitrina
          </label>
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={design?.featured ?? false}
              className="h-4 w-4 accent-[#C9506B]"
            />
            Destacado en la home
          </label>
        </div>
      </div>

      {/* Versión en inglés. Lo que dejes vacío se muestra en español. */}
      <details className="card-soft p-7">
        <summary className="cursor-pointer text-sm font-semibold">
          Versión en inglés <span className="font-normal text-muted">(opcional)</span>
        </summary>

        <div className="mt-6 space-y-5">
          <Field label="Name">
            <input name="nameEn" defaultValue={design?.nameEn ?? ""} className={inputClass} />
          </Field>

          <Field label="Tagline">
            <input name="taglineEn" defaultValue={design?.taglineEn ?? ""} className={inputClass} />
          </Field>

          <Field label="Description">
            <textarea
              name="descriptionEn"
              rows={5}
              defaultValue={design?.descriptionEn ?? ""}
              className={inputClass}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Delivery">
              <input name="deliveryEn" defaultValue={design?.deliveryEn ?? ""} className={inputClass} />
            </Field>
            <Field label="Customizable fields" hint="Comma separated.">
              <input
                name="customFieldsEn"
                defaultValue={design?.customFieldsEn ?? ""}
                className={inputClass}
              />
            </Field>
          </div>
        </div>
      </details>

      {state.error ? (
        <p className="rounded-xl border border-rose/40 bg-rose-soft px-4 py-3 text-sm text-rose-deep">
          {state.error}
        </p>
      ) : null}

      <Submit isNew={!design} />
    </form>
  );
}
