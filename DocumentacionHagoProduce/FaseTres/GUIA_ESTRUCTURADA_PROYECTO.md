# 📚 Guía Estructurada del Proyecto Hago Produce (Post-Sprint 3)

**Versión**: 1.0.0 (Pre-Alpha)
**Fecha**: 2026-02-24
**Stack**: Next.js, Prisma, PostgreSQL (Neon), OpenAI, SendGrid/Resend

---

## 1. Visión General del Proyecto

**Hago Produce** es una plataforma integral para la gestión de operaciones IMMEX (Industria Manufacturera, Maquiladora y de Servicios de Exportación), enfocada en el cumplimiento normativo (Anexo 24/31) y la eficiencia operativa.

### Componentes Principales
1.  **Chatbot Inteligente**: Interfaz conversacional para consultas rápidas y acciones (crear órdenes, consultar estatus).
2.  **Portal de Clientes**: Dashboard seguro para visualización de facturas, estados de cuenta y descargas.
3.  **Sistema de Gestión (Backend)**: Motor de reglas de negocio, validaciones fiscales y orquestación de servicios.

---

## 2. Arquitectura Técnica (Actualizada)

### Backend
*   **Framework**: Next.js App Router (API Routes).
*   **Base de Datos**: PostgreSQL (Neon) con Prisma ORM.
*   **Servicios**:
    *   `ChatService`: Procesamiento de lenguaje natural (OpenAI) e intención de usuario.
    *   `EmailService`: Envío transaccional (Facturas, POs) con templates HTML.
    *   `TelegramService`: Notificaciones push y comandos rápidos.
    *   `PurchaseOrderService`: Generación inteligente de órdenes de compra.
    *   `ReportCache`: Optimización de consultas pesadas con Redis/In-memory.

### Frontend
*   **Portal Privado**: `/app/portal` (Protegido con NextAuth).
*   **Componentes UI**: Shadcn/ui (Radix UI + Tailwind CSS).
*   **Estado**: React Server Components (RSC) + Client Components para interactividad.
*   **Pendiente**: `/app/(public)` (Landing Page SPA).

---

## 3. Guía de Uso de Nuevas Funcionalidades (Sprint 3)

### A. Servicio de Email Unificado (`S3-P07`)
Permite enviar correos transaccionales con plantillas predefinidas.
```typescript
await emailService.sendInvoiceEmail(customerEmail, invoiceNumber, pdfBuffer, customerName);
```

### B. Órdenes de Compra Inteligentes (`S3-P06`)
El sistema analiza el historial de compras y sugiere proveedores óptimos.
1.  **Extracción**: El bot identifica productos y cantidades desde el chat.
2.  **Sugerencia**: Se listan proveedores con mejores precios/tiempos.
3.  **Generación**: Se crea la PO en estado `DRAFT` o `PENDING`.
4.  **Envío**: Se dispara el correo al proveedor seleccionado.

### C. Reportes de Alto Rendimiento (`S3-P02`)
Los reportes financieros complejos ahora responden en <30ms gracias al cache.
*   **Endpoint**: `/api/v1/reports/revenue`
*   **Cache TTL**: 5 minutos (configurable).
*   **Invalidación**: Automática al crear/modificar facturas.

---

## 4. Gaps y Deuda Técnica (Post-Sprint 3)

### Críticos (Bloqueantes)
1.  **Tests Unitarios**: 19 tests de `src/tests/unit/chat/` fallan por cambios en `analyzeIntent`.
    *   *Acción*: Actualizar mocks y expectativas de tests afectados.
2.  **SPA Pública**: Ausencia de página de inicio para visitantes no autenticados.
    *   *Acción*: Implementar `src/app/(public)/page.tsx`.

### Importantes (No Bloqueantes)
1.  **Cobertura de Tests**: Nivel actual ~40%, objetivo >80%.
2.  **Visualización**: Faltan gráficos en el Dashboard del Cliente.

---

## 5. Hoja de Ruta (Roadmap) - Próximos Pasos

### Sprint 4: Productización
1.  **Fix Tests**: Prioridad absoluta a la estabilidad del CI/CD.
2.  **Frontend Público**: Landing page atractiva con "Call to Action".
3.  **Mejoras UX Portal**: Gráficos interactivos y descarga masiva.
4.  **Despliegue Staging**: Validación en entorno pre-productivo.

### Sprint 5: Lanzamiento
1.  **Auditoría de Seguridad**: Pentesting básico.
2.  **Documentación Final**: Manual de usuario y guías de API.
3.  **Go-Live**: Despliegue a Producción.

---
*Guía Estructurada generada por Trae AI*
