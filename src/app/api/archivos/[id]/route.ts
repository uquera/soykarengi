import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getLicenciaStatus } from "@/lib/licencia";
import { urlArchivo } from "@/lib/archivos";
import { borrarArchivo, leerArchivo, seVeEnNavegador } from "@/lib/storage";

/**
 * Descarga y borrado. Es la única puerta a los archivos guardados en disco,
 * así que aquí se decide quién ve qué:
 *   - Karen (ADMIN) ve y borra todo.
 *   - Una clienta solo ve lo de su propia carpeta, y solo borra lo que subió
 *     ella misma.
 *   - Las fotos de la vitrina son públicas.
 */

const noEncontrado = () => new Response("No encontrado", { status: 404 });

/** filename para Content-Disposition, con la versión UTF-8 para tildes y ñ. */
function disposicion(tipo: "inline" | "attachment", nombre: string) {
  const ascii = nombre.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "");
  return `${tipo}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(nombre)}`;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const archivo = await db.archivo.findUnique({ where: { id } });
  if (!archivo) return noEncontrado();

  const publico = archivo.tipo === "VITRINA";

  if (!publico) {
    const user = await getCurrentUser();
    if (!user) return new Response("Necesitas ingresar", { status: 401 });

    const esAdmin = user.role === "ADMIN";
    // A otra clienta le respondemos 404 y no 403: ni siquiera sabe que existe.
    if (!esAdmin && archivo.userId !== user.id) return noEncontrado();

    if (!esAdmin && (await getLicenciaStatus()).bloqueada) {
      return new Response("La plataforma no está disponible en este momento.", { status: 403 });
    }

    // La primera vez que la destinataria abre lo que le mandaron: la clienta lo
    // de Karen, y Karen lo que le envió la clienta (así sale de «Hoy»).
    const paraLaClienta = archivo.tipo === "COMPARTIDO" || archivo.tipo === "ENTREGABLE";
    const paraKaren = archivo.tipo === "DE_CLIENTA" || archivo.tipo === "REFERENCIA";
    if (!archivo.vistoAt && ((!esAdmin && paraLaClienta) || (esAdmin && paraKaren))) {
      await db.archivo.update({ where: { id }, data: { vistoAt: new Date() } });
    }
  }

  let datos: Buffer;
  try {
    datos = await leerArchivo(archivo.ruta);
  } catch {
    console.error(`[archivos] falta en disco: ${archivo.ruta}`);
    return noEncontrado();
  }

  const forzarDescarga = new URL(request.url).searchParams.has("descargar");
  const inline = !forzarDescarga && seVeEnNavegador(archivo.mime);

  return new Response(new Uint8Array(datos), {
    headers: {
      "Content-Type": archivo.mime,
      "Content-Length": String(datos.length),
      "Content-Disposition": disposicion(inline ? "inline" : "attachment", archivo.nombre),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": publico ? "public, max-age=86400" : "private, no-store",
    },
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Tu sesión expiró." }, { status: 401 });

  const archivo = await db.archivo.findUnique({ where: { id } });
  if (!archivo) return Response.json({ error: "Ese archivo ya no existe." }, { status: 404 });

  const esAdmin = user.role === "ADMIN";
  const esSuyo = archivo.subidoPorId === user.id && archivo.userId === user.id;
  if (!esAdmin && !esSuyo) return Response.json({ error: "No puedes borrar este archivo." }, { status: 403 });

  await db.archivo.delete({ where: { id } });
  await borrarArchivo(archivo.ruta);

  // Una foto de la vitrina borrada no puede dejar una pieza con la imagen rota.
  if (archivo.tipo === "VITRINA") {
    await db.design.updateMany({ where: { image: urlArchivo(id) }, data: { image: null } });
    revalidatePath("/disenos", "layout");
  }

  revalidatePath("/mi-espacio", "layout");
  revalidatePath("/admin", "layout");
  return Response.json({ ok: true });
}
