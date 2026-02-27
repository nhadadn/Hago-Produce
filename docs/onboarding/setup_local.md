# Guía de Setup Local — HAGO PRODUCE

**Última actualización:** 2026-02-22

Esta guía explica cómo preparar un entorno de desarrollo local para trabajar con el proyecto **HAGO PRODUCE** en este repositorio.

Está orientada a desarrolladores que usan Windows, pero los pasos son equivalentes en otros sistemas.

---

## 1. Prerrequisitos

- **Sistema operativo:** Windows (soportado; también funciona en macOS/Linux).  
- **Node.js:** versión >= 20.x.  
- **Git** instalado.  
- **Docker** (opcional pero recomendado) para levantar PostgreSQL local.  
- Acceso a:
  - Un **PostgreSQL** accesible (local o Railway).  
  - Claves de OpenAI y, opcionalmente, Twilio/Telegram si quieres probar notificaciones reales.

---

## 2. Clonar el repositorio

```bash
git clone https://github.com/nhadadn/Hago-Produce.git
cd Hago-Produce
```

> Asegúrate de estar en la carpeta raíz del proyecto antes de continuar.

---

## 3. Instalar dependencias

El proyecto utiliza `npm` con `package-lock.json` committeado.

```bash
npm install
```

Esto instalará todas las dependencias definidas en `package.json`.

---

## 4. Configurar variables de entorno

1. Copia el archivo de ejemplo:

   ```bash
   copy .env.example .env
   ```

   En PowerShell también puedes usar:

   ```bash
   Copy-Item .env.example .env
   ```

2. Edita `.env` y completa al menos:

   ```dotenv
   NODE_ENV=development
   APP_URL=http://localhost:3000

   # Base de datos (PostgreSQL local o Railway)
   # Nota: El puerto 5433 es el expuesto por docker-compose para evitar conflictos
   DATABASE_URL=postgresql://postgres:postgres@localhost:5433/hago_produce

   # Auth
   NEXTAUTH_SECRET=alguna-cadena-aleatoria
   NEXTAUTH_URL=http://localhost:3000
   JWT_SECRET=cambia-esto-por-un-secret-seguro

   # OpenAI
   OPENAI_API_KEY=sk-...

   # Railway (para CI/CD o despliegues automáticos)
   RAILWAY_TOKEN=...
   RAILWAY_PROJECT_ID=...

   # Webhooks / integraciones
   MAKE_WEBHOOK_SECRET=tu-secreto-para-make
   NOTIFICATIONS_WEBHOOK_SECRET=tu-secreto-notificaciones
   NOTIFICATIONS_WEBHOOK_URL=http://localhost:3000/webhooks/notifications/send
   ```

> En desarrollo puedes usar secretos simples, pero en producción deben ser valores largos y aleatorios.

---

## 5. Base de datos

El sistema requiere PostgreSQL. Puedes usar Docker o Railway.

### 5.1. PostgreSQL local con Docker (recomendado para dev)

Si tienes Docker instalado, puedes levantar la DB con:

```bash
docker-compose up -d
```

Revisa que el `docker-compose.yml` exponga el puerto correcto (habitualmente `5432`) y ajusta `DATABASE_URL` en `.env` si es necesario.

### 5.2. PostgreSQL en Railway

Alternativamente, puedes:

1. Crear un proyecto en Railway.  
2. Añadir un servicio de tipo **PostgreSQL**.  
3. Copiar el `DATABASE_URL` que genera Railway y pegarlo en `.env`.

---

## 6. Migrar el esquema de Prisma

Con la base de datos accesible y `DATABASE_URL` configurada:

```bash
npx prisma migrate dev
```

Esto aplicará las migraciones en `prisma/migrations/` y generará el cliente Prisma.

Opcionalmente, puedes abrir Prisma Studio para inspeccionar los datos:

```bash
npx prisma studio
```

---

## 7. Levantar el entorno de desarrollo

Para arrancar la app en modo desarrollo:

```bash
npm run dev
```

Por defecto, la aplicación quedará disponible en:

- `http://localhost:3000`

Puedes verificar el healthcheck en:

- `http://localhost:3000/api/health`

---

## 8. Rutas clave para probar

Una vez levantado el servidor:

- **Login interno:** `/login`  
  - Necesitarás tener al menos un usuario creado (puede ser por seed manual o inserción directa en DB, o usando `/api/v1/auth/register`).

- **Backoffice (usuarios internos):**
  - Dashboard principal: `/` (según configuración de navegación).
  - Productos: `/products`.
  - Proveedores: `/suppliers`.
  - Clientes: `/customers` (según rutas configuradas).
  - Usuarios: `/users`.
  - Facturas: `/invoices`.
  - Chat de negocio (IA): `/chat`.

- **Portal de cliente clásico:**
  - `/(customer)/my-invoices` (por navegación existente).

- **Nuevo portal cliente `(portal)`:**
  - Login por RFC/tax_id: `/portal/login`.  
  - Dashboard cliente: `/portal/...` según tus rutas implementadas (por ejemplo `/portal/dashboard`).

---

## 9. Ejecutar tests

Para validar que las pruebas pasan correctamente:

```bash
npm test
```

Esto ejecutará los tests configurados en Jest (`jest.config.js`), incluyendo:

- Tests unitarios en `src/tests/unit/*`.  
- Tests de integración en `src/tests/integration/*` (APIs, portal, webhooks, etc.).

Es recomendable ejecutar los tests antes de hacer cualquier commit importante.

---

## 10. Build de producción (opcional)

Para validar que el proyecto compila correctamente:

```bash
npm run build
```

Si quieres probar el modo producción localmente:

```bash
npm start
```

Esto usará el build `standalone` configurado en Next.js.

---

## 11. Notificaciones y webhooks en desarrollo

Si quieres probar el sistema de notificaciones:

1. Asegúrate de tener configuradas en `.env`:
   - `NOTIFICATIONS_WEBHOOK_SECRET`
   - `NOTIFICATIONS_WEBHOOK_URL` (por ejemplo `http://localhost:3000/webhooks/notifications/send`).

2. Con la app corriendo (`npm run dev`), realiza una llamada de prueba al webhook:

   ```bash
   curl -X POST http://localhost:3000/webhooks/notifications/send ^
     -H "Content-Type: application/json" ^
     -H "x-api-key: <tu-secret>" ^
     -d "{\"channel\":\"whatsapp\",\"text\":\"Hola\",\"toWhatsApp\":\"whatsapp:+5215555550000\"}"
   ```

3. Revisa los logs de la consola para confirmar que el flujo se ejecuta. En desarrollo puedes mockear Twilio/Telegram o usar credenciales reales si ya las tienes.

---

## 12. Buenas prácticas para nuevos desarrolladores

- Antes de empezar una tarea, revisa:
  - `docs/architecture/current_state.md` (este documento).  
  - `docs/phase0/summary.md` para entender el contexto histórico y de negocio.
- Cada vez que cambies APIs, modelos de datos o flujos críticos:
  - Actualiza la documentación correspondiente en `docs/`.  
  - Asegúrate de que `npm test` y `npm run build` pasen.
- Usa ramas de feature y Pull Requests con descripción clara y enlaces a tareas del roadmap.

