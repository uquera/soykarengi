import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { EXT_TODAS, MAX_BYTES } from "./archivos";

/**
 * Archivos de las clientas y de Karen.
 *
 * Viven FUERA de /public, en UPLOADS_DIR (en el VPS, /root/soykarengi-data/
 * archivos), por tres razones: lo que cae en /public después del build no se
 * sirve, lo que sí se sirve desde ahí no pasa por ningún control de acceso, y
 * cada despliegue borraría lo subido. Toda descarga pasa por /api/archivos/[id].
 *
 * El tipo se decide aquí, no con lo que dice el navegador: la extensión tiene
 * que estar en la lista y los primeros bytes tienen que corresponder a ese
 * formato. Un .exe renombrado a .pdf no entra.
 */

// Los archivos subidos son datos de ejecución: el trazado del build no tiene
// que seguir estas rutas (si lo hace, mete el proyecto entero en el bundle).
export function uploadsDir() {
  return process.env.UPLOADS_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "archivos");
}

type Formato = {
  mime: string;
  /** Se puede ver en el navegador; el resto se descarga. */
  inline: boolean;
  firma: (b: Buffer) => boolean;
};

const ascii = (b: Buffer, desde: number, texto: string) =>
  b.length >= desde + texto.length && b.toString("latin1", desde, desde + texto.length) === texto;

const esZip = (b: Buffer) => b.length > 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;
const esOle = (b: Buffer) => b.length > 8 && b.readUInt32BE(0) === 0xd0cf11e0 && b.readUInt32BE(4) === 0xa1b11ae1;
const esIsoBmff = (b: Buffer) => ascii(b, 4, "ftyp");
const esHeic = (b: Buffer) => esIsoBmff(b) && ["heic", "heix", "hevc", "mif1", "msf1", "heif"].includes(b.toString("latin1", 8, 12));
/** Texto plano: sin bytes nulos al principio. */
const esTexto = (b: Buffer) => !b.subarray(0, 4096).includes(0);

const FORMATOS: Record<string, Formato> = {
  pdf: { mime: "application/pdf", inline: true, firma: (b) => ascii(b, 0, "%PDF") },
  jpg: { mime: "image/jpeg", inline: true, firma: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  jpeg: { mime: "image/jpeg", inline: true, firma: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  png: { mime: "image/png", inline: true, firma: (b) => b.readUInt32BE(0) === 0x89504e47 },
  gif: { mime: "image/gif", inline: true, firma: (b) => ascii(b, 0, "GIF8") },
  webp: { mime: "image/webp", inline: true, firma: (b) => ascii(b, 0, "RIFF") && ascii(b, 8, "WEBP") },
  heic: { mime: "image/heic", inline: false, firma: esHeic },
  heif: { mime: "image/heif", inline: false, firma: esHeic },
  doc: { mime: "application/msword", inline: false, firma: esOle },
  docx: {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    inline: false,
    firma: esZip,
  },
  xls: { mime: "application/vnd.ms-excel", inline: false, firma: esOle },
  xlsx: { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", inline: false, firma: esZip },
  ppt: { mime: "application/vnd.ms-powerpoint", inline: false, firma: esOle },
  pptx: {
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    inline: false,
    firma: esZip,
  },
  txt: { mime: "text/plain; charset=utf-8", inline: false, firma: esTexto },
  mp3: {
    mime: "audio/mpeg",
    inline: true,
    firma: (b) => ascii(b, 0, "ID3") || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0),
  },
  m4a: { mime: "audio/mp4", inline: true, firma: esIsoBmff },
  wav: { mime: "audio/wav", inline: true, firma: (b) => ascii(b, 0, "RIFF") && ascii(b, 8, "WAVE") },
  ogg: { mime: "audio/ogg", inline: true, firma: (b) => ascii(b, 0, "OggS") },
  mp4: { mime: "video/mp4", inline: true, firma: esIsoBmff },
  mov: { mime: "video/quicktime", inline: true, firma: esIsoBmff },
};

export class ArchivoInvalido extends Error {}

function extension(nombre: string) {
  return path.extname(nombre).slice(1).toLowerCase();
}

/** Nombre visible: sin rutas, sin caracteres de control, de largo razonable. */
export function limpiarNombre(nombre: string) {
  const base = path.basename(nombre.replaceAll("\\", "/"));
  const limpio = base.replace(/[\u0000-\u001f\u007f<>:"/\\|?*]+/g, "").trim();
  return (limpio || "archivo").slice(0, 120);
}

export type Guardado = { nombre: string; mime: string; tamano: number; ruta: string };

export async function guardarArchivo(file: File, permitidas: string[] = EXT_TODAS): Promise<Guardado> {
  const nombre = limpiarNombre(file.name);
  const ext = extension(nombre);
  const formato = FORMATOS[ext];

  if (!formato || !permitidas.includes(ext)) {
    throw new ArchivoInvalido(`«${nombre}»: ese tipo de archivo no está permitido.`);
  }
  if (file.size === 0) throw new ArchivoInvalido(`«${nombre}» está vacío.`);
  if (file.size > MAX_BYTES) {
    throw new ArchivoInvalido(`«${nombre}» pesa más de ${MAX_BYTES / 1024 / 1024} MB.`);
  }

  const datos = Buffer.from(await file.arrayBuffer());
  if (!formato.firma(datos)) {
    throw new ArchivoInvalido(`«${nombre}» no es realmente un archivo .${ext}.`);
  }

  const ruta = `${randomUUID()}.${ext}`;
  const dir = uploadsDir();
  await mkdir(/*turbopackIgnore: true*/ dir, { recursive: true });
  await writeFile(path.join(/*turbopackIgnore: true*/ dir, ruta), datos, { flag: "wx" });

  return { nombre, mime: formato.mime, tamano: datos.length, ruta };
}

/** Resuelve la ruta en disco sin dejar escapar de UPLOADS_DIR. */
function rutaSegura(ruta: string) {
  if (!/^[0-9a-f-]{36}\.[a-z0-9]{2,5}$/.test(ruta)) throw new Error("ruta de archivo inválida");
  return path.join(/*turbopackIgnore: true*/ uploadsDir(), ruta);
}

export async function leerArchivo(ruta: string) {
  return readFile(/*turbopackIgnore: true*/ rutaSegura(ruta));
}

export async function borrarArchivo(ruta: string) {
  try {
    await unlink(/*turbopackIgnore: true*/ rutaSegura(ruta));
  } catch (error) {
    // Si ya no estaba en disco no hay nada que hacer; el registro se borra igual.
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

export function seVeEnNavegador(mime: string) {
  return Object.values(FORMATOS).some((f) => f.mime === mime && f.inline);
}
