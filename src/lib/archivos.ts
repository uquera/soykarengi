/**
 * Lo que comparten el servidor y el navegador sobre los archivos: límites,
 * extensiones aceptadas y etiquetas. El control de verdad vive en
 * src/lib/storage.ts; esto solo sirve para avisar antes de subir.
 */

export const MAX_BYTES = 25 * 1024 * 1024;
export const MAX_ARCHIVOS_POR_SUBIDA = 10;

export const EXT_TODAS = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "heic",
  "heif",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "mp3",
  "m4a",
  "wav",
  "ogg",
  "mp4",
  "mov",
];

/** Para la vitrina: solo imágenes que cualquier navegador muestra. */
export const EXT_IMAGEN = ["jpg", "jpeg", "png", "webp"];

export const ACCEPT_TODAS = EXT_TODAS.map((e) => `.${e}`).join(",");
export const ACCEPT_IMAGEN = EXT_IMAGEN.map((e) => `.${e}`).join(",");

export const TIPOS_ARCHIVO = ["COMPARTIDO", "DE_CLIENTA", "REFERENCIA", "ENTREGABLE", "VITRINA"] as const;
export type TipoArchivo = (typeof TIPOS_ARCHIVO)[number];

export function tamanoLegible(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Ícono simple por familia de archivo, para las listas. */
export function iconoArchivo(mime: string) {
  if (mime.startsWith("image/")) return "🖼";
  if (mime === "application/pdf") return "📄";
  if (mime.startsWith("audio/")) return "🎧";
  if (mime.startsWith("video/")) return "🎬";
  if (mime.includes("sheet") || mime.includes("excel")) return "📊";
  if (mime.includes("presentation") || mime.includes("powerpoint")) return "📽";
  return "📎";
}

export const urlArchivo = (id: string) => `/api/archivos/${id}`;
