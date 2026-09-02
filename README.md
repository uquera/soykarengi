# SoyKarengi · Karen Ramos

Plataforma digital de **Karen Ramos**: una marca paraguas con dos unidades de negocio que comparten
tecnología, clientes, pagos y administración.

> Acompañamiento · Creación · Propósito
>
> *Porque hay momentos que necesitan ser acompañados… y otros que merecen ser recordados.*

## Las dos unidades

| Unidad | Qué resuelve | Rutas |
|---|---|---|
| **01 · Bienestar y acompañamiento** | Perfil de Karen, servicios (psicología, Life Coaching, mentoría), especialidades, agenda con reserva y formulario previo | `/acompanamiento`, `/acompanamiento/servicios/[slug]`, `/acompanamiento/agenda` |
| **02 · Diseños con Propósito** | Vitrina por categorías (Eventos · Personal · Con propósito), ficha de cada pieza, configurador de 5 pasos y solicitudes a medida | `/disenos`, `/disenos/[slug]`, `/configurador` |

Ambas viven en el mismo aplicativo, con acentos visuales distintos (salvia para acompañamiento,
terracota para diseños) y **una sola base de clientes**.

## Piezas transversales

La agenda del panel es un **calendario por horas** (mes / semana / día) sobre el listado: arrastra una
cita para reagendarla, o selecciona un rango libre para agendar a alguien o **bloquear** ese horario.
Lo bloqueado deja de ofrecerse en la agenda pública.

- **Mi espacio** (`/mi-espacio`) — citas, diseños, pedidos, archivos entregados, favoritos y datos del
  cliente, en una única cuenta.
- **Panel administrativo** (`/admin`) — dashboard, servicios, agenda, categorías, diseños, solicitudes,
  pedidos, clientes segmentados, contenido, mensajes y estadísticas.
- **Contenido** — blog y recursos (`/blog`, `/recursos`), editables desde el panel.

### El flujo de una solicitud de diseño

```
SOLICITUD → COTIZADA → APROBADA → PAGADA → EN DISEÑO → REVISIÓN → APROBACIÓN FINAL → ENTREGADA
```

El cliente lo ve como una línea de tiempo en Mi espacio; Karen lo mueve desde el panel. Una solicitud
que ya pasó por caja aparece además como **pedido**.

### La segmentación que importa

Un cliente puede llegar por los diseños y quedarse por los servicios, o al revés. El panel clasifica a
cada persona en *usa ambas unidades* / *solo acompañamiento* / *solo diseños* / *registrado sin
actividad*: ahí está la oportunidad comercial.

## Bilingüe y en dólares

Karen atiende desde Estados Unidos, así que **todos los precios se muestran y se cotizan en USD**.

La plataforma es **bilingüe español/inglés** con un botón discreto `ES · EN` en la cabecera (y en el
panel de acceso). El idioma se guarda en una cookie por un año.

- La **interfaz** vive en `src/lib/dictionaries/es.ts` y `en.ts`. El español es el idioma de origen:
  el diccionario inglés se tipa contra él, así que una clave nueva sin traducir no compila.
- El **contenido** (servicios, categorías, diseños, blog y recursos) tiene columnas `…En` opcionales
  en la base de datos. Karen escribe la versión en inglés desde el panel, en un bloque plegable al
  final de cada formulario; lo que deje vacío se muestra en español.
- El panel administrativo está solo en español, por decisión: lo usa Karen.

## Zona horaria

Karen atiende desde Estados Unidos, así que **toda la agenda vive en `America/New_York`**
(`src/lib/timezone.ts`), sin importar dónde esté el servidor ni desde dónde mire el cliente:

- El proceso de Node arranca con `TZ=America/New_York`, de modo que el cálculo de bloques en el
  servidor usa el reloj de Karen.
- Los formateadores de fecha y el calendario reciben `timeZone` explícito. FullCalendar necesita el
  plugin `@fullcalendar/luxon3` para entender una zona con nombre: sin él cae a UTC en silencio.
- La agenda pública y la página de contacto muestran la zona bajo el horario de atención.

## Identidad visual

La marca es **el rostro de Karen**: `public/karen-logo.png` (círculo de 512 px, recortado y
enmascarado desde su retrato de marca) aparece en la cabecera, el pie y las pantallas de acceso;
`public/karen-retrato.png` preside la portada.

Las fotografías del negocio viven en `public/`:

