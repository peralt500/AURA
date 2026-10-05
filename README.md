# 🎵 Agenda Creadores

Plataforma MVP para artistas y creadores independientes: **Landing pública de perfil** + **Captura de fans con doble confirmación (Double Opt-in)** + **Panel privado de administración** + **Difusión de correos masivos por lotes con Resend**.

Construido con **Next.js 14+ (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase** y **Resend**.

---

## 📋 Índice
1. [Características Principales](#-características-principales)
2. [Stack Tecnológico](#-stack-tecnológico)
3. [Variables de Entorno](#-variables-de-entorno)
4. [Paso 1: Configurar Supabase y Correr la Migración](#-paso-1-configurar-supabase-y-correr-la-migración)
5. [Paso 2: Crear el Usuario del Artista](#-paso-2-crear-el-usuario-del-artista)
6. [Paso 3: Ejecutar el Seed de Datos Iniciales](#-paso-3-ejecutar-el-seed-de-datos-iniciales)
7. [Paso 4: Verificar Dominio y Remitente en Resend](#-paso-4-verificar-dominio-y-remitente-en-resend)
8. [Paso 5: Ejecución en Entorno Local](#-paso-5-ejecución-en-entorno-local)
9. [Paso 6: Despliegue en Vercel](#-paso-6-despliegue-en-vercel)
10. [Flujo de Pruebas y Validación](#-flujo-de-pruebas-y-validación)

---

## ✨ Características Principales

- **Landing Pública (`/[username]`):**
  - Perfil del artista con avatar, bio y botón para compartir nativo.
  - Hub de redes sociales con enlaces dinámicos (Instagram, TikTok, YouTube, Merch, etc.).
  - Agenda interactiva de conciertos y fechas futuras con enlace a compra de entradas.
  - Galería visual fotográfica con pies de foto.
  - Formulario de suscripción para fans protegido con **Cloudflare Turnstile** anti-bots.
- **Flujo de Suscripción con Doble Opt-in:**
  - Envío automático de correo con enlace seguro de confirmación (`/api/confirm?token=...`).
  - Enlace de baja en un clic (`/api/unsubscribe?token=...`) y cabeceras compatibles con RFC `List-Unsubscribe`.
- **Panel Privado (`/dashboard`):**
  - Autenticación segura sin contraseñas (Magic Link vía Supabase Auth).
  - Métricas clave: total de fans, fans activos confirmados, tasa de confirmación (%) y próximos eventos.
  - Tabla de fans con buscador en tiempo real, filtros de estado y exportación a **CSV**.
  - Gestores interactivos en tiempo real para eventos, galería y edición de perfil.
  - Pestaña de **Enviar Correo (Broadcast)** con conteo en vivo de destinatarios activos, previsualización en tiempo real, modal de confirmación e historial detallado de campañas.

---

## 🛠️ Stack Tecnológico

- **Framework:** Next.js 14+ (App Router, Server Actions, Server Components)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS con tema oscuro por defecto y estética Glassmorphism
- **Base de Datos & Auth:** Supabase (PostgreSQL, Row Level Security, Supabase Auth SSR)
- **Emailing:** Resend SDK (envío transaccional y envíos masivos por lotes de 100 con `resend.batch.send`)
- **Captcha:** Cloudflare Turnstile (`@marsidev/react-turnstile`)
- **Iconografía:** Lucide React

---

## 🔑 Variables de Entorno

Copia el archivo [.env.local.example](file:///c:/Users/david/Programacion_david/agenda-creadores/.env.local.example) a `.env.local`:

```bash
cp .env.local.example .env.local
```

### Detalle de variables requeridas:

| Variable | Descripción | ¿Dónde obtenerla? |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de la API de tu proyecto Supabase | Supabase > Project Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública anónima de Supabase | Supabase > Project Settings > API > `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave secreta con rol de servicio (**nunca exponer al cliente**) | Supabase > Project Settings > API > `service_role` `secret` |
| `RESEND_API_KEY` | Llave API de Resend (`re_...`) | [Resend Dashboard](https://resend.com/api-keys) |
| `RESEND_FROM_EMAIL` | Remitente verificado (ej. `hola@tudominio.com` o `onboarding@resend.dev` para pruebas) | [Resend Domains](https://resend.com/domains) |
| `NEXT_PUBLIC_SITE_URL` | URL base de la app (ej. `http://localhost:3000` en local o `https://tu-app.vercel.app` en producción) | Tu dominio o URL de Vercel |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Site Key pública de Cloudflare Turnstile | [Cloudflare Dashboard](https://dash.cloudflare.com/) > Turnstile |
| `TURNSTILE_SECRET_KEY` | Secret Key privada de Cloudflare Turnstile | Cloudflare Dashboard > Turnstile |

> 💡 **Nota para desarrollo local:** Cloudflare ofrece claves de prueba que siempre aprueban el reto:
> - `NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA`
> - `TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA`

---

## 🗄️ Paso 1: Configurar Supabase y Correr la Migración

1. Inicia sesión en [Supabase](https://supabase.com) y crea un nuevo proyecto (o utiliza uno existente).
2. En el menú lateral izquierdo de tu proyecto Supabase, entra a **SQL Editor**.
3. Abre el archivo de migración de este repositorio:  
   [`supabase/migrations/20261005000000_init_schema.sql`](file:///c:/Users/david/Programacion_david/agenda-creadores/supabase/migrations/20261005000000_init_schema.sql).
4. Pega todo el contenido en el SQL Editor y presiona el botón **Run**.
5. Esto creará:
   - Las tablas `creators`, `fans`, `events`, `gallery_items` y `broadcast_logs`.
   - Las políticas RLS (Row Level Security) para aislar datos privados y permitir lectura pública en landings.
   - Triggers automáticos para actualizar `updated_at`.
   - Restricciones e índices de rendimiento.

---

## 👤 Paso 2: Crear el Usuario del Artista

El sistema utiliza **Magic Links** (enlace seguro sin contraseña enviado al correo) a través de Supabase Auth:

1. Inicia la aplicación localmente (`npm run dev`) o ábrela en tu despliegue.
2. Navega a `http://localhost:3000/login`.
3. Ingresa tu correo electrónico (el correo con el que administrarás el panel) y haz clic en **Enviar enlace de acceso**.
4. Abre tu bandeja de entrada y haz clic en el enlace de acceso generado por Supabase.
5. Esto registrará automáticamente tu usuario en la tabla interna de Supabase `auth.users` y creará tu sesión.

---

## 🌱 Paso 3: Ejecutar el Seed de Datos Iniciales

Para vincular tu usuario recién registrado con el perfil público de creador y cargar datos de demostración (eventos, fotos de galería y fans de prueba):

1. Regresa al **SQL Editor** en tu panel de Supabase.
2. Abre el archivo [`supabase/seed.sql`](file:///c:/Users/david/Programacion_david/agenda-creadores/supabase/seed.sql).
3. En la línea 19, sustituye `'artista@ejemplo.com'` por el correo exacto con el que hiciste login en el **Paso 2**:
   ```sql
   v_artist_email TEXT := 'tu-correo-real@ejemplo.com';
   ```
4. Presiona el botón **Run**.
5. El script:
   - Vinculará tu `user_id` de `auth.users` con el perfil del creador (`lunavalente`).
   - Cargará la biografía inicial, redes sociales, eventos de la gira y fotos de la galería.
   - Cargará fans de prueba (confirmados, pendientes y baja) para verificar filtros y métricas.
6. Ahora, al entrar a `/dashboard`, verás tu panel completamente operativo con datos reales.

---

## ✉️ Paso 4: Verificar Dominio y Remitente en Resend

Para enviar correos masivos a cualquier dirección sin restricciones:

### A. Para Entorno de Pruebas / Desarrollo Local:
- Puedes usar el dominio de pruebas que Resend provee por defecto:
  ```env
  RESEND_FROM_EMAIL=onboarding@resend.dev
  ```
- *Limitación:* Resend en modo sandbox únicamente permite enviar correos a la dirección de email con la que te registraste en Resend.

### B. Para Producción (Dominio Propio):
1. Inicia sesión en [Resend](https://resend.com) y dirígete a la sección **Domains**.
2. Haz clic en **Add Domain** e introduce tu dominio (ej. `tudominio.com`).
3. Resend te mostrará los registros DNS requeridos:
   - **DKIM** (tipo `TXT`)
   - **SPF** (tipo `MX` y `TXT`)
4. Accede al panel de administración de tu proveedor de DNS (Cloudflare, Namecheap, GoDaddy, etc.) y añade los registros tal como los indica Resend.
5. Haz clic en **Verify DNS Records** en Resend hasta que el estado cambie a **Verified** (suele tardar entre 2 y 10 minutos).
6. Configura tu variable de entorno con una dirección de ese dominio verificado:
   ```env
   RESEND_FROM_EMAIL=notificaciones@tudominio.com
   ```
7. El pie de cada correo masivo incluirá automáticamente el nombre artístico, la dirección configurada en `RESEND_FROM_EMAIL` y el enlace directo de baja del fan para cumplir con las normativas CAN-SPAM y GDPR.

---

## 💻 Paso 5: Ejecución en Entorno Local

1. Instala las dependencias del proyecto:
   ```bash
   npm install
   ```
2. Asegúrate de tener tu archivo `.env.local` configurado con todas las variables del paso anterior.
3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Rutas disponibles:
   - **Landing del creador:** `http://localhost:3000/lunavalente`
   - **Inicio de sesión:** `http://localhost:3000/login`
   - **Panel de administración:** `http://localhost:3000/dashboard`

---

## 🚀 Paso 6: Despliegue en Vercel

1. Sube tu código a un repositorio de **GitHub**, **GitLab** o **Bitbucket**.
2. Entra a [Vercel](https://vercel.com) e inicia sesión.
3. Haz clic en **Add New...** > **Project** e importa tu repositorio.
4. En la configuración del proyecto, despliega la sección **Environment Variables** y agrega todas las variables de entorno de producción:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL` (correo de tu dominio verificado)
   - `NEXT_PUBLIC_SITE_URL` (tu URL final de Vercel, ej. `https://mi-agenda.vercel.app`)
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   - `TURNSTILE_SECRET_KEY`
5. Haz clic en **Deploy**.
6. **Configuración de URLs en Supabase:**
   - En tu panel de Supabase, ve a **Authentication** > **URL Configuration**.
   - En **Site URL**, ingresa la URL de producción de Vercel (`https://mi-agenda.vercel.app`).
   - En **Redirect URLs**, añade:
     - `https://mi-agenda.vercel.app/**`
     - `http://localhost:3000/**` (para mantener compatibilidad local)

---

## 🧪 Flujo de Pruebas y Validación

Sigue esta lista de verificación para confirmar que todo funciona de extremo a extremo:

1. **Prueba de Captura y Doble Opt-in:**
   - Ingresa a la landing pública `/[username]`.
   - Rellena el formulario con un correo real y resuelve el captcha.
   - Revisa tu bandeja de entrada: debes recibir un email de confirmación con el asunto *“Confirma tu suscripción a las novedades de [Artista]”*.
   - Haz clic en **Confirmar suscripción**: serás redirigido a la pantalla de confirmación exitosa.
2. **Validación en Panel:**
   - Entra a `/dashboard` y ve a la pestaña **Fans**.
   - El correo registrado debe aparecer con el badge verde **Confirmado**.
3. **Envío de Campaña Masiva (Broadcast):**
   - Ve a la pestaña **Enviar Correo** en `/dashboard`.
   - Observa el contador de fans confirmados que recibirán el correo.
   - Escribe un asunto y mensaje.
   - Haz clic en **Vista previa** para verificar el diseño.
   - Haz clic en **Enviar correo** y confirma en el modal.
   - Revisa tu bandeja de entrada: comprueba que el remitente, asunto, cuerpo y el pie de página (con nombre, dirección y enlace de baja) se muestren correctamente.
4. **Prueba de Baja (Unsubscribe):**
   - En el correo masivo recibido, haz clic en **Darte de baja**.
   - Comprueba la pantalla de confirmación de desuscripción.
   - En el Dashboard, pestaña **Fans**, el fan ahora debe figurar como **Baja** y el contador de envíos disponibles se reducirá automáticamente.
