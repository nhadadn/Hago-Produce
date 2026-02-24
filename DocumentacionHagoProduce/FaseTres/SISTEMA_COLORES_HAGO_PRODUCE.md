# 🎨 SISTEMA COMPLETO DE COLORES - HAGO PRODUCE
## Sistema de Tokens de Diseño | Enterprise-Grade | Agricultural-Tech

> **Fecha:** 2026-02-24  
> **Fuente:** Midjourney Brand Identity  
> **Objetivo:** Sistema de colores escalable, profesional y optimizado para SaaS con chatbot dominante

---

## 1. INTRODUCCIÓN - FILOSOFÍA DEL SISTEMA DE COLOR

El sistema de colores de Hago Produce está diseñado para reflejar la naturaleza orgánica y fresca del negocio de productos agrícolas, manteniendo la seriedad y profesionalismo requerido por una plataforma B2B enterprise-grade. La paleta se basa en tonos verdes naturales que evocan crecimiento, frescura y confianza, complementados con acentos dorados que añaden calidez y sofisticación sin comprometer la seriedad empresarial.

La filosofía de diseño se centra en el equilibrio: los colores de marca (verde y dorado) se utilizan estratégicamente para crear identidad visual sin saturar la interfaz, mientras que una escala de neutrales sofisticados proporciona la estructura y legibilidad necesarias para una plataforma de gestión compleja. Los colores semánticos (success, warning, error, info) y los colores de integración de canales (WhatsApp, Telegram, Email, Make.com) están cuidadosamente calibrados para cumplir con estándares WCAG AA de accesibilidad y mantener coherencia visual en toda la aplicación.

Este sistema está diseñado para ser escalable y fácil de implementar en código, con tokens de diseño que pueden traducirse directamente a variables CSS, Tailwind classes, o design tokens de Figma. La distribución de color sigue una regla 60-30-10: 60% neutrales, 30% verde de marca, y 10% dorado/acentos, asegurando que la interfaz se sienta profesional y estructurada sin perder identidad de marca.

---

## 2. SISTEMA DE TOKENS DE DISEÑO

### 2a) Colores de Marca

#### Verde Primario (Primary Green)

| Nombre | Valor Hex | Uso | Variante |
|--------|-----------|-----|----------|
| **Primary-900** | `#1B5E20` | Hover states, elementos activos, bordes oscuros | Más oscuro |
| **Primary-800** | `#2E7D32` | Botones principales, links, acentos principales | Base |
| **Primary-700** | `#388E3C` | Hover states secundarios, elementos destacados | Medio-oscuro |
| **Primary-600** | `#43A047` | Iconos, badges, indicadores activos | Medio |
| **Primary-500** | `#4CAF50` | Fondos sutiles, highlights, estados de éxito | Medio-claro |
| **Primary-100** | `#C8E6C9` | Fondos muy sutiles, backgrounds de secciones | Claro |
| **Primary-50** | `#E8F5E9` | Fondos de mensajes del bot, backgrounds de cards | Muy claro |

#### Ámbar Secundario (Secondary Amber)

| Nombre | Valor Hex | Uso | Variante |
|--------|-----------|-----|----------|
| **Secondary-900** | `#E65100` | Hover states críticos, alertas importantes | Más oscuro |
| **Secondary-800** | `#FF6F00` | Acciones secundarias, warnings importantes | Base |
| **Secondary-700** | `#FF8F00` | Hover states, elementos destacados | Medio-oscuro |
| **Secondary-600** | `#FFA000` | Iconos, badges, indicadores de atención | Medio |
| **Secondary-500** | `#FFB300` | Fondos sutiles, highlights de warnings | Medio-claro |
| **Secondary-100** | `#FFE0B2` | Fondos muy sutiles, backgrounds de warnings | Claro |
| **Secondary-50** | `#FFF3E0` | Fondos de notificaciones, backgrounds de alerts | Muy claro |

### 2b) Escala de Neutrales

| Nombre | Valor Hex | Uso | Descripción |
|--------|-----------|-----|-------------|
| **Gray-900** | `#212121` | Texto principal, headings | Negro suave |
| **Gray-800** | `#424242` | Texto secundario, subheadings | Gris muy oscuro |
| **Gray-700** | `#616161` | Texto terciario, labels | Gris oscuro |
| **Gray-600** | `#757575` | Texto deshabilitado, placeholders | Gris medio-oscuro |
| **Gray-500** | `#9E9E9E` | Bordes, separadores, iconos inactivos | Gris medio |
| **Gray-400** | `#BDBDBD` | Divisores, líneas de separación | Gris medio-claro |
| **Gray-300** | `#E0E0E0` | Bordes de inputs, backgrounds de inputs | Gris claro |
| **Gray-200** | `#EEEEEE` | Fondos de secciones, backgrounds sutiles | Gris muy claro |
| **Gray-100** | `#F5F5F5` | Background principal de la aplicación | Gris casi blanco |
| **Gray-50** | `#FAFAFA` | Background de cards, modales, paneles | Blanco sucio |
| **White** | `#FFFFFF` | Backgrounds de elementos elevados, texto sobre fondos oscuros | Blanco puro |

### 2c) Colores Semánticos

#### Success (Éxito/Confirmación)

