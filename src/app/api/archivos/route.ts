import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getLicenciaStatus } from "@/lib/licencia";
import { EXT_IMAGEN, EXT_TODAS, MAX_ARCHIVOS_POR_SUBIDA, type TipoArchivo } from "@/lib/archivos";
import { ArchivoInvalido, borrarArchivo, guardarArchivo } from "@/lib/storage";
import { avisoArchivosDeClienta, correoArchivosCompartidos } from "@/lib/email";

/**
 * Subida de archivos. Va por un route handler y no por una server action
 * porque las acciones cortan el cuerpo en 1 MB, y una foto de teléfono pesa
 * más. Tampoco pasa por el proxy (que lo bufferiza y lo corta en 10 MB): el
 * límite real lo pone storage.ts, 25 MB por archivo.
 *
 * Quién puede subir qué:
 *   COMPARTIDO  solo Karen, a la carpeta de una clienta
 *   ENTREGABLE  solo Karen, a una solicitud de diseño
 *   VITRINA     solo Karen, fotos públicas de la vitrina
 *   DE_CLIENTA  cualquier clienta, a su propia carpeta
 *   REFERENCIA  cualquier clienta, para su solicitud (o antes de enviarla)
 */

const error = (mensaje: string, status: number) => Response.json({ error: mensaje }, { status });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return error("Tu sesión expiró. Vuelve a ingresar.", 401);

  const licencia = await getLicenciaStatus();
  if (licencia.bloqueada) return error("La plataforma no está disponible en este momento.", 403);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return error("No pudimos leer los archivos. Prueba otra vez.", 400);
  }

  const tipo = String(form.get("tipo") ?? "") as TipoArchivo;
  const nota = String(form.get("nota") ?? "").trim().slice(0, 500);
  const files = form.getAll("file").filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) return error("Elige al menos un archivo.", 400);
  if (files.length > MAX_ARCHIVOS_POR_SUBIDA) {
    return error(`Puedes subir hasta ${MAX_ARCHIVOS_POR_SUBIDA} archivos a la vez.`, 400);
  }

  const esAdmin = user.role === "ADMIN";
  let destinoUserId: string | null = null;
  let requestId: string | null = null;
  let permitidas = EXT_TODAS;

  switch (tipo) {
    case "COMPARTIDO": {
      if (!esAdmin) return error("No tienes permiso para esto.", 403);
      const destino = await db.user.findUnique({ where: { id: String(form.get("userId") ?? "") } });
      if (!destino) return error("No encontramos a esa clienta.", 404);
      destinoUserId = destino.id;
      break;
    }
    case "ENTREGABLE": {
      if (!esAdmin) return error("No tienes permiso para esto.", 403);
      const solicitud = await db.designRequest.findUnique({ where: { id: String(form.get("requestId") ?? "") } });
      if (!solicitud) return error("No encontramos esa solicitud.", 404);
      destinoUserId = solicitud.userId;
      requestId = solicitud.id;
      break;
    }
    case "VITRINA": {
      if (!esAdmin) return error("No tienes permiso para esto.", 403);
      permitidas = EXT_IMAGEN;
      break;
    }
    case "DE_CLIENTA": {
      destinoUserId = user.id;
      break;
    }
    case "REFERENCIA": {
      destinoUserId = user.id;
      const rid = String(form.get("requestId") ?? "");
      if (rid) {
        const solicitud = await db.designRequest.findUnique({ where: { id: rid } });
        if (!solicitud || solicitud.userId !== user.id) return error("Esa solicitud no es tuya.", 403);
        requestId = solicitud.id;
      }
      break;
    }
    default:
      return error("Tipo de archivo desconocido.", 400);
  }

  const creados: { id: string; nombre: string; tamano: number; mime: string }[] = [];
  const errores: string[] = [];

  for (const file of files) {
    try {
      const guardado = await guardarArchivo(file, permitidas);
      try {
        const archivo = await db.archivo.create({
          data: { ...guardado, tipo, nota, userId: destinoUserId, requestId, subidoPorId: user.id },
        });
        creados.push({ id: archivo.id, nombre: archivo.nombre, tamano: archivo.tamano, mime: archivo.mime });
      } catch (e) {
        // Si la base falla, el archivo no puede quedar huérfano en disco.
        await borrarArchivo(guardado.ruta);
        throw e;
      }
    } catch (e) {
      if (e instanceof ArchivoInvalido) errores.push(e.message);
      else {
        console.error("[archivos] error al guardar", e);
        errores.push(`«${file.name}» no se pudo guardar. Prueba otra vez.`);
      }
    }
  }

  if (creados.length > 0) {
    const nombres = creados.map((c) => c.nombre);

    if ((tipo === "COMPARTIDO" || tipo === "ENTREGABLE") && destinoUserId) {
      const destino = await db.user.findUnique({ where: { id: destinoUserId } });
      if (destino) {
        await correoArchivosCompartidos(destino.email, destino.name, { archivos: nombres, nota });
      }
    }
    if (tipo === "DE_CLIENTA") {
      await avisoArchivosDeClienta({ cliente: user.name, email: user.email, archivos: nombres, nota });
    }

    revalidatePath("/mi-espacio", "layout");
    revalidatePath("/admin", "layout");
  }

  const status = creados.length > 0 ? 200 : 400;
  return Response.json({ archivos: creados, errores }, { status });
}
