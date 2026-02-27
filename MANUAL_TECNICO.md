# Manual Técnico de Puesta en Marcha - Hago Produce

Este documento detalla el proceso paso a paso para la configuración, despliegue y validación del proyecto Hago Produce en un entorno local.

## 1. Frontend (Next.js)

### Requisitos Previos
- **Node.js**: Versión `v20` (definida en `.nvmrc`).
- **Gestor de Paquetes**: `npm` (incluido con Node.js).

### Instalación de Dependencias
Ejecutar el siguiente comando en la raíz del proyecto para instalar todas las dependencias listadas en `package.json`:

```bash
npm install
```

### Scripts Disponibles
- **Desarrollo**: `npm run dev` - Inicia el servidor de desarrollo en `http://localhost:3000`.
- **Producción (Build)**: `npm run build` - Genera la versión optimizada para producción.
- **Producción (Start)**: `npm run start` - Inicia el servidor de producción (requiere `npm run build` previo).
- **Linting**: `npm run lint` - Analiza el código en busca de errores y problemas de estilo usando ESLint.

### Configuración de Entorno (.env)
Crear un archivo `.env` en la raíz basado en `.env.example`. Ejemplo de configuración local:

```ini
# App
NODE_ENV=development
APP_URL=http://localhost:3000

# Database (Local Docker)
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/hago_produce

# Auth (NextAuth.js)
NEXTAUTH_SECRET=secret_para_desarrollo_local_123
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=jwt_secret_local_123

# AI & Integrations (Reemplazar con valores reales si es necesario)
OPENAI_API_KEY=sk-demo-key
OPENAI_MODEL=gpt-4o-mini
TWILIO_ACCOUNT_SID=AC_demo
TWILIO_AUTH_TOKEN=token_demo
TWILIO_WHATSAPP_NUMBER=+14155238886
```

### Validación de Puerto y CORS
El servidor se inicia por defecto en el puerto `3000`. Para validar que está corriendo correctamente:
1. Iniciar servidor: `npm run dev`
2. Verificar acceso: Abrir `http://localhost:3000` en el navegador.
3. Verificar API: `curl http://localhost:3000/api/health` (debe responder 200 OK si el endpoint existe, o verificar login).

## 2. Backend (API Routes & Prisma)

### Runtime
- **Entorno**: Node.js `v20` (integrado con Next.js).
- **ORM**: Prisma `^5.10.2`.

### Gestión de Base de Datos
Comandos principales para la gestión del esquema y migraciones:

- **Generar Cliente Prisma**:
  ```bash
  npx prisma generate
  ```
  *Nota: Debe ejecutarse después de cada cambio en `prisma/schema.prisma`.*

- **Ejecutar Migraciones (Modo Desarrollo)**:
  ```bash
  npx prisma migrate dev
  ```
  *Esto aplicará los cambios del esquema a la base de datos y actualizará el cliente.*

- **Sembrado de Datos (Seed)**:
  ```bash
  npx prisma db seed
  ```
  *Puebla la base de datos con datos iniciales definidos en `prisma/seed.ts`.*

### Health Check
El backend está integrado en Next.js. La disponibilidad se verifica junto con el frontend. Se recomienda verificar los logs de la consola para asegurar que la conexión a la base de datos es exitosa al iniciar.

## 3. Base de Datos (PostgreSQL)

### Motor
- **Versión**: PostgreSQL `15-alpine` (definido en `docker-compose.yml`).
- **Puerto Externo**: `5433` (mapeado al 5432 del contenedor para evitar conflictos locales).

### Credenciales (Local)
- **Usuario**: `postgres`
- **Contraseña**: `postgres`
- **Base de Datos**: `hago_produce`

### Validación de Conectividad
Desde la terminal, se puede verificar la conexión usando `psql` o cualquier cliente SQL:

```bash
# Usando docker exec si el contenedor está corriendo
docker exec -it hago-produce-db-1 psql -U postgres -d hago_produce -c "\dt"
```

## 4. Logging

### Regla de los Dos Loggers (TD-LOGGER-001)

El proyecto utiliza dos sistemas de logging distintos para separar las responsabilidades entre el servidor (Node.js/Next.js API) y el cliente (Browser/React). Es crucial usar el logger correcto según el contexto de ejecución para evitar errores de compilación y dependencias.

#### 1. Logger del Servidor (`logger.service.ts`)
- **Archivo**: `src/lib/logger/logger.service.ts`
- **Implementación**: Winston + Sentry (Node.js)
- **Contexto**: `Server Components`, `API Routes`, `Server Actions`, `Services`, `Scripts`.
- **Directorios Típicos**:
  - `src/app/api/**`
  - `src/lib/services/**`
  - `src/lib/infrastructure/**`
  - `src/scripts/**`

#### 2. Logger del Cliente (`client-logger.ts`)
- **Archivo**: `src/lib/logger/client-logger.ts`
- **Implementación**: `console` wrapper (seguro para navegador)
- **Contexto**: `Client Components` (con "use client"), `Hooks`, `Contexts`.
- **Directorios Típicos**:
  - `src/components/**`
  - `src/lib/hooks/**`
  - `src/app/**/page.tsx` (si tiene "use client")

#### Error Común y Solución
**Error**: `Module parse failed: Unexpected character '�' (1:0)` o errores relacionados con binarios de Sentry/Winston en el navegador.
**Causa**: Importar `logger.service.ts` en un componente de cliente (`"use client"`).
**Solución**: Cambiar la importación a `client-logger.ts`.

```typescript
// ❌ INCORRECTO en componentes de cliente ("use client")
import { logger } from "@/lib/logger/logger.service";

// ✅ CORRECTO en componentes de cliente
import { clientLogger as logger } from "@/lib/logger/client-logger";
```
