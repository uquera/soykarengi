import nodemailer from "nodemailer";
import { longDate, money, time } from "@/lib/format";

/**
 * Correos automáticos de SoyKarengi.
 *
 * Salen desde la casilla no-reply de Hypnos (EMAIL_FROM) autenticando con
 * EMAIL_USER, y las respuestas van al correo de Karen (EMAIL_REPLY_TO). Mandar
 * desde el Gmail del cliente termina mal: Google revoca la clave y los correos
 * fallan en silencio.
 *
 * Si faltan las variables de entorno, el módulo se queda callado: en local no
 * se manda nada y ninguna acción se rompe por eso.
 */

const HOST = process.env.EMAIL_HOST;
const PASS = process.env.EMAIL_PASS;
const configurado = Boolean(HOST && PASS && process.env.EMAIL_FROM);

const transporter = configurado
  ? nodemailer.createTransport(
      {
        host: HOST,
        port: Number(process.env.EMAIL_PORT ?? 587),
        secure: false,
        auth: { user: process.env.EMAIL_USER, pass: PASS },
        // Un SMTP caído no puede dejar colgada una reserva varios minutos.
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
      },
      { replyTo: process.env.EMAIL_REPLY_TO || undefined },
    )
  : null;

// Variable de servidor (no NEXT_PUBLIC_): así cambiarla solo pide un restart.
const APP_URL = process.env.APP_URL ?? "https://karengi.srv1485601.hstgr.cloud";
const CONTACTO = process.env.EMAIL_REPLY_TO || "";
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || CONTACTO;

const INK = "#38261A";
const ORCHID = "#6B4A68";
const MOSS = "#494C31";
const CREAM = "#F8F3F5";
const LINE = "#E4D6C9";
const MUTED = "#857060";

