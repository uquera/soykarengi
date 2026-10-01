import type { ReactNode } from "react";
import { elegirUnidadAction, limpiarUnidadAction } from "@/lib/actions/unidad";
import type { Unidad } from "@/lib/unidad";

/**
 * Las puertas de la portada. Son formularios y no enlaces porque, además de
 * llevarte a la unidad, dejan registrado por dónde entraste: así la portada se
 * reordena la próxima vez y Karen sabe a qué viene cada persona.
 */
export function UnitDoor({
  unidad,
  className,
  children,
}: {
  unidad: Unidad;
  className?: string;
  children: ReactNode;
}) {
  return (
    <form action={elegirUnidadAction} className="contents">
      <input type="hidden" name="unidad" value={unidad} />
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}

/** Banda discreta para quien ya eligió: dice dónde está y cómo ver las dos. */
export function UnitChosenBar({
  unidad,
  copy,
}: {
  unidad: Unidad;
  copy: { chosen: string; unit1: string; unit2: string; both: string };
}) {
  const esAcompanamiento = unidad === "acompanamiento";

  return (
    <div
      className={`border-b ${
        esAcompanamiento ? "border-orchid/20 bg-orchid-soft/50" : "border-moss/25 bg-moss-soft"
      }`}
    >
      <div className="shell flex flex-wrap items-center justify-between gap-3 py-2.5 text-[0.8125rem]">
        <p className={esAcompanamiento ? "text-orchid-deep" : "text-moss-deep"}>
          {copy.chosen}{" "}
          <span className="font-semibold">{esAcompanamiento ? copy.unit1 : copy.unit2}</span>
        </p>
        <form action={limpiarUnidadAction}>
          <button type="submit" className="font-semibold text-muted underline underline-offset-2 hover:text-ink">
            {copy.both}
          </button>
        </form>
      </div>
    </div>
  );
}