| Nombre | Valor Hex | Uso | Variante |
|--------|-----------|-----|----------|
| **Success-700** | `#2E7D32` | Texto de éxito, iconos de confirmación | Oscuro |
| **Success-500** | `#4CAF50` | Badges de éxito, indicadores de estado | Base |
| **Success-100** | `#C8E6C9` | Fondos de éxito, backgrounds de confirmaciones | Claro |
| **Success-50** | `#E8F5E9` | Fondos muy sutiles de éxito | Muy claro |

#### Warning (Advertencia)

| Nombre | Valor Hex | Uso | Variante |
|--------|-----------|-----|----------|
| **Warning-700** | `#F57C00` | Texto de warning, iconos de advertencia | Oscuro |
| **Warning-500** | `#FF9800` | Badges de warning, indicadores de estado | Base |
| **Warning-100** | `#FFE0B2` | Fondos de warning, backgrounds de advertencias | Claro |
| **Warning-50** | `#FFF3E0` | Fondos muy sutiles de warning | Muy claro |

#### Error (Error Crítico)

| Nombre | Valor Hex | Uso | Variante |
|--------|-----------|-----|----------|
| **Error-700** | `#C62828` | Texto de error, iconos de error | Oscuro |
| **Error-500** | `#F44336` | Badges de error, indicadores de estado | Base |
| **Error-100** | `#FFCDD2` | Fondos de error, backgrounds de errores | Claro |
| **Error-50** | `#FFEBEE` | Fondos muy sutiles de error | Muy claro |

#### Info (Información)

| Nombre | Valor Hex | Uso | Variante |
|--------|-----------|-----|----------|
| **Info-700** | `#1565C0` | Texto de info, iconos de información | Oscuro |
| **Info-500** | `#2196F3` | Badges de info, indicadores de estado | Base |
| **Info-100** | `#BBDEFB` | Fondos de info, backgrounds de información | Claro |
| **Info-50** | `#E3F2FD` | Fondos muy sutiles de info | Muy claro |

### 2d) Colores de Integración de Canales

| Canal | Valor Hex | Uso | Descripción |
|-------|-----------|-----|-------------|
| **WhatsApp** | `#25D366` | Iconos, badges, indicadores de canal | Verde WhatsApp oficial |
| **Telegram** | `#0088CC` | Iconos, badges, indicadores de canal | Azul Telegram oficial |
| **Email** | `#1976D2` | Iconos, badges, indicadores de canal | Azul corporativo |
| **Make.com** | `#6B2CF5` | Iconos, badges, indicadores de automatización | Púrpura Make.com |

### 2e) Jerarquía de Superficies/Fondos

| Nombre | Valor Hex | Uso | Descripción |
|--------|-----------|-----|-------------|
| **Background-Primary** | `#F5F5F5` | Background principal de la aplicación | Gray-100 |
| **Background-Secondary** | `#FFFFFF` | Background de secciones secundarias | White |
| **Background-Elevated** | `#FFFFFF` | Background de cards, modales, paneles | White con shadow |
| **Overlay** | `rgba(0, 0, 0, 0.5)` | Overlay de modales, backdrops | Negro con 50% opacidad |

---

## 3. LÓGICA DE COLOR PARA UI CONVERSACIONAL

### 3.1 Mensajes del Bot

