# HAGO PRODUCE

## 📋 Descripción del Proyecto

**HAGO PRODUCE** es un sistema web integral diseñado para centralizar la facturación, gestión de costos y seguimiento de clientes de una empresa dedicada a la venta de materias primas (frutas, verduras, frutos secos) en Canadá.

El objetivo principal es reemplazar el uso de **QuickBooks** y **Google Sheets** por una plataforma propia y optimizada, integrando además un agente digital inteligente para facilitar la toma de decisiones operativas.

## 🎯 Objetivos Clave

- **Independencia Tecnológica:** Dejar de utilizar QuickBooks antes del 01/04/2026.
- **Eficiencia Operativa:** Reducir el tiempo de creación de facturas de ~20 minutos a menos de 3 minutos.
- **Centralización:** Unificar toda la información del negocio en un solo portal accesible.
- **Innovación:** Implementar un agente digital (Chat) para consultas rápidas de precios, proveedores y estados de cuenta.

## 🏗️ Stack Tecnológico

- **Frontend:** Next.js 14, TailwindCSS, shadcn/ui.
- **Backend:** Next.js API Routes (Monorepo).
- **Base de Datos:** PostgreSQL (Supabase).
- **ORM:** Prisma.
- **Autenticación:** Supabase Auth (JWT + Roles).
- **IA / Agente:** OpenAI API (GPT-4o-mini).
- **Infraestructura:** Vercel (Frontend) + Supabase (DB/Auth).

## 📦 Módulos Principales (MVP)

1.  **Autenticación y Usuarios:** Gestión de roles (Admin, Contabilidad, Gerencia, Clientes).
2.  **Gestión de Catálogos:** Productos, Proveedores y Clientes.
3.  **Facturación:** Creación, edición, historial, notas y exportación a PDF.
4.  **Chat / Agente:** Asistente interno para consultas de negocio.
5.  **Portal de Clientes:** Acceso para visualizar y descargar facturas y estados de cuenta.

## 👥 Roles y Permisos

- **Admin / Comercial:** Gestión total (facturas, productos, clientes).
- **Contabilidad:** Gestión de estados de pago, notas y reportes.
- **Gerencia:** Visualización de reportes y KPIs.
- **Clientes Externos:** Acceso de lectura a sus propias facturas y estados de cuenta.

## 📁 Documentación

La documentación detallada del proyecto se encuentra en la carpeta `DocumentacionHagoProduce`:
- `00_prompt_maestro_hago_produce.md`: Contexto completo del proyecto.
- `01_architecture_c4.md`: Arquitectura técnica (C4 Model).
- `02_data_model.md`: Modelo de datos y esquema de base de datos.
- `03_api_contracts.md`: Especificaciones de API REST.
- `04_roadmap.md`: Plan de implementación y fases.
- `05_project_brief.md`: Resumen ejecutivo.

---
*Proyecto desarrollado para Hago Produce.*