| Archivo | Dónde aparece |
|---|---|
| `sparkwell-marca.jpg` | «Sobre Karen» — su tarjeta de marca con credenciales y pilares |
| `producto-tote.jpg` | Portada de Diseños y ficha del bolso |
| `producto-renacer.jpg` | Portada de Diseños y ficha de la polera |
| `sparkwell-caja.jpg` | Sección «Experiencias de creación» |

Un diseño puede llevar **foto real** (columna `image`) o quedarse con la **portada generada**
determinista de `design-visual.tsx`. Karen carga la ruta desde el panel; si la deja vacía, se dibuja
la portada. Las piezas con foto encabezan la vitrina a propósito.

La paleta vive sobre **ciruela y crema**, con un acento por unidad:

| Familia | Uso | Tokens |
|---|---|---|
| Morado | Marca y Unidad 01 · Acompañamiento | `orchid`, `orchid-deep`, `orchid-soft` |
| Rosa | Unidad 02 · Diseños con Propósito | `rose`, `rose-deep`, `rose-soft` |
| Ámbar | Estados: cotización pendiente | `amber`, `amber-ink` |

Todo se define una sola vez en el bloque `@theme` de `src/app/globals.css`; ningún componente
inventa un color propio. Las claves de `PALETTES` (`src/lib/domain.ts`) son datos guardados en la
base para las portadas de la vitrina: **cambia sus valores, nunca sus nombres.**

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions) + **React 19**
- **TypeScript** y **Tailwind CSS v4**
- **Prisma 6** sobre **SQLite**
- Sesiones propias con **JWT** (`jose`) en cookie httpOnly y **bcrypt**
- Build `standalone`, desplegado con **PM2** detrás de Nginx

Las portadas de la vitrina se generan de forma determinista a partir del slug de cada pieza
(`src/components/design-visual.tsx`), así que la vitrina se ve completa desde el primer día y cada
diseño conserva siempre la misma composición.

## Correr en local

```bash
npm install
cp .env.example .env      # ajusta AUTH_SECRET
npm run db:push
npm run db:seed
npm run dev
```

### Cuentas del seed

| Rol | Correo | Contraseña |
|---|---|---|
| Administradora | `karen@soykarengi.com` | `karengi2026` |
| Cliente demo | `demo@soykarengi.com` | `demo1234` |

> Cambia ambas contraseñas antes de usar la plataforma con datos reales.

## Variables de entorno

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Ruta del archivo SQLite, relativa a `prisma/` |
| `AUTH_SECRET` | Firma de las sesiones. Debe ser largo y aleatorio en producción |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Credenciales del admin que crea el seed |

## Roadmap

Fase 1 (esta entrega) cubre home, las dos unidades, agenda, vitrina, configurador, registro de
clientes, Mi espacio y panel administrativo completo.

- **Fase 2** — pasarela de pago, carrito para piezas prediseñadas, subida real de archivos,
  notificaciones por correo y WhatsApp.
- **Fase 3** — configurador avanzado con IA para conceptualizar diseños, recomendaciones,
  cotización automática, analytics, CRM y programa de clientes recurrentes.

El núcleo es modular a propósito: el mismo core (clientes, agenda, catálogo, pedidos) sirve para
otros profesionales que combinan servicios con productos.

---

Desarrollado por **HYPNOS** · hypnosapps@gmail.com

## Producción

| Dato | Valor |
|---|---|
| URL | https://karengi.srv1485601.hstgr.cloud |
| Servidor | VPS Hostinger `31.97.86.247` |
| Carpeta | `/root/soykarengi` |
| Proceso PM2 | `soykarengi` (puerto 3023) |
| Base de datos | SQLite en `/root/soykarengi/prisma/prod.db` |
| SSL | Let's Encrypt vía certbot, renovación automática |

Para desplegar cambios:

```bash
ssh -i "C:/Users/Usuario/.ssh/id_ed25519" root@31.97.86.247 "cd /root/soykarengi && git pull origin main && npm run build && cp -r .next/static .next/standalone/.next/static && cp -r public .next/standalone/public && pm2 restart soykarengi"
```

Si cambia `prisma/schema.prisma`, corre además `npx prisma db push` antes del build.
El `.env` de producción vive en dos lugares: `/root/soykarengi/.env` (para Prisma CLI) y
`/root/soykarengi/.next/standalone/.env` (para el server de PM2, con la ruta absoluta de la BD).
