# ClaseAccesible — Frontend

Interfaz web de **ClaseAccesible**, construida con React 19, TypeScript, Vite y Tailwind CSS v4 para transcripción de clases en tiempo real y subtítulos accesibles.

## Funcionalidades principales

### Docente
* **Panel y cursos:** Creación de cursos y sesiones con generación de código de acceso (`CreateSessionModal`) y navegación directa al historial por curso.
* **Sala en vivo (`/teacher/session/:code`):** Captura de audio del micrófono, transcripción en tiempo real mediante Deepgram (con tokens efímeros emitidos por el backend), retransmisión STOMP/SockJS, copia rápida de código y **contador en tiempo real de estudiantes conectados**.
* **Historial y exportación (`/teacher/history`):** Listado de sesiones con fecha, estado, búsqueda por curso/código, filtro por curso (`?courseId=...`), visor de transcripción con resaltado de términos y exportación a PDF (`jspdf`).

### Estudiante
* **Ingreso y sala de subtítulos en vivo (`/student/join`, `/student/session/:code`):** Unión mediante código con registro automático de asistencia y recepción de subtítulos por WebSocket en tiempo real.
* **Accesibilidad y modo flotante (PiP):** Ajustes de lectura (tamaño de fuente, tema claro/oscuro/alto contraste y tipografía) y modo Picture-in-Picture (Document PiP en Chromium y fallback por Canvas en navegadores compatibles).
* **Preferencias persistentes (`/student/settings`):** Configuración guardada de tamaño de fuente, alto contraste, tema e idioma preferido con vista previa en vivo.
* **Historial y exportación (`/student/history`):** Consulta de clases asistidas, detalle de transcripción con buscador y **descarga en PDF** con metadatos de la sesión y marcas de tiempo.

## Variables de entorno

Copia `.env.example` a `.env` y ajusta las URLs del backend:

```env
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
```

## Desarrollo local

Requiere `pnpm`:

```bash
pnpm install
pnpm dev
```

Otros scripts disponibles en `package.json`:

* `pnpm build`: compila TypeScript (`tsc -b`) y genera el bundle de producción en `dist/`.
* `pnpm lint`: ejecuta `oxlint`.
* `pnpm preview`: previsualiza el build de producción.

## Despliegue

El archivo `vercel.json` incluye la regla de reescritura hacia `/index.html` para soportar las rutas SPA de React Router en Vercel.
