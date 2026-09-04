# SoyKarengi · Karen Ramos

Plataforma digital de **Karen Ramos**: una marca paraguas con dos unidades de negocio que comparten
tecnología, clientes, pagos y administración.

> **SoyKarengi** — Mente entrenada · Vida con propósito
>
> *Porque hay momentos que necesitan ser acompañados… y otros que merecen ser recordados.*

## Las dos unidades

| Unidad | Qué resuelve | Rutas |
|---|---|---|
| **01 · Bienestar y acompañamiento** | Perfil de Karen, servicios (psicología, Life Coaching, mentoría), especialidades, agenda con reserva y formulario previo | `/acompanamiento`, `/acompanamiento/servicios/[slug]`, `/acompanamiento/agenda` |
| **02 · Diseños con Propósito** | Vitrina por categorías (Eventos · Personal · Con propósito), ficha de cada pieza, configurador de 5 pasos y solicitudes a medida | `/disenos`, `/disenos/[slug]`, `/configurador` |

Ambas viven en el mismo aplicativo, con **universos de color propios** (ciruela para acompañamiento,
verde para diseños) y **una sola base de clientes**.

### El menú son cinco entradas

`Inicio · Acompañamiento · Diseños · Recursos · Mi espacio`. Configurador, blog y contacto viven
dentro de su sección: un menú largo obliga a elegir antes de entender. `Recursos` absorbió el blog y
funciona como hub de contenidos.

## Piezas transversales

La agenda del panel es un **calendario por horas** (mes / semana / día) sobre el listado: arrastra una
cita para reagendarla, o selecciona un rango libre para agendar a alguien o **bloquear** ese horario.
Lo bloqueado deja de ofrecerse en la agenda pública.

- **Mi espacio** (`/mi-espacio`) — citas, diseños, pedidos, archivos entregados, favoritos y datos del
  cliente, en una única cuenta.
- **Finanzas** (`/admin/finanzas`) — ingresos, egresos y balance con gráficos.
- **Panel administrativo** (`/admin`) — dashboard, servicios, agenda, categorías, diseños, solicitudes,
  pedidos, clientes segmentados, contenido, mensajes y estadísticas.
- **Contenido** — blog y recursos (`/blog`, `/recursos`), editables desde el panel.

### La vitrina se filtra por intención, no por categoría

Nadie busca «PERSONAL»: busca **regalar**. Sobre los tres grupos del catálogo hay un filtro de
intención —celebrar, regalar, homenajear, inspirar, compartir un momento— y un sexto camino que
lleva directo al configurador: *crear algo único*.

Cada pieza declara a qué intenciones responde en la columna `intents` (claves separadas por coma,
editable desde el panel con casillas). Si la deja vacía, hereda el grupo de su categoría. Una pieza
puede responder a varias, así que el filtro **cruza categorías**: «homenajear» devuelve piezas de
Homenajes, de Mensajes especiales y de Graduaciones a la vez.

El filtro se resuelve en memoria a propósito: el catálogo es corto y SQLite no sabe consultar una
lista separada por comas.

### El flujo de una solicitud de diseño

```
SOLICITUD → COTIZADA → APROBADA → PAGADA → EN DISEÑO → REVISIÓN → APROBACIÓN FINAL → ENTREGADA
```

Cada estado tiene **su propio color** (`REQUEST_COLOR` en `src/lib/domain.ts`) y el tracker dibuja
una barra de avance del color del estado actual más «Paso 3 de 8 · 37% listo». Así el cliente ve
dónde está sin tener que leer las ocho etiquetas. Karen lo mueve desde el panel; una solicitud que
ya pasó por caja aparece además como **pedido**.

### Antes de reservar

Quien no sabe qué servicio elegir sí sabe cómo se siente. En `/acompanamiento/servicios` y en la
agenda hay seis maneras de nombrarlo —*necesito sentirme mejor*, *necesito claridad*, *quiero avanzar
en un proyecto*, *estoy atravesando un cambio*, *necesito acompañamiento*, *no estoy segura*— y cada
una apunta a una especialidad (`NEEDS`). Sin certeza, cae en la conversación de orientación, que es
la respuesta correcta cuando no hay certeza.

El cruce usa la especialidad **sin traducir**: en inglés `specialty` sería «Psychology» y ya no
calzaría con la tabla.

### Finanzas: el ingreso no se escribe dos veces

Los ingresos **no** viven en una tabla aparte: salen de los datos que ya existen. Una cita
`COMPLETADA` vale el precio de su servicio y un pedido con `paidAt` vale su cotización. Así el
balance no puede divergir de la operación, y de paso el módulo responde la pregunta comercial del
proyecto: **cuánto aporta cada unidad de negocio**.

El modelo `Movement` (`kind: INGRESO | EGRESO`) guarda sólo lo que no pasa por la plataforma: los
egresos y las ventas de fuera del sitio (ferias, encargos por WhatsApp). Un solo modelo, un solo
formulario, una sola tabla.

