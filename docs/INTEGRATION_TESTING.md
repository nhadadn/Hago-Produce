# Guía de Testing de Integración - Hago Produce

Este documento detalla la estrategia, configuración y mejores prácticas para los tests de integración en el proyecto Hago Produce.

## 🎯 Objetivo
Validar flujos de negocio completos contra una base de datos real (PostgreSQL en Docker), asegurando la integridad de las transacciones, constraints de base de datos y lógica compleja que los mocks unitarios no pueden cubrir.

## 🛠️ Configuración del Entorno

### Requisitos Previos
- Docker Desktop instalado y corriendo.
- Node.js v20+.

### Ejecución Local
Para ejecutar los tests de integración en tu máquina local:

1. **Levantar Base de Datos de Prueba**:
   El sistema levanta automáticamente un contenedor Docker dedicado en el puerto `5434`.
   ```bash
   npm run test:integration:up
   ```

2. **Ejecutar Tests**:
   ```bash
   npm run test:integration
   ```

3. **Limpiar Recursos**:
   Al finalizar, detener y eliminar volúmenes.
   ```bash
   npm run test:integration:down
   ```

### Comandos Útiles
| Comando | Descripción |
|---------|-------------|
| `npm run test:integration` | Ejecuta todos los tests de integración. |
| `npm run test:integration:watch` | Ejecuta tests en modo watch (ideal para desarrollo). |
| `npm run test:integration:setup` | Configura la DB de prueba (schema push). |

## 📝 Cómo Escribir Nuevos Tests

### 1. Ubicación y Nomenclatura
- **Ubicación**: `src/tests/integration/`
- **Sufijo**: `*.integration.test.ts`
- **Estructura**: Agrupar por dominio (ej. `webhooks/`, `services/`).

### 2. Estructura Básica de un Test
Cada test debe ser **autocontenido** y **limpiar su estado**. Usamos `resetDb()` antes de cada test suite o test case según sea necesario.

```typescript
import { resetDb } from '../utils/db';
import prisma from '../utils/db';

describe('Integration: Mi Funcionalidad', () => {
  beforeEach(async () => {
    await resetDb(); // Limpia TODAS las tablas (TRUNCATE CASCADE)
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('debería crear una orden exitosamente', async () => {
    // 1. ARRANGE (Preparar datos en DB real)
    const customer = await prisma.customer.create({ data: { ... } });

    // 2. ACT (Ejecutar lógica de negocio)
    const result = await miServicio.crearOrden(customer.id);

    // 3. ASSERT (Verificar resultados y estado en DB)
    expect(result.success).toBe(true);
    
    const ordenEnDb = await prisma.order.findUnique({ where: { id: result.id } });
    expect(ordenEnDb).not.toBeNull();
  });
});
```

### 3. Patrones para Datos de Prueba
- **Factories**: Evita hardcodear IDs. Deja que la DB genere UUIDs o usa `create` con datos mínimos.
- **Relaciones**: Crea las entidades relacionadas en el orden correcto (ej. Customer -> Product -> Price -> Order).
- **Limpieza**: El utilitario `resetDb()` se encarga de truncar tablas. No necesitas borrar manualmente al final del test.

## 🧪 Casos de Prueba Recomendados

### Consultas Complejas
Verifica que los `include`, `where` complejos y `orderBy` funcionen como se espera en la base de datos real.

### Transacciones
Simula fallos en mitad de una operación para asegurar que se haga **rollback**.
*Ejemplo*: Intentar crear una factura con un producto inexistente dentro de una transacción debería fallar y no dejar una factura "a medias".

### Triggers y Constraints
Verifica que la DB lance errores cuando se violan restricciones (ej. `unique`, `foreign key`).

## ⚠️ Solución de Problemas Comunes

### Error: `P2003 Foreign key constraint failed`
- **Causa**: Estás intentando crear un registro que referencia a otro que no existe.
- **Solución**: Asegúrate de crear las dependencias (ej. Customer, Product) en la fase de `Setup` del test.

### Error: `Connection to localhost:5434 failed`
- **Causa**: El contenedor Docker no está corriendo.
- **Solución**: Ejecuta `npm run test:integration:up` y espera unos segundos.

### Tests lentos
- **Causa**: Reiniciar la DB completa en cada test (`beforeEach`) es costoso.
- **Solución**: Si los tests son de solo lectura, usa `beforeAll` para el seed inicial. Si escriben, mantén `beforeEach` para aislamiento total (preferido por seguridad).

### Conflictos de Schema
- **Causa**: El schema de `prisma/schema.prisma` cambió pero la DB de prueba no se actualizó.
- **Solución**: Ejecuta `npm run test:integration:setup` para hacer `db push`.

## 🔄 CI/CD
El pipeline de GitHub Actions (`.github/workflows/integration-tests.yml`) ejecuta estos tests automáticamente en cada Pull Request. Si fallan, el PR no podrá mergearse.
