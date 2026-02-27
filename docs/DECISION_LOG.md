# Registro de Decisiones de Arquitectura (ADR) - Hago Produce

Este documento registra las decisiones importantes de diseño y arquitectura tomadas durante el desarrollo del proyecto.

## 2026-02-27: Vinculación de PriceList a Supplier

### Contexto
Inicialmente se consideró vincular `PriceList` a `Customer` para manejar listas de precios de venta. Sin embargo, en la industria de productos frescos (Produce), los costos de adquisición son altamente volátiles y dependen del proveedor (Supplier).

### Decisión
Se decidió vincular `PriceList` a `Supplier` (`supplierId`) en lugar de `Customer`.

### Justificación
1.  **Volatilidad de Costos**: Los precios de los proveedores cambian frecuentemente (diario/semanal). Es crítico mantener un historial de costos por proveedor para analizar márgenes y tendencias.
2.  **Gestión de Compras**: Permite comparar precios entre diferentes proveedores para el mismo producto antes de generar una Orden de Compra.
3.  **Precios de Venta Dinámicos**: Los precios de venta a clientes suelen calcularse en base al costo actual + margen, o mediante acuerdos específicos, por lo que una lista de precios estática por cliente es menos común o se maneja mediante reglas de negocio sobre el costo base.
4.  **Modelo de Datos**: La entidad `ProductPrice` ya existía con referencia a Supplier, y `PriceList` formaliza la agrupación de estos precios en versiones temporales (vigencia `validFrom` - `validTo`).

### Estado
Aceptado e Implementado.

### Consecuencias
- Las listas de precios de venta (si se requieren fijas) deberán implementarse en el futuro, posiblemente como `CustomerPriceList` o mediante descuentos sobre un precio base.
- El sistema prioriza la gestión de costos de entrada.

## 2026-02-27: Scripts CLI mantienen console.*

### Contexto
Los scripts de mantenimiento y verificación en la carpeta `scripts/` (ej. `verify-tax-data.ts`, `seed.ts`) se ejecutan manualmente desde la terminal (CLI) por desarrolladores o administradores.

### Decisión
Se permite y mantiene el uso de `console.log`, `console.warn` y `console.error` en estos scripts, a diferencia del código de producción (`src/lib/services`, `src/app/api`) donde se exige el uso de `LoggerService`.

### Justificación
1.  **Interacción Directa**: El objetivo principal de estos scripts es proporcionar feedback inmediato y legible en la terminal al operador humano.
2.  **Simplicidad**: Evita la complejidad de configurar transportes de logs (archivos, servicios externos) para scripts efímeros o de uso puntual.
3.  **Estándar de Industria**: Es convención común que herramientas CLI utilicen stdout/stderr directamente.

### Estado
Aceptado.

### Consecuencias
- Los scripts en `scripts/` están exentos de la regla de "No console logs".
- Se debe asegurar que estos scripts no importen código de producción que dependa implícitamente de un contexto de ejecución diferente (aunque `LoggerService` debería funcionar en ambos).

## 2026-02-27: Deprecación de ProductPrice y Transición a PriceVersion

### Contexto
El modelo `ProductPrice` existía en el esquema original para almacenar precios de productos vinculados directamente a proveedores. Sin embargo, se introdujo `PriceList` y `PriceVersion` para manejar historiales de precios y vigencias de manera más robusta. El análisis actual mostró que la tabla `ProductPrice` está vacía en el entorno de desarrollo, aunque existen referencias en el código.

### Decisión
Se decide marcar el modelo `ProductPrice` como **deprecated** en `schema.prisma` y planificar su eliminación en el Sprint 7.

### Justificación
1.  **Redundancia**: `PriceVersion` (junto con `PriceList`) ofrece una estructura superior para gestionar precios con vigencia temporal, lo cual es crítico en el negocio de productos frescos. `ProductPrice` solo permitía un precio "actual" y un historial implícito menos estructurado.
2.  **Limpieza de Datos**: La tabla `ProductPrice` está vacía, lo que facilita la transición sin necesidad de migración de datos compleja en este momento.
3.  **Estandarización**: Se busca unificar la gestión de precios bajo el modelo de `PriceList` / `PriceVersion`.

### Estado
Aceptado. Deprecado en código, pendiente eliminación.

### Consecuencias
- El código existente que utiliza `ProductPrice` (servicios, API, reportes) deberá ser refactorizado para utilizar `PriceVersion` y `PriceList` antes de la eliminación definitiva del modelo en el Sprint 7.
- Se generarán advertencias de uso de `@deprecated` en el cliente de Prisma, alertando a los desarrolladores sobre la necesidad de migrar.

### Actualización: Mitigación de Riesgo de Escritura (Dual Write)
Se implementó un mecanismo de "Dual Write" en `ProductPriceService` para mitigar el riesgo de pérdida de datos en la tabla deprecated.
- **Acción**: `ProductPriceService.create` y `update` ahora escriben tanto en `ProductPrice` (legacy) como en `PriceVersion` (nuevo).
- **Beneficio**: Asegura que `PriceVersion` comience a poblarse con datos reales inmediatamente, facilitando la migración de los consumidores de lectura en el futuro.
- **Webhooks**: Se refactorizó `src/app/api/v1/webhooks/make/route.ts` para utilizar el servicio centralizado en lugar de escrituras directas a la base de datos.

