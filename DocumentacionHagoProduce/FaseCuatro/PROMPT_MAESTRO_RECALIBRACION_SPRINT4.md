# 🎯 PROMPT MAESTRO: RECALIBRACIÓN Y CONSOLIDACIÓN DEL SPRINT 4
## Proyecto Hago Produce | Enfoque: Productización y Experiencia de Usuario (UX)

> **Rol**: Senior Project Manager & Tech Lead  
> **Objetivo**: Asegurar la consolidación exitosa del Sprint 4, mitigando la deuda técnica heredada y garantizando la entrega de valor al usuario final.  
> **Contexto**: El Backend es sólido (Sprint 3), pero el Frontend (Pública/Portal) y la Calidad (Tests) requieren atención urgente.

---

### 1. INSTRUCCIONES GENERALES

Analice minuciosamente el estado actual del proyecto basándose en los documentos de cierre del Sprint 3 (`CHECKPOINT_CIERRE_SPRINT3.md`, `AUDITORIA_SPRINT3.md`, `RECALIBRACION_PROYECTO.md`). Su misión es generar un **Plan Estratégico de Ejecución para el Sprint 4** que cubra los gaps existentes y prepare el sistema para un despliegue en Staging.

### 2. REQUERIMIENTOS DEL ANÁLISIS

Debe generar un informe ejecutivo consolidado que aborde los siguientes 10 puntos críticos:

#### 1. Análisis de Estado Actual vs. Documentación
*   Comparar lo planificado en Sprint 3 vs. lo entregado.
*   Evaluar la deuda técnica acumulada (especialmente los 19 tests fallando y la cobertura del 40%).
*   Verificar la coherencia entre `schema.prisma` y los servicios implementados.

#### 2. Evaluación de Entregables del Sprint 4 (Scope Previsto)
*   **S4-P01 (Frontend Público)**: Landing Page, SEO básico, Rutas públicas.
*   **S4-P02 (Portal UX)**: Gráficos (Chart.js), Descarga Masiva (JSZip), Mejoras visuales.
*   **S4-P03 (Calidad & CI/CD)**: Fix de Tests Unitarios, E2E Completo, Configuración de Staging.

#### 3. Identificación de Gaps, Riesgos y Bloqueos
*   **Riesgo Crítico**: La refactorización de `analyzeIntent` rompió la suite de tests. ¿Cómo impacta esto al Sprint 4?
*   **Bloqueo Potencial**: Falta de diseño UI definido para la Landing Page.
*   **Gap Técnico**: Ausencia de manejo de errores global en el Frontend.

#### 4. Revisión de Recursos
*   **Tiempo**: 3 Semanas (Sprint estándar).
*   **Equipo**: Full Stack Developer (Usted), QA (Usted).
*   **Presupuesto**: N/A (Foco en herramientas Open Source).

#### 5. Criterios de Aceptación Actualizados
Para cada historia de usuario del Sprint 4, definir:
*   **Happy Path**: Flujo ideal.
*   **Edge Cases**: Manejo de errores (404, 500, Network Error).
*   **UI/UX**: Estados de carga (Skeletons), Feedback visual (Toasts).
*   **Performance**: Core Web Vitals (LCP < 2.5s, CLS < 0.1).

#### 6. Plan de Acción Priorizado (Roadmap S4)
Estructurar el sprint en semanas con entregables claros:
*   **Semana 1**: Calidad (Fix Tests) + Estructura Pública (Skeleton).
*   **Semana 2**: Funcionalidad Visual (Gráficos, Descargas) + Contenido Público.
*   **Semana 3**: Hardening, Seguridad y Despliegue a Staging.

#### 7. Mecanismo de Seguimiento Diario
Proponer un formato de "Daily Standup" asíncrono en el archivo `TODO_SPRINT4.md` para registrar:
*   Qué se hizo ayer.
*   Qué se hará hoy.
*   Bloqueos detectados.

#### 8. Lecciones Aprendidas (Aplicadas)
*   Incorporar explícitamente la lección "Backend First" del Sprint 3.
*   Aplicar "TDD Light" para las nuevas features de Frontend.

#### 9. Ajuste de Roadmap
*   ¿Es viable el lanzamiento en Sprint 5?
*   Recomendación sobre posponer features no esenciales (ej. Modo Oscuro) si comprometen la estabilidad.

#### 10. Checkpoints de Validación
Definir hitos de aprobación con el "Usuario Simulador" (Stakeholder):
*   **CP-S4-W1**: Tests pasando al 100% y Home Page visible.
*   **CP-S4-W2**: Gráficos interactivos y descarga de ZIP funcional.
*   **CP-S4-W3**: Deploy en Vercel (Preview/Staging) funcional.

---

### 3. FORMATO DE SALIDA ESPERADO

Genere un archivo Markdown llamado `PLAN_ESTRATEGICO_SPRINT4.md` en `DocumentacionHagoProduce/FaseCuatro/` con la siguiente estructura:

```markdown
# 🚀 PLAN ESTRATÉGICO SPRINT 4: PRODUCTIZACIÓN Y UX
**Estado**: Borrador / Aprobado
**Fecha**: [Fecha Actual]

## 1. Resumen Ejecutivo
[Estado actual, riesgos principales y objetivo del sprint]

## 2. Alcance del Sprint (Scope)
[Lista detallada de historias de usuario con priorización MoSCoW]

## 3. Criterios de Aceptación Técnicos
[Definiciones de Done (DoD) para Frontend, Backend y QA]

## 4. Cronograma de Ejecución (Semana a Semana)
[Tabla con Tareas, Responsables y Fechas]

## 5. Gestión de Riesgos
[Matriz de Riesgo: Impacto vs. Probabilidad + Mitigación]

## 6. Métricas de Éxito del Sprint
[Coverage > 80%, 0 Bugs Críticos, Lighthouse > 90]
```

---

### 4. INSTRUCCIÓN DE EJECUCIÓN

Una vez generado el plan, proceda inmediatamente a crear el archivo `TODO_SPRINT4.md` con las tareas desglosadas listas para marcarse, e inicie la ejecución de la **Prioridad 1 (Fix Tests Unitarios)**.