La página trae presets de semana / mes / año más rango libre, cuatro KPIs con margen, barras de
ingresos contra egresos —por día si el rango es corto, por mes si es largo—, dos donas (de dónde
viene el dinero, en qué se va) y exportación a CSV. Los gráficos van dibujados a mano con SVG y
divs: no vale traer una librería de charts entera por dos formas.

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

La marca es el **logo de SoyKarengi**: la figura que se eleva dentro del círculo. Se recortó del
original con fondo transparente en dos piezas, porque el lockup entero a 32 px sería ilegible:

| Archivo | Qué es | Dónde va |
|---|---|---|
| `soykarengi-isotipo.png` | Sólo el círculo con la figura, 512 px | Cabecera, pie, pantallas de acceso, favicon |
| `soykarengi-logo.png` | Isotipo + la palabra SOY KARENGI, 900 px | Portada y Open Graph |

El original trae **su propia bajada** grabada bajo la palabra. El lockup se corta justo después de
KARENGI porque la bajada de la marca es la del documento —*«Mente entrenada · Vida con propósito»*—
y dos frases compitiendo en la misma pantalla no dicen nada. Va como texto, no como imagen: así se
traduce al inglés y se cambia en un solo sitio (`brand.tagline` en los diccionarios).

Sobre fondo oscuro el isotipo va sobre un disco crema (`<BrandMark plate />`): la ciruela del trazo
se pierde contra el marrón.

`public/karen-retrato.png` es su **fotografía**, no la marca, así que se quedó donde se presenta
ella: «Sobre Karen» y las páginas por especialidad.

Las fotografías del negocio viven en `public/`:

| Archivo | Dónde aparece |
|---|---|
| `sparkwell-marca.jpg` | «Sobre Karen» — su tarjeta de marca con credenciales y pilares |
| `producto-tote.jpg` | Portada de Diseños y ficha del bolso |
| `producto-renacer.jpg` | Portada de Diseños y ficha de la polera |
| `sparkwell-caja.jpg` | Sección «Qué pasa después» de la vitrina |

Un diseño puede llevar **foto real** (columna `image`) o quedarse con la **portada generada**
determinista de `design-visual.tsx`. Karen carga la ruta desde el panel; si la deja vacía, se dibuja
la portada. Las piezas con foto encabezan la vitrina a propósito.

La identidad no es una paleta: es una **arquitectura de marca de dos universos** sobre una tinta
marrón común.

| Familia | Uso | Tokens | Color |
|---|---|---|---|
| Marrón | Tinta transversal de la marca | `ink`, `ink-soft`, `muted` | `#38261A` |
| Beige y crema | Puente entre las dos unidades | `sand`, `shell`, `cream` | `#D0B69E` · `#EEE1D5` |
| Ciruela malva | Unidad 01 · estructura, encabezados, navegación | `orchid-deep`, `orchid`, `orchid-soft`, `mauve` | `#6B4A68` |
| Rosa vieja | Acción de la marca: botones, CTA, links, estados | `rose`, `rose-deep`, `rose-soft` | `#C0526B` |
| Verde | Unidad 02 · Diseños con Propósito | `moss-deep`, `moss`, `moss-soft` | `#494C31` · `#8BB08E` |
| Ámbar | Estados: cotización pendiente | `amber`, `amber-ink` | `#B4823C` |

Los nombres de token se conservaron a propósito (`orchid` pasó de morado a ciruela malva, `rose` de
rosa fucsia a rosa vieja): cambiar los valores en un solo sitio recolorea la plataforma entera sin
tocar componentes. Lo único que sí cambió de familia es la Unidad 02, que antes compartía el rosa con
la marca y ahora tiene su verde.

Todo se define una sola vez en el bloque `@theme` de `src/app/globals.css`; ningún componente
inventa un color propio. Las claves de `PALETTES` (`src/lib/domain.ts`) son datos guardados en la
base para las portadas de la vitrina: **cambia sus valores, nunca sus nombres.**

## SEO: una URL por búsqueda real

«Psicóloga online en español» o «regalos personalizados» son búsquedas concretas, y cada una tiene
su página con su contenido:

| Ruta | Búsqueda que responde |
|---|---|
| `/acompanamiento/psicologia` | psicóloga online en español |
| `/acompanamiento/life-coaching` | life coach en español |
| `/acompanamiento/mentoria` | mentoría para mujeres |
| `/acompanamiento/orientacion` | primera sesión de orientación |
| `/disenos/categoria/[slug]` | una por categoría del catálogo (17) |

Las de especialidad se definen en `SPECIALTY_PAGES` y su copy vive en los diccionarios, así que
existen también en inglés. Se suman `sitemap.xml` (50 URLs, generado desde la base), `robots.txt`
—que deja fuera `/admin`, `/mi-espacio` y `/api`—, canonicals y Open Graph.

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
  notificaciones por correo y WhatsApp, recuperación de contraseña y verificación de cuenta (las
  cuatro últimas necesitan un proveedor de correo, que hoy no está contratado).
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
