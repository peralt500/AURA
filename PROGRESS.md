# Estado del Proyecto - Agenda Creadores (MVP)

> Documento de seguimiento del progreso de desarrollo del MVP: landing pública de artista + captura de fans con doble confirmación (double opt-in) + panel privado de gestión + envíos de correos por lotes con Resend.

---

## 📊 Resumen General por Fases

| Fase | Descripción | Estado |
| :--- | :--- | :---: |
| **Fase 1** | Setup & Arquitectura base | ✅ Completado |
| **Fase 2** | Modelado de Base de Datos y Supabase (Schema, RLS, Seed) | ✅ Completado |
| **Fase 3** | Landing pública del artista + Captura y Doble Opt-in | ✅ Completado |
| **Fase 4** | Panel privado del creador (Dashboard, Fans, Eventos, Galería, Perfil) | ✅ Completado |
| **Fase 5** | Sistema de Broadcast / Envíos masivos y puesta a punto final | 🟡 En progreso (Funcionalidad base lista, pendiente validación y configs externas) |

---

## ✅ Fases Completadas (1 a 4)

### 🚀 Fase 1: Setup & Arquitectura Base
- **Framework y Entorno:** Next.js 14+ con App Router, TypeScript en modo estricto y Tailwind CSS con tema oscuro por defecto y estética glassmorphism (`glass-card`, degradados violeta/fucsia).
- **Tipografía y UI:** Integración de Google Font *Inter*, soporte para componentes responsivos mobile-first e iconos mediante `lucide-react`.
- **Integraciones y Clientes:**
  - `@supabase/ssr` y `@supabase/supabase-js`: Configuración de clientes para Server Components, Client Components, Server Actions y middleware de refresco de tokens (`lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`, `middleware.ts`).
  - Cliente de administración de Supabase con `SUPABASE_SERVICE_ROLE_KEY` aislado estrictamente en el entorno del servidor.
  - SDK de **Resend** inicializado en servidor para correos transaccionales y masivos.
  - Cloudflare **Turnstile** para protección contra bots en formularios públicos.
