import { iconoArchivo, tamanoLegible, urlArchivo } from "@/lib/archivos";
import { shortDate, type FmtLocale } from "@/lib/format";
import { BorrarArchivoButton } from "./borrar-archivo-button";

export type ArchivoFila = {
  id: string;
  nombre: string;
  mime: string;
  tamano: number;
  nota: string;
  createdAt: Date;
  vistoAt?: Date | null;
};

export type ArchivoListCopy = {
  open: string;
  download: string;
  remove: string;
  confirmRemove: string;
  seen: string;
  notSeen: string;
  isNew: string;
};

export const ARCHIVO_LIST_ES: ArchivoListCopy = {
  open: "Abrir",
  download: "Descargar",
  remove: "Borrar",
  confirmRemove: "¿Borrar este archivo? No se puede deshacer.",
  seen: "Visto",
  notSeen: "Aún no lo abre",
  isNew: "Nuevo",
};

/**
 * Lista de archivos de una carpeta. `estadoVisto` muestra a Karen si la
 * clienta ya abrió lo que le mandó; `marcarNuevos` le muestra a la clienta lo
 * que todavía no abrió.
 */
export function ArchivoList({
  archivos,
  locale = "es",
  copy = ARCHIVO_LIST_ES,
  puedeBorrar = false,
  estadoVisto = false,
  marcarNuevos = false,
}: {
  archivos: ArchivoFila[];
  locale?: FmtLocale;
  copy?: ArchivoListCopy;
  puedeBorrar?: boolean;
  estadoVisto?: boolean;
  marcarNuevos?: boolean;
}) {
  return (
    <ul className="divide-y divide-line">
      {archivos.map((a) => (
        <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
          <div className="flex min-w-0 items-start gap-3">
            <span aria-hidden="true" className="mt-0.5 text-lg">
              {iconoArchivo(a.mime)}
            </span>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                <span className="truncate">{a.nombre}</span>
                {marcarNuevos && !a.vistoAt ? (
                  <span className="rounded-full bg-orchid-deep px-2 py-0.5 text-[0.6875rem] font-semibold text-cream">
                    {copy.isNew}
                  </span>
                ) : null}
              </p>
              <p className="mt-0.5 text-[0.8125rem] text-muted">
                {tamanoLegible(a.tamano)} · {shortDate(a.createdAt, locale)}
                {estadoVisto ? (
                  <span className={a.vistoAt ? "text-moss-deep" : ""}>
                    {" · "}
                    {a.vistoAt ? `${copy.seen} ${shortDate(a.vistoAt, locale)}` : copy.notSeen}
                  </span>
                ) : null}
              </p>
              {a.nota ? <p className="mt-1 text-[0.8125rem] text-ink-soft italic">“{a.nota}”</p> : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <a
              href={urlArchivo(a.id)}
              target="_blank"
              rel="noopener"
              className="rounded-full border border-line px-4 py-2 text-[0.8125rem] font-semibold text-ink-soft transition-colors hover:border-ink/40 hover:text-ink"
            >
              {copy.open}
            </a>
            <a
              href={`${urlArchivo(a.id)}?descargar=1`}
              className="rounded-full bg-ink px-4 py-2 text-[0.8125rem] font-semibold text-cream transition-colors hover:bg-ink-soft"
            >
              {copy.download}
            </a>
            {puedeBorrar ? (
              <BorrarArchivoButton id={a.id} label={copy.remove} confirmacion={copy.confirmRemove} />
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
