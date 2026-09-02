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
