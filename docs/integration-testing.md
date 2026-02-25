# Guía de Testing de Integración End-to-End

Este documento describe el sistema de pruebas de integración implementado para validar flujos críticos de negocio contra una base de datos real.

## 1. Arquitectura

El sistema utiliza:
- **Jest**: Runner de pruebas.
- **Docker**: Contenedor de base de datos PostgreSQL dedicado para pruebas.
- **Prisma**: ORM para interactuar con la base de datos real.
- **GitHub Actions**: Pipeline de CI/CD para ejecución automática.

### Diferencias con Tests Unitarios
- **Unitarios**: Usan mocks para todo (`prisma-mock`, `openai-mock`). Rápidos, aislados.
- **Integración**: Usan **Base de Datos Real** (Docker). Validan constraints, triggers, transacciones y queries complejas. Mocks solo para servicios externos (OpenAI, Twilio).

## 2. Configuración Local

### Requisitos
- Docker y Docker Compose instalados y corriendo.
- Node.js 18+.

### Ejecución de Tests

1. **Levantar Entorno de Pruebas**:
   ```bash
   npm run test:integration:up
   ```
   Esto inicia un contenedor Postgres en el puerto 5434.

2. **Preparar Base de Datos**:
   ```bash
   npm run test:integration:setup
   ```
   Esto espera a que la DB esté lista y hace push del schema de Prisma.

3. **Ejecutar Tests**:
   ```bash
   npm run test:integration
   ```

4. **Limpiar Recursos**:
   ```bash
   npm run test:integration:down
   ```

### Debugging
Para ejecutar un test específico en modo watch:
```bash
npx jest -c jest.integration.config.ts src/tests/integration/services/create-order.integration.test.ts --watch
```

## 3. Escribiendo Nuevos Tests

### Estructura
Los tests de integración viven en `src/tests/integration`.
Cada archivo debe terminar en `.integration.test.ts`.

### Patrón de Test
```typescript
import prisma from '../utils/db';
import { resetDb } from '../utils/db';

describe('Mi Funcionalidad', () => {
  // Limpiar DB antes de cada test para asegurar aislamiento
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('debe persistir datos correctamente', async () => {
    // 1. Arrange: Crear datos iniciales en DB real
    const user = await prisma.user.create({ ... });

    // 2. Act: Ejecutar lógica de negocio real
    await miServicio.ejecutarAccion(user.id);

    // 3. Assert: Verificar estado en DB
    const result = await prisma.resultado.findFirst({ ... });
    expect(result).toBeDefined();
  });
});
```

### Utilerías
- `resetDb()`: Trunca todas las tablas (excepto migraciones) para dejar la DB limpia.
- `prisma`: Instancia de cliente conectada a la DB de test.

## 4. CI/CD Pipeline

El workflow `.github/workflows/integration.yml` se ejecuta en cada PR:
1. Levanta Docker con Postgres.
2. Configura entorno y migraciones.
3. Ejecuta los tests.
4. Reporta éxito/fallo.

## 5. Mejores Prácticas

- **No usar mocks de Prisma**: El objetivo es probar la DB real.
- **Mockear APIs externas**: OpenAI, Twilio, Stripe deben ser mockeados en `src/tests/integration/setup.ts` para evitar costos y latencia.
- **Limpieza**: Siempre usar `resetDb()` en `beforeEach`.
- **Datos Dinámicos**: Usar factories o crear datos en el test, no depender de seeds globales si es posible, para evitar interdependencias.