- **Configuración de Entorno:** Plantilla [.env.local.example](file:///c:/Users/david/Programacion_david/agenda-creadores/.env.local.example) con todas las variables requeridas documentadas.

---

### 🗄️ Fase 2: Modelado de Base de Datos (Supabase)
- **Esquema SQL DDL (`supabase/migrations/20261005000000_init_schema.sql`):**
  - Tabla `creators`: Perfil del artista, slug único (`username`), bio, avatar, `social_links` en formato JSONB, vinculado a `auth.users(id)`.
  - Tabla `fans`: Registro de suscriptores con `creator_id`, correo único por creador, tokens únicos para confirmación (`confirmation_token`) y baja (`unsubscribe_token`), marcas de tiempo `confirmed_at` y `unsubscribed_at`.
  - Tabla `events`: Agenda de presentaciones/conciertos con fecha, título, lugar, ciudad y enlace de venta de entradas.
  - Tabla `gallery_items`: Fotos y momentos destacados con URL de imagen, pie de foto y orden (`sort_order`).
  - Tabla `broadcast_logs`: Historial de boletines enviados con asunto, cuerpo, número de destinatarios y fecha de envío.
- **Seguridad RLS (Row Level Security):**
  - Políticas de lectura pública para perfiles de creador, eventos y galería.
  - Políticas de aislamiento por creador autenticado (`auth.uid() = user_id`) para gestión privada.
  - Inserción y actualización protegida de fans gestionada de forma segura vía Server Actions y Service Role.
- **Triggers y Automatización:** Trigger automático para actualización de `updated_at` en todas las tablas.
- **Tipado TypeScript:** Generación y definición de tipos centralizados en [types/database.ts](file:///c:/Users/david/Programacion_david/agenda-creadores/types/database.ts).
- **Datos de prueba:** Script [supabase/seed.sql](file:///c:/Users/david/Programacion_david/agenda-creadores/supabase/seed.sql) para creación de perfil de prueba, eventos y galería inicial.

---

### 🌐 Fase 3: Landing Pública del Creador (`app/[username]/`)
- **Página Dinámica SSR ([app/[username]/page.tsx](file:///c:/Users/david/Programacion_david/agenda-creadores/app/[username]/page.tsx)):**
  - Resolución dinámica de perfil por slug (`username`) con `notFound()` automático si no existe.
  - Generación de metadatos SEO en servidor (`generateMetadata`) para OpenGraph / Twitter Cards al compartir en redes sociales.
- **Componentes Modulares ([components/landing/](file:///c:/Users/david/Programacion_david/agenda-creadores/components/landing)):**
  - [CreatorHeader](file:///c:/Users/david/Programacion_david/agenda-creadores/components/landing/CreatorHeader.tsx): Avatar optimizado con fallback de iniciales, nombre, bio y botón de compartir nativo (`navigator.share` / copia al portapapeles).
  - [SocialHub](file:///c:/Users/david/Programacion_david/agenda-creadores/components/landing/SocialHub.tsx): Enlaces directos a redes (Instagram, YouTube, TikTok, Spotify, Shopify/Merch) con iconos dinámicos.
  - [EventsAgenda](file:///c:/Users/david/Programacion_david/agenda-creadores/components/landing/EventsAgenda.tsx): Lista cronológica de próximas fechas, badges de estado, localización y enlace a entradas.
  - [Gallery](file:///c:/Users/david/Programacion_david/agenda-creadores/components/landing/Gallery.tsx): Cuadrícula visual optimizada para imágenes con soporte para pie de foto.
  - [FanCaptureForm](file:///c:/Users/david/Programacion_david/agenda-creadores/components/landing/FanCaptureForm.tsx): Formulario con verificación invisible o interactiva de Cloudflare Turnstile, prevención de envíos duplicados y feedback de éxito/error.
- **Flujo de Doble Confirmación (Double Opt-in):**
  - Acción de servidor [captureFan](file:///c:/Users/david/Programacion_david/agenda-creadores/lib/actions/fans.ts): Verificación de captcha, comprobación de suscriptor existente y envío de correo transaccional de confirmación con Resend.
  - Endpoint [app/api/confirm/route.ts](file:///c:/Users/david/Programacion_david/agenda-creadores/app/api/confirm/route.ts): Valida `token`, marca `confirmed_at` y redirige a pantalla de éxito.
  - Endpoint [app/api/unsubscribe/route.ts](file:///c:/Users/david/Programacion_david/agenda-creadores/app/api/unsubscribe/route.ts): Permite darse de baja en un clic mediante `token`, actualizando `unsubscribed_at`.

---

### 🎛️ Fase 4: Panel Privado del Creador (`app/dashboard/`)
- **Autenticación sin Contraseñas (Magic Link):**
  - Página de login [app/login/page.tsx](file:///c:/Users/david/Programacion_david/agenda-creadores/app/login/page.tsx) con envío de enlace mágico vía Supabase Auth.
  - Acciones de servidor [lib/actions/auth.ts](file:///c:/Users/david/Programacion_david/agenda-creadores/lib/actions/auth.ts) (`signInWithMagicLink`, `signOut`).
- **Protección de Sesión y Layout:**
  - [app/dashboard/layout.tsx](file:///c:/Users/david/Programacion_david/agenda-creadores/app/dashboard/layout.tsx): Validación de usuario autenticado en servidor, redirección a `/login` si no hay sesión, barra superior con perfil del creador y botón de cerrar sesión.
- **Métricas Clave:**
  - Tarjetas de resumen con: Total de fans registrados, Fans confirmados/activos, Tasa de confirmación (%) y Próximos eventos.
- **Gestores Integrados en Pestañas ([components/dashboard/](file:///c:/Users/david/Programacion_david/agenda-creadores/components/dashboard)):**
  - [FansListTable](file:///c:/Users/david/Programacion_david/agenda-creadores/components/dashboard/FansListTable.tsx): Tabla interactiva con filtro de estado (Todos, Confirmados, Pendientes, Bajas), buscador en tiempo real por email y exportación a **CSV** descargable.
  - [EventsManager](file:///c:/Users/david/Programacion_david/agenda-creadores/components/dashboard/EventsManager.tsx): Creación, edición y eliminación de eventos en tiempo real con Server Actions dedicadas.
  - [GalleryManager](file:///c:/Users/david/Programacion_david/agenda-creadores/components/dashboard/GalleryManager.tsx): Añadir y eliminar fotografías/enlaces a imágenes con reordenación y actualización inmediata.
  - [ProfileEditor](file:///c:/Users/david/Programacion_david/agenda-creadores/components/dashboard/ProfileEditor.tsx): Modificación de nombre artístico, slug (`username`), biografía y URLs de redes sociales.

---

## 📬 Fase 5: Envíos Masivos (Broadcast) & Cierre de MVP

### Lo que ya está construido en la Fase 5:
1. **Acción de Servidor de Envío por Lotes ([lib/actions/broadcast.ts](file:///c:/Users/david/Programacion_david/agenda-creadores/lib/actions/broadcast.ts)):**
   - Agrupación automática en bloques de hasta 100 correos (`BATCH_SIZE = 100`) para respetar los límites de la API `resend.batch.send()`.
   - Filtrado estricto en base de datos: solo se envía a fans con `confirmed_at IS NOT NULL` y `unsubscribed_at IS NULL`.
   - Encabezados RFC de baja en un clic (`List-Unsubscribe` y `List-Unsubscribe-Post`).
   - Plantilla HTML responsiva con escape de caracteres HTML para prevenir inyecciones maliciosas.
   - Registro automático de cada campaña en la tabla `broadcast_logs`.
2. **Interfaz de Campañas ([components/dashboard/BroadcastEmailForm.tsx](file:///c:/Users/david/Programacion_david/agenda-creadores/components/dashboard/BroadcastEmailForm.tsx)):**
   - Contador en vivo de los fans que recibirán el mensaje.
   - Campos de asunto y cuerpo con límites de longitud y contadores de caracteres.
   - Botón de previsualización en tiempo real del diseño del correo antes de enviarlo.
   - Modal de confirmación explícita para evitar envíos accidentales.
   - Historial desplegable de envíos anteriores con fecha, destinatarios y contenido.

---

### ⏳ Lo que falta / Próximos pasos para completar la Fase 5:

1. **Configuración de Variables de Entorno Reales (`.env.local`):**
   - Sustituir los placeholders de [.env.local.example](file:///c:/Users/david/Programacion_david/agenda-creadores/.env.local.example) con credenciales activas:
     - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `RESEND_API_KEY` y `RESEND_FROM_EMAIL` (configurar dominio verificado en Resend o `onboarding@resend.dev` en entorno de prueba)
     - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY` (o claves de testing de Cloudflare Turnstile)
     - `NEXT_PUBLIC_SITE_URL` (p. ej. `http://localhost:3000` o URL de producción)

2. **Ejecución del Esquema y Seed en Supabase:**
   - Correr la migración [supabase/migrations/20261005000000_init_schema.sql](file:///c:/Users/david/Programacion_david/agenda-creadores/supabase/migrations/20261005000000_init_schema.sql) en el SQL Editor del proyecto Supabase.
   - Ejecutar [supabase/seed.sql](file:///c:/Users/david/Programacion_david/agenda-creadores/supabase/seed.sql) asignando el correo electrónico con el que iniciarás sesión como creador en la variable `v_artist_email`.

3. **Prueba Integral End-to-End (E2E) del Flujo de Correo:**
   - **Registro:** Probar registro desde la landing pública `/[username]` superando el Turnstile.
   - **Confirmación:** Verificar recepción del email de confirmación y pulsar el enlace para activar el fan.
   - **Envío masivo:** Crear una campaña desde la pestaña "Enviar Correo" del Dashboard y verificar la recepción en la bandeja de entrada.
   - **Baja:** Pulsar el enlace "Darte de baja" al pie del correo masivo y comprobar que el estado se actualiza en el panel y no vuelve a recibir correos.

4. **Resiliencia y Rate Limiting para Listas Grandes:**
   - Si la audiencia supera los 1.000 fans (10+ lotes consecutivos), agregar un retardo o control de concurrencia (`sleep` o cola simple) entre llamadas batch de Resend para respetar los límites de ratio por segundo (rate limit de 2 req/s en cuentas estándar de Resend).

5. **Pruebas de Compilación y Despliegue:**
   - Validar ejecución local limpia con `npm run dev` y compilación de producción con `npm run build`.
   - Configuración en plataforma de despliegue (Vercel / Cloudflare).
