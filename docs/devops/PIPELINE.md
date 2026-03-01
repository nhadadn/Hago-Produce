# Pipeline de CI/CD (GitHub Actions)

Este documento describe la configuración del pipeline de integración y despliegue continuo (CI/CD) para Hago Produce.

## Resumen

El pipeline se ejecuta automáticamente en cada `push` a la rama `main` y en cada `pull_request` hacia `main`. Su objetivo es garantizar la calidad del código, la integridad de las pruebas y la capacidad de construcción del proyecto antes de cualquier despliegue.

## Estructura del Pipeline

El flujo de trabajo se define en `.github/workflows/ci.yml` y consta de los siguientes trabajos (jobs) secuenciales:

### 1. Quality Check (`quality`)
**Objetivo:** Verificar el estilo de código y detectar errores estáticos.
- **Herramientas:** ESLint (`npm run lint`)
- **Fallo:** Si existen errores de linting, el pipeline se detiene inmediatamente.

### 2. Unit Tests (`unit-tests`)
**Objetivo:** Ejecutar pruebas unitarias aisladas.
- **Comando:** `npx jest --testPathIgnorePatterns=".*integration.*"`
- **Configuración:** Utiliza `jest.config.js` (default).
- **Cobertura:** Genera reportes de cobertura (`--coverage`).
- **Servicios:** Incluye un contenedor PostgreSQL temporal para asegurar que el cliente de Prisma se genere correctamente, aunque las pruebas unitarias deberían mockear la base de datos.

### 3. Integration Tests (`integration-tests`)
**Objetivo:** Ejecutar pruebas de integración que requieren base de datos real.
- **Dependencia:** Se ejecuta solo si `unit-tests` pasa exitosamente.
- **Comando:** `npm run test:integration`
- **Configuración:** Utiliza `jest.integration.config.ts`.
- **Servicios:** Levanta un contenedor PostgreSQL dedicado (`postgres:15`) con credenciales de prueba.
- **Preparación:** Ejecuta `prisma db push` para sincronizar el esquema con la base de datos temporal antes de las pruebas.

### 4. Build (`build`)
**Objetivo:** Verificar que la aplicación se compile correctamente para producción.
- **Dependencia:** Se ejecuta solo si `integration-tests` pasa exitosamente.
- **Comando:** `npm run build` (Next.js build)
- **Servicios:** Requiere conexión a base de datos (simulada o real) para la generación estática de páginas que dependen de datos.

## Fail Fast
El pipeline está configurado con la propiedad `needs`, lo que asegura que si un paso falla (ej. Linting), los pasos subsiguientes (Tests, Build) no se ejecutan, ahorrando recursos y tiempo de feedback.

## Notificaciones
Actualmente, las notificaciones de fallo se manejan a través de la interfaz de GitHub Actions. Se recomienda configurar alertas por correo electrónico o Slack en la configuración del repositorio si se requiere mayor visibilidad.

## Ejecución Local
Para simular el pipeline localmente, asegúrate de tener una base de datos de prueba corriendo y ejecuta:

```bash
# 1. Lint
npm run lint

# 2. Unit Tests
npx jest --testPathIgnorePatterns=".*integration.*"

# 3. Integration Tests (Requiere DB en localhost:5432)
npm run test:integration

# 4. Build
npm run build
```
