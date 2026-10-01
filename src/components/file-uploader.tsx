"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ACCEPT_IMAGEN,
  ACCEPT_TODAS,
  EXT_IMAGEN,
  EXT_TODAS,
  MAX_ARCHIVOS_POR_SUBIDA,
  MAX_BYTES,
  tamanoLegible,
  type TipoArchivo,
} from "@/lib/archivos";
import { inputClass } from "@/components/ui";

export type Subido = { id: string; nombre: string; tamano: number; mime: string };

export type UploaderCopy = {
  drop: string;
  choose: string;
  hint: string;
  note: string;
  upload: string;
  uploading: string;
  done: string;
  tooMany: string;
  tooBig: string;
  badType: string;
  failed: string;
};

export const UPLOADER_ES: UploaderCopy = {
  drop: "Arrastra tus archivos aquí",
  choose: "o elígelos desde tu dispositivo",
  hint: `PDF, imágenes, Word, Excel, PowerPoint, audio o video · hasta ${MAX_BYTES / 1024 / 1024} MB cada uno`,
  note: "Mensaje (opcional)",
  upload: "Subir",
  uploading: "Subiendo…",
  done: "Listo, ya están guardados.",
  tooMany: `Puedes subir hasta ${MAX_ARCHIVOS_POR_SUBIDA} archivos a la vez.`,
  tooBig: "pesa más del límite",
  badType: "no es un tipo de archivo permitido",
  failed: "No se pudo subir. Revisa tu conexión y prueba otra vez.",
};

/**
 * Subida de archivos a /api/archivos. Valida antes de subir para avisar rápido
 * (el servidor vuelve a validar todo), muestra el progreso y, al terminar,
 * refresca la página o le entrega los archivos a quien la usa.
 */
export function FileUploader({
  tipo,
  userId,
  requestId,
  soloImagenes = false,
  conNota = false,
  multiple = true,
  copy = UPLOADER_ES,
  onSubidos,
  compacto = false,
}: {
  tipo: TipoArchivo;
  userId?: string;
  requestId?: string;
  soloImagenes?: boolean;
  conNota?: boolean;
  multiple?: boolean;
  copy?: UploaderCopy;
  /** Si está, se le pasan los archivos subidos en vez de refrescar la página. */
  onSubidos?: (archivos: Subido[]) => void;
  compacto?: boolean;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [elegidos, setElegidos] = useState<File[]>([]);
  const [nota, setNota] = useState("");
  const [progreso, setProgreso] = useState<number | null>(null);
  const [errores, setErrores] = useState<string[]>([]);
  const [ok, setOk] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);

  const permitidas = soloImagenes ? EXT_IMAGEN : EXT_TODAS;

  function elegir(lista: FileList | null) {
    if (!lista) return;
    setOk(false);
    const nuevos: File[] = [];
    const problemas: string[] = [];

    for (const f of Array.from(lista)) {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      if (!permitidas.includes(ext)) problemas.push(`«${f.name}» ${copy.badType}.`);
      else if (f.size > MAX_BYTES) problemas.push(`«${f.name}» ${copy.tooBig} (${tamanoLegible(f.size)}).`);
      else nuevos.push(f);
    }

    const juntos = multiple ? [...elegidos, ...nuevos] : nuevos.slice(0, 1);
    if (juntos.length > MAX_ARCHIVOS_POR_SUBIDA) problemas.push(copy.tooMany);
    setElegidos(juntos.slice(0, MAX_ARCHIVOS_POR_SUBIDA));
    setErrores(problemas);
  }

  function subir() {
    if (elegidos.length === 0 || progreso !== null) return;

    const form = new FormData();
    form.set("tipo", tipo);
    if (userId) form.set("userId", userId);
    if (requestId) form.set("requestId", requestId);
    if (nota.trim()) form.set("nota", nota.trim());
    for (const f of elegidos) form.append("file", f);

    // XMLHttpRequest y no fetch: es la única forma de saber cuánto va subido.
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/archivos");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgreso(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => {
      setProgreso(null);
      setErrores([copy.failed]);
    };
    xhr.onload = () => {
      setProgreso(null);
      let res: { archivos?: Subido[]; errores?: string[]; error?: string } = {};
      try {
        res = JSON.parse(xhr.responseText);
      } catch {
        setErrores([copy.failed]);
        return;
      }

      const subidos = res.archivos ?? [];
      setErrores([...(res.errores ?? []), ...(res.error ? [res.error] : [])]);

      if (subidos.length > 0) {
        setElegidos([]);
        setNota("");
        setOk(true);
        if (input.current) input.current.value = "";
        if (onSubidos) onSubidos(subidos);
        else router.refresh();
      }
    };
    setProgreso(0);
    setErrores([]);
    xhr.send(form);
  }

  return (
    <div className="space-y-3">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          elegir(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-colors ${
          compacto ? "px-4 py-5" : "px-6 py-8"
        } ${arrastrando ? "border-orchid bg-orchid-soft/60" : "border-line bg-white hover:border-ink/30"}`}
      >
        <span aria-hidden="true" className="text-2xl">
          ⇪
        </span>
        <span className="mt-2 text-sm font-semibold text-ink">{copy.drop}</span>
        <span className="text-[0.8125rem] text-muted">{copy.choose}</span>
        <span className="mt-2 text-[0.75rem] text-muted">{copy.hint}</span>
        <input
          ref={input}
          type="file"
          multiple={multiple}
          accept={soloImagenes ? ACCEPT_IMAGEN : ACCEPT_TODAS}
          className="sr-only"
          onChange={(e) => elegir(e.target.files)}
        />
      </label>

      {elegidos.length > 0 ? (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
          {elegidos.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <span className="min-w-0 truncate">{f.name}</span>
              <span className="flex shrink-0 items-center gap-3 text-[0.8125rem] text-muted">
                {tamanoLegible(f.size)}
                <button
                  type="button"
                  onClick={() => setElegidos(elegidos.filter((_, j) => j !== i))}
                  className="text-muted hover:text-rose-deep"
                  aria-label={`Quitar ${f.name}`}
                  disabled={progreso !== null}
                >
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {conNota && elegidos.length > 0 ? (
        <textarea
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder={copy.note}
          rows={2}
          maxLength={500}
          className={inputClass}
        />
      ) : null}

      {elegidos.length > 0 ? (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={subir}
            disabled={progreso !== null}
            className="rounded-full bg-ink px-6 py-2.5 text-[0.8125rem] font-semibold text-cream transition-colors hover:bg-ink-soft disabled:opacity-60"
          >
            {progreso !== null ? `${copy.uploading} ${progreso}%` : `${copy.upload} (${elegidos.length})`}
          </button>
          {progreso !== null ? (
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-shell">
              <div className="h-full bg-orchid transition-all" style={{ width: `${progreso}%` }} />
            </div>
          ) : null}
        </div>
      ) : null}

      {ok ? <p className="text-[0.8125rem] text-moss-deep">{copy.done}</p> : null}

      {errores.length > 0 ? (
        <ul className="space-y-1 rounded-xl border border-rose/40 bg-rose-soft px-4 py-3 text-[0.8125rem] text-rose-deep">
          {errores.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
