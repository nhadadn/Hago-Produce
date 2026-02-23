# PROMPT MAESTRO - PROYECTO HAGO PRODUCE

## PARTE 1: CONTEXTO CONSOLIDADO DEL PROYECTO

### 1.1. Visión general
- **Nombre del proyecto:** HAGO PRODUCE
- **Sector:** Venta de materias primas (frutas, verduras, frutos secos).
- **Responsables internos:** Owner + Contabilidad.
- **Contacto principal:** Said David Hadad Navarrete (diaz1919@gmail.com, 8716093076).
- **Prioridad:** Alta (4/5), pero con enfoque de equilibrio entre rapidez y completitud.

**Visión:**
Centralizar y automatizar la gestión financiera y operativa de HAGO PRODUCE (facturación, control de costos, seguimiento de clientes) en un sistema web propio, eliminando la dependencia de QuickBooks y Google Sheets, e integrando un agente digital que apoye la toma de decisiones.

### 1.2. Problema actual
- Uso de QuickBooks solo para crear facturas (flujo lento y manual).
- Uso de Google Sheets + Make.com para leer listas de precios y actualizar costos.
- El contador no crea facturas, solo revisa pagos y estados manualmente.
- Necesidad de mejor trazabilidad, menos pasos manuales, portal propio adaptado.

### 1.3. Objetivos clave
1. Reemplazar QuickBooks para la creación y gestión de facturas.
2. Integrar y luego migrar las automatizaciones de Make+Sheets a un backend robusto.
3. Portal para clientes (consultar facturas, estado de cuenta, pendientes).
4. Chat interno (consultar precios, mejores proveedores, estados de facturas).
5. SPA pública para promover HAGO PRODUCE (fase posterior).
6. Agente digital para consultas de negocio.

**Criterios de éxito medibles:**
- Dejar de usar QuickBooks antes del 01/04/2026.
- Reducir tiempo de creación de factura de ~20 min a ~3 min.
- Toda la información centralizada en un solo portal.
- Chat/Agente operativo para consultas de negocio.

### 1.4. Alcance funcional del MVP (V1)
**Imprescindible:**
- ✅ Autenticación y gestión de usuarios (roles).
- ✅ Gestión de productos (con precios por proveedor y sincronización desde automatizaciones).
- ✅ Creación y edición de facturas.
- ✅ Panel contable (lista de facturas, filtros, cambio de estado, notas internas).
- ✅ Chat interno integrado (consultas de precios y estados de facturas).
- ✅ Integración con automatizaciones existentes (Make, Google Sheets).

**Deseable pero no crítico en V1:**
- 📋 Reportes y gráficos.
- 📋 Almacenamiento histórico avanzado.
- 📋 Portal de cliente más completo y dashboards avanzados.
- 📋 Bot externo (WhatsApp/Telegram) 100% integrado.
- 📋 Descarga/impresión de PDFs mejorada.

### 1.5. Roles y usuarios
| Rol | Permisos principales |
|-----|---------------------|
| Admin / Comercial | Crea/edita facturas, gestiona productos y clientes, revisa dashboards |
| Contabilidad | Cambia estados de facturas, añade notas, genera reportes |
| Dirección / Gerencia | Consulta indicadores y reportes globales |
| Clientes externos | Consultan estado de cuenta, descargan facturas |

### 1.6. Chat y automatizaciones
- Chat interno solo para equipo interno en V1.
- Automatizaciones existentes (Make + Google Sheets) se mantienen en V1.
- En V2: bot consulta directamente la nueva API/backend.

### 1.7. Requisitos no funcionales
- ~6 usuarios internos, ~70 externos.
- ~10 facturas/día, 400-600 productos activos.
- Horario crítico: 3:00 a 18:00.
- Idiomas: Español e Inglés.
- Hosting: Cloud.
- Integración: Make.com.
- Cumplimiento: GDPR/ley local, CRA (Canadá).
- Presupuesto: Bajo / piloto (~60 CAD).

### 1.8. Herramientas y forma de trabajo
- Figma (diseño UI/UX), Kombai (Figma → frontend), Trae.AI/Cursor/Claude (arquitectura, backend, frontend).
- GitHub: CI/CD, feature branches.
- Metodología C4 aplicada a prompts/diseño.

---

## PARTE 2: CUESTIONARIO RESPONDIDO

### 2.1. Información general
- Actividad: Venta de materias primas.
- Herramientas actuales: Google Sheets, QuickBooks, WhatsApp/Telegram.
- Sistemas a reemplazar: QuickBooks, Google Sheets.

### 2.2. Objetivos y alcance
- Objetivo: Integrar tecnología a la administración y gestión operativa del negocio.
- Prioridad: 4/5.
- Fecha objetivo MVP: 02/04/2026 (flexible).

### 2.3. Requisitos y especificaciones
**Facturas:** Invoice number, nombre empresa, teléfono, correo. Estados: Enviada, Pendiente, Liquidada, Cancelada.
**Productos:** Nombre, descripción, precio, proveedor. Precio único por proveedor.
**Clientes:** TaxID, Nombre, Dirección, Teléfono.
**Chat:** Solo interno en V1. Consultas de precios y estados.
**Notificaciones:** Cambio de estado, vencimiento de facturas. Canales: WhatsApp/Telegram.

### 2.4. Requisitos no funcionales
- 6 internos, ~70 externos, ~10 facturas/día, 400-600 productos.
- Horario crítico: 3:00-18:00.
- Idiomas: ES/EN.

### 2.5. Recursos y restricciones
- Presupuesto: ~60 CAD.
- Decisiones: Arthur Naranjo, Nadir Hadad.
- Validación: Said (Owner).
- Integración: Make.com.
- Legal: GDPR, CRA.

### 2.6. Stakeholders y usuarios
- Admin, Contabilidad, Dirección, Clientes externos.
- Stakeholder con poder de veto: Said (Owner).

### 2.7. Criterios de éxito
- Dejar QuickBooks antes del 01/04/2026.
- Reducir creación de factura de ~20 min a ~3 min.
- Información centralizada.
- Agente digital operativo.
- Métricas: tiempo de factura, errores, días de cobro, uso del chat, ahorro de tiempo.