// Prueba de punta a punta de /api/archivos contra un servidor local.
// Uso: node scripts/probar-archivos.mjs [http://127.0.0.1:3102]
// Crea una clienta de prueba, ejerce cada permiso y lo limpia todo al final.
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";

const BASE = process.argv[2] ?? "http://127.0.0.1:3102";
const db = new PrismaClient();

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .map((l) => l.match(/^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);
const secreto = new TextEncoder().encode(env.AUTH_SECRET || "karengi-desarrollo-secreto-cambiar-en-produccion");

const token = (u) =>
  new SignJWT({ uid: u.id, email: u.email, name: u.name, role: u.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secreto);

const pdf = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
const png = readFileSync("public/soykarengi-isotipo.png");
const falso = Buffer.from("esto no es un pdf, es texto con otra extension");

let fallos = 0;
const check = (nombre, ok, detalle = "") => {
  if (!ok) fallos++;
  console.log(`${ok ? "✓" : "✗"} ${nombre}${detalle ? ` — ${detalle}` : ""}`);
};

async function subir(cookie, campos, archivos) {
  const form = new FormData();
  for (const [k, v] of Object.entries(campos)) form.set(k, v);
  for (const [nombre, datos, tipo] of archivos) form.append("file", new Blob([datos], { type: tipo }), nombre);
  const res = await fetch(`${BASE}/api/archivos`, { method: "POST", body: form, headers: cookie ? { cookie } : {} });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}
const get = (id, cookie) => fetch(`${BASE}/api/archivos/${id}`, { headers: cookie ? { cookie } : {} });
const del = (id, cookie) => fetch(`${BASE}/api/archivos/${id}`, { method: "DELETE", headers: { cookie } });

const admin = await db.user.findFirst({ where: { role: "ADMIN" } });
const clienta = await db.user.findFirst({ where: { role: "CLIENT" } });
const otra = await db.user.create({
  data: { email: `otra.prueba.${Date.now()}@example.com`, name: "Otra Prueba", passwordHash: "x" },
});

const c = async (u) => `karengi_session=${await token(u)}`;
const [cAdmin, cClienta, cOtra] = await Promise.all([c(admin), c(clienta), c(otra)]);
const creados = [];

try {
  // Karen comparte con la clienta
  const r1 = await subir(cAdmin, { tipo: "COMPARTIDO", userId: clienta.id, nota: "Ejercicio de la semana" }, [
    ["ejercicio.pdf", pdf, "application/pdf"],
    ["imagen.png", png, "image/png"],
  ]);
  check("Karen comparte 2 archivos", r1.status === 200 && r1.body.archivos?.length === 2, `HTTP ${r1.status}`);
  creados.push(...(r1.body.archivos ?? []).map((a) => a.id));
  const [pdfId] = creados;

  const g1 = await get(pdfId, cClienta);
  check("la clienta lo abre", g1.status === 200 && g1.headers.get("content-type") === "application/pdf");
  const visto = await db.archivo.findUnique({ where: { id: pdfId } });
  check("queda marcado como visto", Boolean(visto?.vistoAt));

  check("otra clienta no lo ve (404)", (await get(pdfId, cOtra)).status === 404);
  check("sin sesión no se descarga (401)", (await get(pdfId)).status === 401);

  const g2 = await fetch(`${BASE}/api/archivos/${pdfId}?descargar=1`, { headers: { cookie: cClienta } });
  check("?descargar fuerza attachment", (g2.headers.get("content-disposition") ?? "").startsWith("attachment"));
  check("cabecera nosniff", g2.headers.get("x-content-type-options") === "nosniff");

  // Permisos de subida
  const r2 = await subir(cClienta, { tipo: "COMPARTIDO", userId: otra.id }, [["x.pdf", pdf, "application/pdf"]]);
  check("una clienta no puede compartir a otra (403)", r2.status === 403);

  const r3 = await subir(cClienta, { tipo: "DE_CLIENTA" }, [["informe.pdf", falso, "application/pdf"]]);
  check("un .pdf falso se rechaza (400)", r3.status === 400, r3.body.errores?.[0] ?? r3.body.error);

  const r4 = await subir(cClienta, { tipo: "DE_CLIENTA" }, [["programa.exe", pdf, "application/octet-stream"]]);
  check("un .exe se rechaza (400)", r4.status === 400);

  const grande = Buffer.concat([pdf, Buffer.alloc(26 * 1024 * 1024)]);
  const r5 = await subir(cClienta, { tipo: "DE_CLIENTA" }, [["enorme.pdf", grande, "application/pdf"]]);
  check("más de 25 MB se rechaza (400)", r5.status === 400, r5.body.errores?.[0]);

  const r6 = await subir(cClienta, { tipo: "DE_CLIENTA", nota: "Mi examen" }, [["foto.png", png, "image/png"]]);
  check("la clienta le envía una foto a Karen", r6.status === 200);
  const fotoId = r6.body.archivos?.[0]?.id;
  if (fotoId) creados.push(fotoId);
  check("Karen la abre", (await get(fotoId, cAdmin)).status === 200);

  check("otra clienta no puede borrarla (403)", (await del(fotoId, cOtra)).status === 403);
  check("la clienta no puede borrar lo que le mandó Karen (403)", (await del(pdfId, cClienta)).status === 403);
  check("la clienta borra lo suyo", (await del(fotoId, cClienta)).status === 200);

  // Vitrina
  const r7 = await subir(cAdmin, { tipo: "VITRINA" }, [["pieza.png", png, "image/png"]]);
  check("Karen sube una foto de vitrina", r7.status === 200);
  const vitrinaId = r7.body.archivos?.[0]?.id;
  if (vitrinaId) creados.push(vitrinaId);
  check("la foto de vitrina es pública", (await get(vitrinaId)).status === 200);

  const r8 = await subir(cAdmin, { tipo: "VITRINA" }, [["doc.pdf", pdf, "application/pdf"]]);
  check("la vitrina solo acepta imágenes (400)", r8.status === 400);

  const r9 = await subir(cClienta, { tipo: "VITRINA" }, [["pieza.png", png, "image/png"]]);
  check("una clienta no sube a la vitrina (403)", r9.status === 403);
} finally {
  for (const id of creados) await del(id, cAdmin).catch(() => {});
  await db.user.delete({ where: { id: otra.id } });
  await db.$disconnect();
}

console.log(fallos === 0 ? "\nTodo bien." : `\n${fallos} prueba(s) fallaron.`);
process.exit(fallos === 0 ? 0 : 1);