/** Escapa lo que escribe la gente: un nombre con HTML no debe colarse al correo. */
function esc(valor: string | null | undefined): string {
  if (!valor) return "";
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function plantilla(contenido: string, acento: string = ORCHID): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>SoyKarengi</title></head>
<body style="margin:0;padding:0;background-color:#F1EAEE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1EAEE;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 10px rgba(56,38,26,0.10);">

        <tr><td style="background-color:${acento};height:6px;font-size:0;line-height:0;">&nbsp;</td></tr>

        <tr><td style="background-color:${CREAM};padding:26px 40px 22px;text-align:center;">
          <img src="${APP_URL}/soykarengi-logo.png" alt="SoyKarengi" width="150"
               style="display:block;margin:0 auto;max-width:150px;height:auto;" />
          <p style="margin:12px 0 0;color:${MUTED};font-size:12px;letter-spacing:.14em;text-transform:uppercase;">
            Mente entrenada · Vida con propósito
          </p>
        </td></tr>

        <tr><td style="padding:34px 40px 38px;">${contenido}</td></tr>

        <tr><td style="background-color:#FBF8F9;padding:22px 40px;border-top:1px solid ${LINE};text-align:center;">
          <p style="margin:0;color:${MUTED};font-size:12px;line-height:1.6;">
            Este es un mensaje automático de SoyKarengi.<br>
            ${CONTACTO ? `¿Dudas? Escríbele a <a href="mailto:${CONTACTO}" style="color:${MUTED};">${CONTACTO}</a>` : ""}
          </p>
          <p style="margin:10px 0 0;color:#C2B4AC;font-size:11px;">
            &copy; ${new Date().getFullYear()} SoyKarengi &mdash; Karen Ramos
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const h2 = (texto: string) => `<h2 style="margin:0 0 6px;color:${INK};font-size:22px;font-family:Georgia,serif;">${texto}</h2>`;
const sub = (texto: string) => `<p style="margin:0 0 24px;color:${MUTED};font-size:14px;">${texto}</p>`;
const p = (texto: string) => `<p style="margin:0 0 14px;color:#5B4636;font-size:15px;line-height:1.65;">${texto}</p>`;

const caja = (contenido: string, acento: string = ORCHID, fondo = "#F6F1F5") =>
  `<div style="background:${fondo};border-left:4px solid ${acento};padding:16px 20px;border-radius:0 10px 10px 0;margin:22px 0;">${contenido}</div>`;

const fila = (etiqueta: string, valor?: string | null) =>
  valor ? `<p style="margin:0 0 6px;color:#5B4636;font-size:14px;"><strong>${etiqueta}:</strong> ${esc(valor)}</p>` : "";

const boton = (texto: string, href: string, acento: string = ORCHID) =>
  `<div style="text-align:center;margin:30px 0 10px;">
     <a href="${href}" style="background:${acento};color:#ffffff;padding:14px 32px;border-radius:999px;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">${texto}</a>
   </div>`;

type Envio = { to: string; subject: string; html: string };

/**
 * Manda sin tumbar la acción que lo llamó: una reserva vale más que su aviso.
 * Devuelve true solo si el correo salió.
 */
async function enviar({ to, subject, html }: Envio): Promise<boolean> {
  if (!transporter || !to) return false;
  try {
    await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
    return true;
  } catch (error) {
    console.error(`[email] no se pudo enviar "${subject}" a ${to}:`, error);
    return false;
  }
}

/** Para probar la configuración desde un script sin mandar nada. */
export async function verificarSmtp() {
  if (!transporter) throw new Error("SMTP sin configurar: faltan EMAIL_HOST, EMAIL_PASS o EMAIL_FROM.");
  return transporter.verify();
}

const cuando = (fecha: Date) => `${longDate(fecha)} a las ${time(fecha)}`;

// ─── Cuenta ───────────────────────────────────────────────────────────────────

export function correoBienvenida(email: string, nombre: string) {
  return enviar({
    to: email,
    subject: "Tu espacio en SoyKarengi ya está listo",
    html: plantilla(`
      ${h2("Te damos la bienvenida")}
      ${sub("Tu cuenta quedó creada")}
      ${p(`Hola <strong>${esc(nombre)}</strong>,`)}
      ${p("Ya tienes tu espacio en SoyKarengi. Es una sola cuenta para dos cosas: agendar tus sesiones con Karen y pedir tus diseños en SparkWell.")}
      ${caja(`
        <p style="margin:0 0 6px;color:${MUTED};font-size:12px;letter-spacing:.1em;text-transform:uppercase;">Tu acceso</p>
        ${fila("Correo", email)}
        <p style="margin:6px 0 0;color:${MUTED};font-size:13px;">Entras con ese correo y la contraseña que elegiste.</p>
      `)}
      ${boton("Entrar a mi espacio", `${APP_URL}/mi-espacio`)}
    `),
  });
}

// ─── Citas ────────────────────────────────────────────────────────────────────

export function correoReservaRecibida(
  email: string,
  nombre: string,
  datos: { servicio: string; fecha: Date; modalidad: string; codigo: string },
) {
  return enviar({
    to: email,
    subject: `Recibimos tu reserva — ${datos.servicio}`,
    html: plantilla(`
      ${h2("Reserva recibida")}
      ${sub("Tu sesión está pendiente de confirmación")}
      ${p(`Hola <strong>${esc(nombre)}</strong>,`)}
      ${p(`Recibimos tu reserva para el <strong style="color:${ORCHID};">${cuando(datos.fecha)}</strong>. Karen revisa la hora y te la confirma por este mismo medio.`)}
      ${caja(`
        ${fila("Servicio", datos.servicio)}
        ${fila("Modalidad", datos.modalidad)}
        ${fila("Código", datos.codigo)}
        <p style="margin:6px 0 0;color:${MUTED};font-size:13px;">Estado: por confirmar</p>
      `)}
      ${p("No necesitas pagar nada ahora. Si no puedes asistir, puedes cancelar desde tu espacio.")}
      ${boton("Ver mis citas", `${APP_URL}/mi-espacio/citas`)}
    `),
  });
}

export function correoCitaConfirmada(
  email: string,
  nombre: string,
  datos: { servicio: string; fecha: Date; modalidad: string; codigo: string },
) {
  return enviar({
    to: email,
    subject: `Tu sesión quedó confirmada — ${longDate(datos.fecha)}`,
    html: plantilla(
      `
      ${h2("Sesión confirmada")}
      ${sub("Karen apartó tu hora")}
      ${p(`Hola <strong>${esc(nombre)}</strong>,`)}
      ${p(`Tu sesión quedó confirmada para el <strong style="color:${MOSS};">${cuando(datos.fecha)}</strong>.`)}
      ${caja(
        `
        ${fila("Servicio", datos.servicio)}
        ${fila("Modalidad", datos.modalidad)}
        ${fila("Código", datos.codigo)}
      `,
        MOSS,
        "#EDF3ED",
      )}
      ${p("Si algo cambia, avísale a Karen con tiempo. Nos vemos pronto.")}
      ${boton("Ver el detalle", `${APP_URL}/mi-espacio/citas`, MOSS)}
    `,
      MOSS,
    ),
  });
}

export function correoCitaCancelada(
  email: string,
  nombre: string,
  datos: { servicio: string; fecha: Date },
) {
  return enviar({
    to: email,
    subject: "Tu sesión fue cancelada",
    html: plantilla(`
      ${h2("Sesión cancelada")}
      ${sub("Esa hora quedó liberada")}
      ${p(`Hola <strong>${esc(nombre)}</strong>,`)}
      ${p(`Tu sesión de <strong>${esc(datos.servicio)}</strong> del ${cuando(datos.fecha)} quedó cancelada.`)}
      ${p("Puedes reservar otro horario cuando quieras; la agenda muestra los bloques que siguen libres.")}
      ${boton("Agendar otra sesión", `${APP_URL}/acompanamiento/agenda`)}
    `),
  });
}

// ─── Diseños ──────────────────────────────────────────────────────────────────

export function correoSolicitudRecibida(
  email: string,
  nombre: string,
  datos: { codigo: string; pieza: string; destinatario: string },
) {
  return enviar({
    to: email,
    subject: `Recibimos tu idea — ${datos.codigo}`,
    html: plantilla(`
      ${h2("Solicitud recibida")}
      ${sub("Karen ya tiene tu idea")}
      ${p(`Hola <strong>${esc(nombre)}</strong>,`)}
      ${p("Recibimos tu solicitud de diseño. Karen la lee con calma y te manda una cotización a tu espacio. Enviarla no te compromete a pagar nada.")}
      ${caja(`
        ${fila("Pieza", datos.pieza)}
        ${fila("Para", datos.destinatario)}
        ${fila("Código", datos.codigo)}
      `)}
      ${p("Si anotaste fotos o referencias, Karen te escribirá para recibirlas.")}
      ${boton("Ver mi solicitud", `${APP_URL}/mi-espacio/disenos`)}
    `),
  });
}

export function correoCotizacion(
  email: string,
  nombre: string,
  datos: { codigo: string; pieza: string; monto: number; notas?: string | null },
) {
  return enviar({
    to: email,
    subject: `Tu cotización está lista — ${datos.pieza}`,
    html: plantilla(`
      ${h2("Tienes una cotización")}
      ${sub("Te toca decidir")}
      ${p(`Hola <strong>${esc(nombre)}</strong>,`)}
      ${p(`Karen revisó tu idea para <strong>${esc(datos.pieza)}</strong> y te preparó esta cotización:`)}
      ${caja(`
        <p style="margin:0;color:${INK};font-size:26px;font-weight:700;font-family:Georgia,serif;">${money(datos.monto)}</p>
        ${datos.notas ? `<p style="margin:10px 0 0;color:#5B4636;font-size:14px;line-height:1.6;">${esc(datos.notas)}</p>` : ""}
        <p style="margin:10px 0 0;color:${MUTED};font-size:13px;">Solicitud ${esc(datos.codigo)}</p>
      `)}
      ${p("Desde tu espacio puedes aprobarla para que Karen empiece, o decir que no sigues. Sin apuro.")}
      ${boton("Revisar la cotización", `${APP_URL}/mi-espacio/disenos`)}
    `),
  });
}

export function correoPagoConfirmado(
  email: string,
  nombre: string,
  datos: { codigo: string; pieza: string; monto: number | null },
) {
  return enviar({
    to: email,
    subject: `Tu proyecto entró en producción — ${datos.pieza}`,
    html: plantilla(
      `
      ${h2("Pago confirmado")}
      ${sub("Tu pieza ya está en marcha")}
      ${p(`Hola <strong>${esc(nombre)}</strong>,`)}
      ${p("Karen confirmó tu pago y tu proyecto entró en producción. Puedes seguir el avance paso a paso desde tu espacio.")}
      ${caja(
        `
        ${fila("Pieza", datos.pieza)}
        ${datos.monto ? fila("Total", money(datos.monto)) : ""}
        ${fila("Código", datos.codigo)}
      `,
        MOSS,
        "#EDF3ED",
      )}
      ${boton("Ver mi pedido", `${APP_URL}/mi-espacio/pedidos`, MOSS)}
    `,
      MOSS,
    ),
  });
}

export function correoPropuestaLista(
  email: string,
  nombre: string,
  datos: { codigo: string; pieza: string },
) {
  return enviar({
    to: email,
    subject: `Hay una propuesta para que la veas — ${datos.pieza}`,
    html: plantilla(`
      ${h2("Tu diseño está en revisión")}
      ${sub("Karen quiere mostrarte cómo va")}
      ${p(`Hola <strong>${esc(nombre)}</strong>,`)}
      ${p(`Tu pieza <strong>${esc(datos.pieza)}</strong> pasó a revisión. Entra a tu espacio para verla y cuéntale a Karen qué ajustarías.`)}
      ${caja(fila("Código", datos.codigo))}
      ${boton("Ver el avance", `${APP_URL}/mi-espacio/pedidos`)}
    `),
  });
}

export function correoEntrega(
  email: string,
  nombre: string,
  datos: { codigo: string; pieza: string; archivos: { name: string; url: string }[] },
) {
  const lista = datos.archivos.length
    ? datos.archivos
        .map(
          (a) =>
            `<p style="margin:0 0 8px;"><a href="${a.url}" style="color:${ORCHID};font-size:14px;">↓ ${esc(a.name)}</a></p>`,
        )
        .join("")
    : `<p style="margin:0;color:${MUTED};font-size:13px;">Los archivos están en tu espacio.</p>`;

  return enviar({
    to: email,
    subject: `Tu pieza está lista — ${datos.pieza}`,
    html: plantilla(`
      ${h2("Tu pieza está lista")}
      ${sub("Entrega final")}
      ${p(`Hola <strong>${esc(nombre)}</strong>,`)}
      ${p(`Terminamos <strong>${esc(datos.pieza)}</strong>. Aquí tienes tus archivos; quedan guardados en tu espacio y no vencen.`)}
      ${caja(lista)}
      ${p("Gracias por confiarle tu historia a Karen.")}
      ${boton("Ver mis archivos", `${APP_URL}/mi-espacio/archivos`)}
    `),
  });
}

// ─── Archivos ─────────────────────────────────────────────────────────────────

const listaArchivos = (nombres: string[]) =>
  nombres.map((n) => `<p style="margin:0 0 6px;color:#5B4636;font-size:14px;">📎 ${esc(n)}</p>`).join("");

export function correoArchivosCompartidos(
  email: string,
  nombre: string,
  datos: { archivos: string[]; nota?: string | null },
) {
  const varios = datos.archivos.length > 1;
  return enviar({
    to: email,
    subject: varios ? "Karen compartió archivos contigo" : `Karen compartió un archivo contigo: ${datos.archivos[0]}`,
    html: plantilla(`
      ${h2(varios ? "Tienes archivos nuevos" : "Tienes un archivo nuevo")}
      ${sub("Karen los dejó en tu espacio")}
      ${p(`Hola <strong>${esc(nombre)}</strong>,`)}
      ${p(`Karen compartió contigo ${varios ? "estos archivos" : "este archivo"}. Por privacidad no van adjuntos al correo: los abres desde tu espacio, con tu cuenta.`)}
      ${caja(listaArchivos(datos.archivos))}
      ${datos.nota ? caja(`<p style="margin:0;color:#5B4636;font-size:14px;line-height:1.6;">${esc(datos.nota)}</p>`, MOSS, "#EDF3ED") : ""}
      ${boton("Ver mis archivos", `${APP_URL}/mi-espacio/archivos`)}
    `),
  });
}

export function avisoArchivosDeClienta(datos: {
  cliente: string;
  email: string;
  archivos: string[];
  nota?: string | null;
}) {
  return enviar({
    to: ADMIN_EMAIL,
    subject: `${datos.cliente} te envió ${datos.archivos.length > 1 ? `${datos.archivos.length} archivos` : "un archivo"}`,
    html: plantilla(`
      ${h2("Te enviaron archivos")}
      ${sub("Están en la ficha de la clienta")}
      ${p(`<strong>${esc(datos.cliente)}</strong> (${esc(datos.email)}) subió a su espacio:`)}
      ${caja(listaArchivos(datos.archivos))}
      ${datos.nota ? caja(`<p style="margin:0;color:#5B4636;font-size:14px;line-height:1.6;">${esc(datos.nota)}</p>`, MOSS, "#EDF3ED") : ""}
      ${boton("Abrir clientes", `${APP_URL}/admin/clientes`)}
    `),
  });
}

// ─── Avisos para Karen ────────────────────────────────────────────────────────

export function avisoNuevaReserva(datos: {
  cliente: string;
  email: string;
  telefono?: string | null;
  servicio: string;
  fecha: Date;
  modalidad: string;
  motivo: string;
  primeraVez: boolean;
}) {
  return enviar({
    to: ADMIN_EMAIL,
    subject: `Nueva reserva: ${datos.cliente} — ${longDate(datos.fecha)}`,
    html: plantilla(`
      ${h2("Nueva reserva")}
      ${sub("Está esperando tu confirmación")}
      ${p(`<strong>${esc(datos.cliente)}</strong> reservó una sesión para el <strong style="color:${ORCHID};">${cuando(datos.fecha)}</strong>.`)}
      ${caja(`
        ${fila("Servicio", datos.servicio)}
        ${fila("Modalidad", datos.modalidad)}
        ${fila("Correo", datos.email)}
        ${fila("Teléfono", datos.telefono)}
        ${datos.primeraVez ? `<p style="margin:6px 0 0;color:${MUTED};font-size:13px;">Es su primera vez en un proceso así.</p>` : ""}
      `)}
      ${caja(
        `<p style="margin:0 0 6px;color:${MUTED};font-size:12px;letter-spacing:.1em;text-transform:uppercase;">Formulario previo</p>
         <p style="margin:0;color:#5B4636;font-size:14px;line-height:1.6;">${esc(datos.motivo)}</p>`,
        MOSS,
        "#EDF3ED",
      )}
      ${boton("Abrir la agenda", `${APP_URL}/admin/agenda`)}
    `),
  });
}

export function avisoCitaCancelada(datos: { cliente: string; servicio: string; fecha: Date }) {
  return enviar({
    to: ADMIN_EMAIL,
    subject: `Cita cancelada: ${datos.cliente} — ${longDate(datos.fecha)}`,
    html: plantilla(`
      ${h2("Una clienta canceló")}
      ${sub("Ese bloque quedó libre")}
      ${p(`<strong>${esc(datos.cliente)}</strong> canceló su sesión de <strong>${esc(datos.servicio)}</strong> del ${cuando(datos.fecha)}.`)}
      ${boton("Abrir la agenda", `${APP_URL}/admin/agenda`)}
    `),
  });
}

export function avisoNuevaSolicitud(datos: {
  cliente: string;
  email: string;
  telefono?: string | null;
  codigo: string;
  pieza: string;
  destinatario: string;
  idea: string;
  cantidad: number;
  formato: string;
  fotos?: number;
}) {
  return enviar({
    to: ADMIN_EMAIL,
    subject: `Nueva solicitud de diseño: ${datos.cliente} — ${datos.pieza}`,
    html: plantilla(`
      ${h2("Nueva solicitud de diseño")}
      ${sub("Esperando tu cotización")}
      ${p(`<strong>${esc(datos.cliente)}</strong> envió una idea desde el configurador.`)}
      ${caja(`
        ${fila("Pieza base", datos.pieza)}
        ${fila("Para", datos.destinatario)}
        ${fila("Cantidad", String(datos.cantidad))}
        ${fila("Formato", datos.formato)}
        ${fila("Correo", datos.email)}
        ${fila("Teléfono", datos.telefono)}
        ${fila("Código", datos.codigo)}
        ${datos.fotos ? fila("Fotos de referencia", `${datos.fotos} (están en la solicitud)`) : ""}
      `)}
      ${caja(
        `<p style="margin:0 0 6px;color:${MUTED};font-size:12px;letter-spacing:.1em;text-transform:uppercase;">Su idea, en sus palabras</p>
         <p style="margin:0;color:#5B4636;font-size:14px;line-height:1.6;">${esc(datos.idea)}</p>`,
        MOSS,
        "#EDF3ED",
      )}
      ${boton("Cotizar la solicitud", `${APP_URL}/admin/solicitudes`)}
    `),
  });
}

export function avisoRespuestaCotizacion(datos: {
  cliente: string;
  codigo: string;
  pieza: string;
  monto: number | null;
  aprobada: boolean;
}) {
  const acento = datos.aprobada ? MOSS : "#9C3B52";
  return enviar({
    to: ADMIN_EMAIL,
    subject: datos.aprobada
      ? `Cotización aprobada: ${datos.cliente} — ${datos.pieza}`
      : `Cotización rechazada: ${datos.cliente} — ${datos.pieza}`,
    html: plantilla(
      `
      ${h2(datos.aprobada ? "Aprobaron tu cotización" : "No siguen con la solicitud")}
      ${sub(datos.aprobada ? "Toca coordinar el pago" : "La solicitud quedó cancelada")}
      ${p(
        datos.aprobada
          ? `<strong>${esc(datos.cliente)}</strong> aprobó la cotización de <strong>${esc(datos.pieza)}</strong>${datos.monto ? ` por ${money(datos.monto)}` : ""}. Cuando recibas el pago, marca «Pago confirmado» en el panel.`
          : `<strong>${esc(datos.cliente)}</strong> decidió no seguir con <strong>${esc(datos.pieza)}</strong>.`,
      )}
      ${caja(fila("Código", datos.codigo), acento, datos.aprobada ? "#EDF3ED" : "#FAEBEE")}
      ${boton("Abrir solicitudes", `${APP_URL}/admin/solicitudes`, acento)}
    `,
      acento,
    ),
  });
}

export function avisoMensajeContacto(datos: {
  nombre: string;
  email: string;
  telefono?: string | null;
  unidad: string;
  mensaje: string;
}) {
  return enviar({
    to: ADMIN_EMAIL,
    subject: `Nuevo mensaje de contacto: ${datos.nombre}`,
    html: plantilla(`
      ${h2("Nuevo mensaje")}
      ${sub("Llegó desde el formulario de contacto")}
      ${caja(`
        ${fila("Nombre", datos.nombre)}
        ${fila("Correo", datos.email)}
        ${fila("Teléfono", datos.telefono)}
        ${fila("Escribe sobre", datos.unidad)}
      `)}
      <p style="margin:0 0 14px;color:#5B4636;font-size:15px;line-height:1.65;white-space:pre-line;">${esc(datos.mensaje)}</p>
      ${boton("Abrir mensajes", `${APP_URL}/admin/mensajes`)}
    `),
  });
}
