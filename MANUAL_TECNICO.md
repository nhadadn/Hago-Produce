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

### Política de Respaldo (Sugerida)
Para entornos de producción (ej. Railway), configurar respaldos automáticos diarios. En local, se puede realizar un dump manual:

```bash
pg_dump -h localhost -p 5433 -U postgres -d hago_produce > backup_$(date +%Y%m%d).sql
```

## 4. Infraestructura Común (Docker)

### Archivo `docker-compose.yml`
El proyecto incluye un archivo `docker-compose.yml` que define los servicios necesarios (Base de datos PostgreSQL).

### Levantar el Stack
Para iniciar la infraestructura (base de datos) en segundo plano:

```bash
docker-compose up -d db
```

*Nota: El servicio `app` también está definido pero para desarrollo local se recomienda correr `npm run dev` en el host para mejor experiencia de desarrollo (HMR), usando solo Docker para la base de datos.*

### Verificar Estado
```bash
docker-compose ps
```
Todos los contenedores deben estar en estado `Up`.

## 5. Integración y Pruebas Finales

### Comando de Validación Completa
Para asegurar la calidad del código antes de un commit o despliegue, ejecutar la siguiente cadena de comandos:

```bash
npm run lint && npm run test
```

- **Lint**: Verifica estilo y errores estáticos.
- **Test**: Ejecuta pruebas unitarias con Jest.
- **E2E**: Para pruebas end-to-end (requiere servidor corriendo): `npm run test:e2e` (Playwright).

### Checklist de Verificación Manual
1. [ ] `docker-compose up -d db` ejecuta sin errores.
2. [ ] `npx prisma migrate dev` aplica migraciones correctamente.
3. [ ] `npm run dev` inicia el servidor en puerto 3000.
4. [ ] La página de inicio carga correctamente en el navegador.
5. [ ] Login/Registro funciona (crea usuario en DB).

## 6. Documentación de Entrega (Resumen)

### Instalación Rápida
1. **Clonar repositorio**: `git clone <url-repo>`
2. **Configurar entorno**: `cp .env.example .env` (ajustar valores si es necesario).
3. **Iniciar DB**: `docker-compose up -d db`
4. **Instalar dependencias**: `npm install`
5. **Migrar DB**: `npx prisma migrate dev`
6. **Iniciar App**: `npm run dev`

### Solución de Problemas Frecuentes
- **Error de conexión a DB**: Verificar que el contenedor de Docker esté corriendo (`docker-compose ps`) y que el puerto `5433` no esté ocupado.
- **Errores de Prisma**: Si hay errores de esquema, intentar `npx prisma generate` y luego `npx prisma migrate dev`.
- **Puerto 3000 ocupado**: Verificar procesos node o cambiar puerto en `package.json` o comando de inicio (`port=3001 npm run dev`).

### Contacto
Para soporte técnico, contactar al equipo de desarrollo o crear un issue en el repositorio.