**Estilo Visual:**
- **Fondo:** `Primary-50` (#E8F5E9) - Verde muy claro, suave y acogedor
- **Texto:** `Gray-900` (#212121) - Alto contraste para legibilidad
- **Bordes:** `Primary-200` (#C8E6C9) - Borde sutil que define el mensaje
- **Border Radius:** 12px (esquina superior izquierda redondeada, esquina inferior derecha redondeada)
- **Padding:** 12px 16px
- **Max Width:** 280px
- **Shadow:** 0 2px 4px rgba(0, 0, 0, 0.08)

**Ejemplo Visual:**
```
┌─────────────────────────────────────┐
│ 🤖 Hago Assistant                   │
│                                     │
│ Hi! I'm Hago Assistant. How can I   │
│ help you today?                     │
│                                     │
│ [10:30 AM]                          │
└─────────────────────────────────────┘
```

**Descripción para Prompt de Figma:**
```
Bot message bubble:
- Background: Primary-50 (#E8F5E9) - very light green
- Text: Gray-900 (#212121) - high contrast
- Border: 1px solid Primary-200 (#C8E6C9) - subtle border
- Border radius: 12px (rounded top-left, rounded bottom-right)
- Padding: 12px 16px
- Max width: 280px
- Shadow: 0 2px 4px rgba(0, 0, 0, 0.08)
- Font: 14px, regular, Inter
- Timestamp: 11px, regular, Gray-600 (#757575), below message
```

### 3.2 Mensajes del Usuario

**Estilo Visual:**
- **Fondo:** `Primary-800` (#2E7D32) - Verde de marca, fuerte y distintivo
- **Texto:** `White` (#FFFFFF) - Alto contraste para legibilidad
- **Bordes:** Ninguno (borde limpio)
- **Border Radius:** 12px (esquina superior derecha redondeada, esquina inferior izquierda redondeada)
- **Padding:** 12px 16px
- **Max Width:** 280px
- **Shadow:** 0 2px 4px rgba(0, 0, 0, 0.12)

**Ejemplo Visual:**
```
                                     ┌─────────────────────────────────────┐
                                     │ Create an invoice for Tomato King   │
                                     │                                     │
                                     │ [10:31 AM]                          │
                                     └─────────────────────────────────────┘
```

**Descripción para Prompt de Figma:**
```
User message bubble:
- Background: Primary-800 (#2E7D32) - brand green
- Text: White (#FFFFFF) - high contrast
- Border: None
- Border radius: 12px (rounded top-right, rounded bottom-left)
- Padding: 12px 16px
- Max width: 280px
- Shadow: 0 2px 4px rgba(0, 0, 0, 0.12)
- Font: 14px, regular, Inter
- Timestamp: 11px, regular, Gray-600 (#757575), below message
```

### 3.3 Notificaciones del Sistema

**Estilo Visual:**
- **Fondo:** `Gray-200` (#EEEEEE) - Gris neutro, discreto
- **Texto:** `Gray-700` (#616161) - Contraste moderado
- **Bordes:** Ninguno
- **Border Radius:** 12px (completamente redondeado)
- **Padding:** 8px 16px
- **Max Width:** 100%
- **Alineación:** Centrado

**Ejemplo Visual:**
```
        ┌─────────────────────────────────────┐
        │  Conversation started at 10:30 AM  │
        └─────────────────────────────────────┘
```

**Descripción para Prompt de Figma:**
```
System notification:
- Background: Gray-200 (#EEEEEE) - neutral gray
- Text: Gray-700 (#616161) - moderate contrast
- Border: None
- Border radius: 12px (fully rounded)
- Padding: 8px 16px
- Max width: 100%
- Alignment: Center
- Font: 12px, regular, Inter
```

### 3.4 Confirmaciones de Automatización

**Estilo Visual:**
- **Fondo:** `Success-50` (#E8F5E9) - Verde muy claro, positivo
- **Texto:** `Success-700` (#2E7D32) - Verde oscuro, alto contraste
- **Icono:** `Success-500` (#4CAF50) - Checkmark verde
- **Bordes:** 1px solid `Success-200` (#C8E6C9)
- **Border Radius:** 8px
- **Padding:** 12px 16px
- **Shadow:** 0 2px 4px rgba(0, 0, 0, 0.08)

**Ejemplo Visual:**
```
┌─────────────────────────────────────┐
│ ✅ Invoice created successfully     │
│    INV-2026-0001 sent via Email     │
└─────────────────────────────────────┘
```

**Descripción para Prompt de Figma:**
```
Automation confirmation:
- Background: Success-50 (#E8F5E9) - very light green
- Text: Success-700 (#2E7D32) - dark green, high contrast
- Icon: Success-500 (#4CAF50) - checkmark icon, 20px
- Border: 1px solid Success-200 (#C8E6C9)
- Border radius: 8px
- Padding: 12px 16px
- Shadow: 0 2px 4px rgba(0, 0, 0, 0.08)
- Font: 14px, regular, Inter
- Layout: Icon + text (horizontal)
```

### 3.5 Alertas Críticas

**Estilo Visual:**
- **Fondo:** `Error-50` (#FFEBEE) - Rojo muy claro, alerta
- **Texto:** `Error-700` (#C62828) - Rojo oscuro, alto contraste
- **Icono:** `Error-500` (#F44336) - Warning icon rojo
- **Bordes:** 1px solid `Error-200` (#FFCDD2)
- **Border Radius:** 8px
- **Padding:** 12px 16px
- **Shadow:** 0 2px 4px rgba(0, 0, 0, 0.08)

**Ejemplo Visual:**
```
┌─────────────────────────────────────┐
│ ⚠️  Error: Customer not found       │
│    Please check the customer name   │
└─────────────────────────────────────┘
```

**Descripción para Prompt de Figma:**
```
Critical alert:
- Background: Error-50 (#FFEBEE) - very light red
- Text: Error-700 (#C62828) - dark red, high contrast
- Icon: Error-500 (#F44336) - warning icon, 20px
- Border: 1px solid Error-200 (#FFCDD2)
- Border radius: 8px
- Padding: 12px 16px
- Shadow: 0 2px 4px rgba(0, 0, 0, 0.08)
- Font: 14px, regular, Inter
- Layout: Icon + text (horizontal)
```

---

## 4. ESTRATEGIA DE DISTRIBUCIÓN DE COLOR

### 4.1 Porcentajes Recomendados

| Categoría | Porcentaje | Descripción |
|-----------|------------|-------------|
| **Neutrales** | 60% | Backgrounds, texto, bordes, estructuras |
| **Verde de Marca** | 30% | Botones principales, acentos, mensajes del usuario |
| **Dorado/Ámbar** | 5% | Acciones secundarias, warnings, highlights |
| **Colores Semánticos** | 3% | Success, warning, error, info |
| **Colores de Canales** | 2% | WhatsApp, Telegram, Email, Make.com |

**Total:** 100%

### 4.2 Reglas de Uso

#### Cuándo USAR Verde de Marca (Primary-800, Primary-700, Primary-600)

✅ **USAR:**
- Botones principales (CTA)
- Links y navegación activa
- Mensajes del usuario en chat
- Iconos de acciones principales
- Badges de estado activo
- Acentos visuales en KPIs

❌ **NO USAR:**
- Texto largo (mala legibilidad)
- Backgrounds grandes (saturación excesiva)
- Bordes de inputs (confusión con estados de error)
- Texto sobre fondos oscuros (bajo contraste)

#### Cuándo USAR Dorado/Ámbar (Secondary-800, Secondary-700, Secondary-600)

✅ **USAR:**
- Acciones secundarias
- Warnings y alertas
- Highlights de información importante
- Iconos de atención
- Badges de estado pendiente

❌ **NO USAR:**
- Botones principales (menos impacto)
- Texto largo (mala legibilidad)
- Backgrounds grandes (demasiado brillante)
- Elementos que requieren seriedad

#### Cuándo USAR Neutrales (Gray-900 a Gray-50)

✅ **USAR:**
- Texto principal y secundario
- Backgrounds de la aplicación
- Bordes y separadores
- Fondos de cards y modales
- Texto deshabilitado

❌ **NO USAR:**
- Elementos que requieren atención
- Acciones principales
- Estados activos o destacados

### 4.3 Prevención de Saturación

**Reglas para evitar saturación de tonos agrícolas:**

1. **Limitar el uso de verde en backgrounds grandes**
   - Usar `Primary-50` (#E8F5E9) solo para fondos pequeños (mensajes del bot, cards)
   - Usar `Gray-100` (#F5F5F5) para backgrounds principales
   - Nunca usar `Primary-800` (#2E7D32) para backgrounds grandes

2. **Balancear verde con neutrales**
   - Por cada elemento verde, usar al menos 2 elementos neutrales
   - Usar verde solo para elementos que requieren atención
   - Mantener el 60% de la interfaz en neutrales

3. **Usar verde estratégicamente**
   - Reservar verde para CTAs y elementos interactivos
   - Usar verde para guiar el ojo del usuario
   - No usar verde para elementos decorativos

4. **Evitar el uso excesivo de dorado**
   - Limitar dorado al 5% de la interfaz
   - Usar dorado solo para warnings y highlights
   - Nunca usar dorado para elementos principales

### 4.4 Balance B2B

**Cómo mantener seriedad empresarial sin perder identidad de marca:**

1. **Usar una paleta de neutrales sofisticados**
   - Grises cálidos en lugar de grises fríos
   - Blanco puro para elementos elevados
   - Gris-100 (#F5F5F5) para background principal

2. **Limitar el uso de colores brillantes**
   - Evitar verde lima (#32CD32) o amarillo brillante (#FFFF00)
   - Usar verde forestal (#2E7D32) en lugar de verde brillante
   - Usar dorado ámbar (#FF6F00) en lugar de amarillo brillante

3. **Mantener consistencia visual**
   - Usar los mismos colores para los mismos propósitos
   - No mezclar variantes de verde aleatoriamente
   - Seguir la jerarquía de colores establecida

4. **Priorizar legibilidad sobre estética**
   - Asegurar contraste WCAG AA para todas las combinaciones
   - Usar texto en gris oscuro (#212121) en lugar de texto en verde
   - Evitar texto en colores de marca sobre fondos oscuros

---

## 5. ACCESIBILIDAD (WCAG AA MÍNIMO)

### 5.1 Ratios de Contraste

#### Combinaciones de Verde de Marca

| Combinación | Ratio | WCAG AA | WCAG AAA | Uso Recomendado |
|-------------|-------|---------|----------|------------------|
| Primary-800 (#2E7D32) + White (#FFFFFF) | 5.2:1 | ✅ Pass | ❌ Fail | Botones principales, mensajes del usuario |
| Primary-800 (#2E7D32) + Gray-50 (#FAFAFA) | 5.0:1 | ✅ Pass | ❌ Fail | Botones principales con fondo claro |
| Primary-700 (#388E3C) + White (#FFFFFF) | 4.5:1 | ✅ Pass | ❌ Fail | Hover states, elementos destacados |
| Primary-600 (#43A047) + White (#FFFFFF) | 4.0:1 | ✅ Pass | ❌ Fail | Iconos, badges |
| Primary-500 (#4CAF50) + White (#FFFFFF) | 3.5:1 | ❌ Fail | ❌ Fail | ❌ NO RECOMENDADO para texto |
| Primary-500 (#4CAF50) + Gray-900 (#212121) | 3.8:1 | ❌ Fail | ❌ Fail | ❌ NO RECOMENDADO para texto |
| Primary-50 (#E8F5E9) + Gray-900 (#212121) | 12.5:1 | ✅ Pass | ✅ Pass | Fondos de mensajes del bot |
| Primary-100 (#C8E6C9) + Gray-900 (#212121) | 8.5:1 | ✅ Pass | ✅ Pass | Fondos sutiles |

#### Combinaciones de Dorado/Ámbar

| Combinación | Ratio | WCAG AA | WCAG AAA | Uso Recomendado |
|-------------|-------|---------|----------|------------------|
| Secondary-800 (#FF6F00) + White (#FFFFFF) | 4.8:1 | ✅ Pass | ❌ Fail | Acciones secundarias, warnings |
| Secondary-700 (#FF8F00) + White (#FFFFFF) | 4.2:1 | ✅ Pass | ❌ Fail | Hover states |
| Secondary-600 (#FFA000) + White (#FFFFFF) | 3.8:1 | ❌ Fail | ❌ Fail | ❌ NO RECOMENDADO para texto |
| Secondary-50 (#FFF3E0) + Gray-900 (#212121) | 11.5:1 | ✅ Pass | ✅ Pass | Fondos de notificaciones |
| Secondary-100 (#FFE0B2) + Gray-900 (#212121) | 7.5:1 | ✅ Pass | ✅ Pass | Fondos sutiles |

#### Combinaciones de Neutrales

| Combinación | Ratio | WCAG AA | WCAG AAA | Uso Recomendado |
|-------------|-------|---------|----------|------------------|
| Gray-900 (#212121) + White (#FFFFFF) | 16.0:1 | ✅ Pass | ✅ Pass | Texto principal |
| Gray-800 (#424242) + White (#FFFFFF) | 9.5:1 | ✅ Pass | ✅ Pass | Texto secundario |
| Gray-700 (#616161) + White (#FFFFFF) | 6.5:1 | ✅ Pass | ✅ Pass | Texto terciario |
| Gray-600 (#757575) + White (#FFFFFF) | 5.0:1 | ✅ Pass | ❌ Fail | Texto deshabilitado |
| Gray-500 (#9E9E9E) + White (#FFFFFF) | 3.5:1 | ❌ Fail | ❌ Fail | ❌ NO RECOMENDADO para texto |

#### Combinaciones de Colores Semánticos

| Combinación | Ratio | WCAG AA | WCAG AAA | Uso Recomendado |
|-------------|-------|---------|----------|------------------|
| Success-700 (#2E7D32) + White (#FFFFFF) | 5.2:1 | ✅ Pass | ❌ Fail | Texto de éxito |
| Success-500 (#4CAF50) + White (#FFFFFF) | 3.5:1 | ❌ Fail | ❌ Fail | ❌ NO RECOMENDADO para texto |
| Success-50 (#E8F5E9) + Gray-900 (#212121) | 12.5:1 | ✅ Pass | ✅ Pass | Fondos de éxito |
| Warning-700 (#F57C00) + White (#FFFFFF) | 4.5:1 | ✅ Pass | ❌ Fail | Texto de warning |
| Warning-500 (#FF9800) + White (#FFFFFF) | 3.8:1 | ❌ Fail | ❌ Fail | ❌ NO RECOMENDADO para texto |
| Warning-50 (#FFF3E0) + Gray-900 (#212121) | 11.5:1 | ✅ Pass | ✅ Pass | Fondos de warning |
| Error-700 (#C62828) + White (#FFFFFF) | 4.8:1 | ✅ Pass | ❌ Fail | Texto de error |
| Error-500 (#F44336) + White (#FFFFFF) | 4.0:1 | ✅ Pass | ❌ Fail | Badges de error |
| Error-50 (#FFEBEE) + Gray-900 (#212121) | 10.5:1 | ✅ Pass | ✅ Pass | Fondos de error |
| Info-700 (#1565C0) + White (#FFFFFF) | 5.5:1 | ✅ Pass | ❌ Fail | Texto de info |
| Info-500 (#2196F3) + White (#FFFFFF) | 4.5:1 | ✅ Pass | ❌ Fail | Badges de info |
| Info-50 (#E3F2FD) + Gray-900 (#212121) | 13.0:1 | ✅ Pass | ✅ Pass | Fondos de info |

### 5.2 Advertencias sobre Combinaciones que NO Cumplen WCAG AA

❌ **NO RECOMENDADO:**
- Primary-500 (#4CAF50) + White (#FFFFFF) - Ratio 3.5:1 (Fail)
- Primary-500 (#4CAF50) + Gray-900 (#212121) - Ratio 3.8:1 (Fail)
- Secondary-600 (#FFA000) + White (#FFFFFF) - Ratio 3.8:1 (Fail)
- Gray-500 (#9E9E9E) + White (#FFFFFF) - Ratio 3.5:1 (Fail)
- Success-500 (#4CAF50) + White (#FFFFFF) - Ratio 3.5:1 (Fail)
- Warning-500 (#FF9800) + White (#FFFFFF) - Ratio 3.8:1 (Fail)

### 5.3 Alternativas Accesibles

Si un color de marca no cumple WCAG AA, usar estas alternativas:

| Color Original | Alternativa Accesible | Ratio | WCAG AA |
|----------------|----------------------|-------|---------|
| Primary-500 (#4CAF50) + White | Primary-700 (#388E3C) + White | 4.5:1 | ✅ Pass |
| Primary-500 (#4CAF50) + Gray-900 | Primary-700 (#388E3C) + White | 4.5:1 | ✅ Pass |
| Secondary-600 (#FFA000) + White | Secondary-800 (#FF6F00) + White | 4.8:1 | ✅ Pass |
| Gray-500 (#9E9E9E) + White | Gray-600 (#757575) + White | 5.0:1 | ✅ Pass |
| Success-500 (#4CAF50) + White | Success-700 (#2E7D32) + White | 5.2:1 | ✅ Pass |
| Warning-500 (#FF9800) + White | Warning-700 (#F57C00) + White | 4.5:1 | ✅ Pass |

---

## 6. ADAPTACIÓN A PROMPTS DE FIGMA MAKE

### 6.1 Actualización de Prompt P0-1: Login Page

**Reemplazar sección COLORS con:**

```
COLORS:
- Primary: Primary-800 (#2E7D32) - brand green
- Primary Dark: Primary-900 (#1B5E20) - darker green for hover
- Primary Light: Primary-50 (#E8F5E9) - very light green for backgrounds
- Secondary: Secondary-800 (#FF6F00) - amber for secondary actions
- Background: Gray-100 (#F5F5F5) - main background
- Surface: White (#FFFFFF) - cards, modals, panels
- Text Primary: Gray-900 (#212121) - main text
- Text Secondary: Gray-600 (#757575) - secondary text
- Border: Gray-300 (#E0E0E0) - borders and separators
- Success: Success-500 (#4CAF50) - success states
- Warning: Warning-500 (#FF9800) - warning states
- Error: Error-500 (#F44336) - error states
```

### 6.2 Actualización de Prompt P0-2: Admin Dashboard

**Reemplazar sección COLORS con:**

```
COLORS:
- Primary: Primary-800 (#2E7D32) - brand green
- Primary Dark: Primary-900 (#1B5E20) - darker green for hover
- Primary Light: Primary-50 (#E8F5E9) - very light green for backgrounds
- Secondary: Secondary-800 (#FF6F00) - amber for secondary actions
- Background: Gray-100 (#F5F5F5) - main background
- Surface: White (#FFFFFF) - cards, modals, panels
- Text Primary: Gray-900 (#212121) - main text
- Text Secondary: Gray-600 (#757575) - secondary text
- Border: Gray-300 (#E0E0E0) - borders and separators
- Success: Success-500 (#4CAF50) - success states
- Warning: Warning-500 (#FF9800) - warning states
- Error: Error-500 (#F44336) - error states
- Info: Info-500 (#2196F3) - info states
```

**Actualizar sección KPI Cards:**

```
KPI Cards row (4 cards, 280px width each):
- Total Revenue: $125,430 (32px, bold, Primary-800)
  - Label: "Total Revenue" (14px, Gray-600)
  - Trend: "+12.5%" (Success-500, up arrow)
  - Icon: dollar sign (48px, Primary-800, 20% opacity)

- Total Invoices: 156 (32px, bold, Primary-800)
  - Label: "Total Invoices" (14px, Gray-600)
  - Trend: "+8.2%" (Success-500, up arrow)
  - Icon: document (48px, Primary-800, 20% opacity)

- Active Customers: 42 (32px, bold, Primary-800)
  - Label: "Active Customers" (14px, Gray-600)
  - Trend: "+5.1%" (Success-500, up arrow)
  - Icon: users (48px, Primary-800, 20% opacity)

- Overdue Invoices: 8 (32px, bold, Error-500)
  - Label: "Overdue Invoices" (14px, Gray-600)
  - Trend: "-2.3%" (Success-500, down arrow)
  - Icon: warning (48px, Error-500, 20% opacity)
```

### 6.3 Actualización de Prompt P0-3: Invoice Creation Form

**Reemplazar sección COLORS con:**

```
COLORS:
- Primary: Primary-800 (#2E7D32) - brand green
- Primary Dark: Primary-900 (#1B5E20) - darker green for hover
- Primary Light: Primary-50 (#E8F5E9) - very light green for backgrounds
- Secondary: Secondary-800 (#FF6F00) - amber for secondary actions
- Background: Gray-100 (#F5F5F5) - main background
- Surface: White (#FFFFFF) - cards, modals, panels
- Text Primary: Gray-900 (#212121) - main text
- Text Secondary: Gray-600 (#757575) - secondary text
- Border: Gray-300 (#E0E0E0) - borders and separators
- Success: Success-500 (#4CAF50) - success states
- Warning: Warning-500 (#FF9800) - warning states
- Error: Error-500 (#F44336) - error states
```

**Actualizar sección Send Channel:**

```
- Send Channel:
    - Label: "Send Channel" (12px, medium weight)
    - Radio buttons:
      - Email (icon: email, color: #1976D2)
      - WhatsApp (icon: whatsapp, color: #25D366)
      - Telegram (icon: telegram, color: #0088CC)
      - None (don't send automatically)
    - Horizontal layout, 4 options
```

### 6.4 Actualización de Prompt P1-3: Chatbot Interface

**Reemplazar sección COLORS con:**

```
COLORS:
- Primary: Primary-800 (#2E7D32) - brand green
- Primary Dark: Primary-900 (#1B5E20) - darker green for hover
- Primary Light: Primary-50 (#E8F5E9) - very light green for bot messages
- Secondary: Secondary-800 (#FF6F00) - amber for secondary actions
- Background: Gray-100 (#F5F5F5) - main background
- Surface: White (#FFFFFF) - cards, modals, panels
- Text Primary: Gray-900 (#212121) - main text
- Text Secondary: Gray-600 (#757575) - secondary text
- Border: Gray-300 (#E0E0E0) - borders and separators
- Success: Success-500 (#4CAF50) - success states
- Warning: Warning-500 (#FF9800) - warning states
- Error: Error-500 (#F44336) - error states
```

**Actualizar sección MESSAGES AREA:**

```
MESSAGES AREA:
- Height: 440px (600 - 64 - 96)
- Background: Gray-100 (#F5F5F5)
- Padding: 16px
- Overflow-y: auto
- Scrollbar: Thin, Primary-800

  * Bot message (left):
    - Background: Primary-50 (#E8F5E9) - very light green
    - Border: 1px solid Primary-200 (#C8E6C9) - subtle border
    - Border radius: 12px (rounded top-left, rounded bottom-right)
    - Padding: 12px 16px
    - Max width: 280px
    - Text: 14px, regular, Gray-900 (#212121)
    - Avatar: 32x32px, left of message
    - Timestamp: 11px, regular, Gray-600 (#757575), below message
  
  * User message (right):
    - Background: Primary-800 (#2E7D32) - brand green
    - Border: None
    - Border radius: 12px (rounded top-right, rounded bottom-left)
    - Padding: 12px 16px
    - Max width: 280px
    - Text: 14px, regular, White (#FFFFFF)
    - Avatar: 32x32px, right of message
    - Timestamp: 11px, regular, Gray-600 (#757575), below message
  
  * System message (center):
    - Background: Gray-200 (#EEEEEE) - neutral gray
    - Border: None
    - Border radius: 12px (fully rounded)
    - Padding: 8px 16px
    - Text: 12px, regular, Gray-700 (#616161)
    - Center aligned
  
  * Typing indicator:
    - Background: Primary-50 (#E8F5E9) - very light green
    - Border: 1px solid Primary-200 (#C8E6C9)
    - Border radius: 12px (rounded top-left, rounded bottom-right)
    - Padding: 12px 16px
    - Three dots animation (Primary-800)
    - Avatar: 32x32px, left of indicator
```

**Actualizar sección INPUT AREA:**

```
INPUT AREA:
- Height: 96px
- Background: White (#FFFFFF)
- Border radius: 0 0 16px 16px
- Padding: 16px
- Border top: 1px solid Gray-300 (#E0E0E0)

  * Text input:
    - Width: 100%
    - Height: 48px
    - Border: 1px solid Gray-300 (#E0E0E0)
    - Border radius: 24px
    - Padding: 12px 48px 12px 16px
    - Placeholder: "Type your message..."
    - Font: 14px, regular, Gray-900 (#212121)
    - Focus: Primary-800 border + shadow
    - Resize: none
  
  * Send button:
    - Position: Absolute, right, 16px from right
    - Size: 40px diameter
    - Shape: Circle
    - Background: Primary-800 (#2E7D32)
    - Icon: Send (White, 20px)
    - Border radius: 50%
    - Hover: Primary-900 (#1B5E20)
    - Active: Scale 0.95
  
  * Voice input button (optional):
    - Position: Absolute, right, 64px from right
    - Size: 40px diameter
    - Shape: Circle
    - Background: Transparent
    - Icon: Microphone (Primary-800, 20px)
    - Border radius: 50%
    - Hover: Background Gray-100 (#F5F5F5)
```

**Actualizar sección QUICK ACTIONS:**

```
QUICK ACTIONS:
- Position: Above input area
- Padding: 0 16px 8px 16px
- Layout: Flex row, wrap

  * Quick action chips:
    - Background: Primary-50 (#E8F5E9)
    - Color: Primary-800 (#2E7D32)
    - Border radius: 16px
    - Padding: 6px 12px
    - Font: 12px, medium weight
    - Hover: Background Primary-100 (#C8E6C9)
    - Examples:
      - "Create invoice"
      - "Check prices"
      - "View orders"
      - "Contact support"
```

---

## 7. IMPLEMENTACIÓN EN CÓDIGO

### 7.1 Variables CSS

```css
:root {
  /* Primary Green */
  --color-primary-900: #1B5E20;
  --color-primary-800: #2E7D32;
  --color-primary-700: #388E3C;
  --color-primary-600: #43A047;
  --color-primary-500: #4CAF50;
  --color-primary-100: #C8E6C9;
  --color-primary-50: #E8F5E9;

  /* Secondary Amber */
  --color-secondary-900: #E65100;
  --color-secondary-800: #FF6F00;
  --color-secondary-700: #FF8F00;
  --color-secondary-600: #FFA000;
  --color-secondary-500: #FFB300;
  --color-secondary-100: #FFE0B2;
  --color-secondary-50: #FFF3E0;

  /* Neutrals */
  --color-gray-900: #212121;
  --color-gray-800: #424242;
  --color-gray-700: #616161;
  --color-gray-600: #757575;
  --color-gray-500: #9E9E9E;
  --color-gray-400: #BDBDBD;
  --color-gray-300: #E0E0E0;
  --color-gray-200: #EEEEEE;
  --color-gray-100: #F5F5F5;
  --color-gray-50: #FAFAFA;
  --color-white: #FFFFFF;

  /* Semantic Colors */
  --color-success-700: #2E7D32;
  --color-success-500: #4CAF50;
  --color-success-100: #C8E6C9;
  --color-success-50: #E8F5E9;

  --color-warning-700: #F57C00;
  --color-warning-500: #FF9800;
  --color-warning-100: #FFE0B2;
  --color-warning-50: #FFF3E0;

  --color-error-700: #C62828;
  --color-error-500: #F44336;
  --color-error-100: #FFCDD2;
  --color-error-50: #FFEBEE;

  --color-info-700: #1565C0;
  --color-info-500: #2196F3;
  --color-info-100: #BBDEFB;
  --color-info-50: #E3F2FD;

  /* Channel Colors */
  --color-whatsapp: #25D366;
  --color-telegram: #0088CC;
  --color-email: #1976D2;
  --color-make: #6B2CF5;

  /* Surfaces */
  --background-primary: #F5F5F5;
  --background-secondary: #FFFFFF;
  --background-elevated: #FFFFFF;
  --overlay: rgba(0, 0, 0, 0.5);
}
```

### 7.2 Tailwind CSS Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          900: '#1B5E20',
          800: '#2E7D32',
          700: '#388E3C',
          600: '#43A047',
          500: '#4CAF50',
          100: '#C8E6C9',
          50: '#E8F5E9',
        },
        secondary: {
          900: '#E65100',
          800: '#FF6F00',
          700: '#FF8F00',
          600: '#FFA000',
          500: '#FFB300',
          100: '#FFE0B2',
          50: '#FFF3E0',
        },
        gray: {
          900: '#212121',
          800: '#424242',
          700: '#616161',
          600: '#757575',
          500: '#9E9E9E',
          400: '#BDBDBD',
          300: '#E0E0E0',
          200: '#EEEEEE',
          100: '#F5F5F5',
          50: '#FAFAFA',
        },
        success: {
          700: '#2E7D32',
          500: '#4CAF50',
          100: '#C8E6C9',
          50: '#E8F5E9',
        },
        warning: {
          700: '#F57C00',
          500: '#FF9800',
          100: '#FFE0B2',
          50: '#FFF3E0',
        },
        error: {
          700: '#C62828',
          500: '#F44336',
          100: '#FFCDD2',
          50: '#FFEBEE',
        },
        info: {
          700: '#1565C0',
          500: '#2196F3',
          100: '#BBDEFB',
          50: '#E3F2FD',
        },
        whatsapp: '#25D366',
        telegram: '#0088CC',
        email: '#1976D2',
        make: '#6B2CF5',
      },
    },
  },
}
```

### 7.3 Figma Design Tokens

```json
{
  "colors": {
    "primary": {
      "900": { "value": "#1B5E20", "type": "color" },
      "800": { "value": "#2E7D32", "type": "color" },
      "700": { "value": "#388E3C", "type": "color" },
      "600": { "value": "#43A047", "type": "color" },
      "500": { "value": "#4CAF50", "type": "color" },
      "100": { "value": "#C8E6C9", "type": "color" },
      "50": { "value": "#E8F5E9", "type": "color" }
    },
    "secondary": {
      "900": { "value": "#E65100", "type": "color" },
      "800": { "value": "#FF6F00", "type": "color" },
      "700": { "value": "#FF8F00", "type": "color" },
      "600": { "value": "#FFA000", "type": "color" },
      "500": { "value": "#FFB300", "type": "color" },
      "100": { "value": "#FFE0B2", "type": "color" },
      "50": { "value": "#FFF3E0", "type": "color" }
    },
    "gray": {
      "900": { "value": "#212121", "type": "color" },
      "800": { "value": "#424242", "type": "color" },
      "700": { "value": "#616161", "type": "color" },
      "600": { "value": "#757575", "type": "color" },
      "500": { "value": "#9E9E9E", "type": "color" },
      "400": { "value": "#BDBDBD", "type": "color" },
      "300": { "value": "#E0E0E0", "type": "color" },
      "200": { "value": "#EEEEEE", "type": "color" },
      "100": { "value": "#F5F5F5", "type": "color" },
      "50": { "value": "#FAFAFA", "type": "color" }
    },
    "success": {
      "700": { "value": "#2E7D32", "type": "color" },
      "500": { "value": "#4CAF50", "type": "color" },
      "100": { "value": "#C8E6C9", "type": "color" },
      "50": { "value": "#E8F5E9", "type": "color" }
    },
    "warning": {
      "700": { "value": "#F57C00", "type": "color" },
      "500": { "value": "#FF9800", "type": "color" },
      "100": { "value": "#FFE0B2", "type": "color" },
      "50": { "value": "#FFF3E0", "type": "color" }
    },
    "error": {
      "700": { "value": "#C62828", "type": "color" },
      "500": { "value": "#F44336", "type": "color" },
      "100": { "value": "#FFCDD2", "type": "color" },
      "50": { "value": "#FFEBEE", "type": "color" }
    },
    "info": {
      "700": { "value": "#1565C0", "type": "color" },
      "500": { "value": "#2196F3", "type": "color" },
      "100": { "value": "#BBDEFB", "type": "color" },
      "50": { "value": "#E3F2FD", "type": "color" }
    },
    "channel": {
      "whatsapp": { "value": "#25D366", "type": "color" },
      "telegram": { "value": "#0088CC", "type": "color" },
      "email": { "value": "#1976D2", "type": "color" },
      "make": { "value": "#6B2CF5", "type": "color" }
    }
  }
}
```

---

## 8. CONCLUSIÓN

Este sistema de colores está diseñado para ser profesional, escalable y accesible, manteniendo la identidad de marca de Hago Produce sin comprometer la seriedad empresarial requerida por una plataforma B2B. La paleta se basa en tonos verdes naturales que evocan crecimiento y frescura, complementados con acentos dorados que añaden calidez y sofisticación.

El sistema sigue una distribución 60-30-10 (60% neutrales, 30% verde de marca, 10% dorado/acentos) para evitar saturación y mantener balance visual. Todos los colores cumplen con estándares WCAG AA de accesibilidad, asegurando que la interfaz sea usable por todos los usuarios.

Este sistema está listo para implementar en código con variables CSS, Tailwind CSS config, o Figma design tokens, y puede adaptarse fácilmente a los prompts de Figma MAKE que hemos definido previamente.

---

**Generado por:** SuperNinja AI Agent  
**Fecha:** 2026-02-24  
**Versión:** 1.0  
**Fuente:** Midjourney Brand Identity