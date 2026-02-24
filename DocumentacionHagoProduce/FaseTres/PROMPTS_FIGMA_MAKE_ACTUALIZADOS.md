# 📝 PROMPTS DE FIGMA MAKE - ACTUALIZADOS CON SISTEMA DE COLORES
## Hago Produce | Sprint 3 | Diseño de Interfaces

> **Fecha:** 2026-02-24  
> **Objetivo:** Prompts actualizados con el sistema de colores de Hago Produce  
> **Fuente:** Midjourney Brand Identity

---

## 🎨 SISTEMA DE COLORES - RESUMEN

### Colores de Marca

| Nombre | Valor Hex | Uso |
|--------|-----------|-----|
| **Primary-900** | `#1B5E20` | Hover states, elementos activos |
| **Primary-800** | `#2E7D32` | Botones principales, links, acentos |
| **Primary-700** | `#388E3C` | Hover states secundarios |
| **Primary-600** | `#43A047` | Iconos, badges |
| **Primary-500** | `#4CAF50` | Fondos sutiles, highlights |
| **Primary-100** | `#C8E6C9` | Fondos muy sutiles |
| **Primary-50** | `#E8F5E9` | Fondos de mensajes del bot |

### Colores Secundarios

| Nombre | Valor Hex | Uso |
|--------|-----------|-----|
| **Secondary-800** | `#FF6F00` | Acciones secundarias, warnings |
| **Secondary-700** | `#FF8F00` | Hover states |
| **Secondary-600** | `#FFA000` | Iconos, badges |
| **Secondary-50** | `#FFF3E0` | Fondos de notificaciones |

### Neutrales

| Nombre | Valor Hex | Uso |
|--------|-----------|-----|
| **Gray-900** | `#212121` | Texto principal |
| **Gray-600** | `#757575` | Texto secundario |
| **Gray-300** | `#E0E0E0` | Bordes |
| **Gray-100** | `#F5F5F5` | Background principal |
| **White** | `#FFFFFF` | Backgrounds de cards |

### Colores Semánticos

| Nombre | Valor Hex | Uso |
|--------|-----------|-----|
| **Success-500** | `#4CAF50` | Estados exitosos |
| **Warning-500** | `#FF9800` | Advertencias |
| **Error-500** | `#F44336` | Errores |
| **Info-500** | `#2196F3` | Información |

### Colores de Canales

| Canal | Valor Hex | Uso |
|-------|-----------|-----|
| **WhatsApp** | `#25D366` | Iconos, badges |
| **Telegram** | `#0088CC` | Iconos, badges |
| **Email** | `#1976D2` | Iconos, badges |
| **Make.com** | `#6B2CF5` | Iconos, badges |

---

## 📋 PROMPTS ACTUALIZADOS

### 🔴 P0-1: Login Page

```
Create a modern, professional login page for Hago Produce B2B fresh produce management system.

LAYOUT:
- Center-aligned card on a clean background
- Card dimensions: 400px width, auto height
- Card background: White (#FFFFFF) with subtle shadow
- Border radius: 16px
- Padding: 40px

HEADER:
- Logo placeholder at top center (64x64px)
- App name "Hago Produce" below logo (24px, bold, Primary-800 #2E7D32)
- Tagline "Fresh Produce Management" (14px, Gray-600 #757575)

FORM ELEMENTS:
- Email input field:
  * Label: "Email Address" (12px, medium weight, Gray-900 #212121)
  * Placeholder: "you@company.com" (Gray-500 #9E9E9E)
  * Full width, 48px height
  * Border: 1px solid Gray-300 (#E0E0E0)
  * Border radius: 8px
  * Focus state: Primary-800 (#2E7D32) border + subtle shadow

- Password input field:
  * Label: "Password" (12px, medium weight, Gray-900 #212121)
  * Placeholder: "••••••••" (Gray-500 #9E9E9E)
  * Full width, 48px height
  * Border: 1px solid Gray-300 (#E0E0E0)
  - Border radius: 8px
  - Show/hide password toggle icon on right (Gray-600 #757575)
  - Focus state: Primary-800 (#2E7D32) border + subtle shadow

- "Remember me" checkbox:
  * Checkbox + label "Remember me" (14px, Gray-900 #212121)
  * Aligned left

- "Forgot password?" link:
  * Text: "Forgot password?" (14px)
  * Aligned right
  * Primary-800 (#2E7D32), underline on hover

- Login button:
  * Full width, 48px height
  * Background: Primary-800 (#2E7D32)
  * Text: "Sign In" (14px, medium weight, White #FFFFFF)
  - Border radius: 8px
  - Hover state: Primary-900 (#1B5E20)
  - Active state: scale 0.98

FOOTER:
- "Don't have an account?" text (14px, Gray-600 #757575)
- "Contact your administrator" link (Primary-800 #2E7D32, underline)

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

TYPOGRAPHY:
- Font family: Inter
- Headings: 24px, bold, Gray-900 (#212121)
- Labels: 12px, medium weight, Gray-900 (#212121)
- Body: 14px, regular, Gray-900 (#212121)
- Button: 14px, medium weight, White (#FFFFFF)

RESPONSIVE:
- Mobile: Full width card, padding 24px
- Tablet: 400px card centered
- Desktop: 400px card centered

STATES:
- Default: Clean form
- Focus: Primary-800 (#2E7D32) border + shadow
- Error: Error-500 (#F44336) border + error message below field
- Loading: Button shows spinner, text changes to "Signing in..."
- Success: Redirect to dashboard

ACCESSIBILITY:
- All form elements have labels
- Focus states visible
- Keyboard navigation supported
- Contrast ratio WCAG AA
```

### 🔴 P0-2: Admin Dashboard

```
Create a comprehensive admin dashboard for Hago Produce B2B fresh produce management system.

LAYOUT:
- Sidebar navigation (left, 240px width, dark background)
- Top header (top, 64px height, White #FFFFFF background)
- Main content area (right, remaining space, Gray-100 #F5F5F5 background)

SIDEBAR:
- Logo at top (48x48px, White #FFFFFF)
- App name "Hago Produce" (16px, bold, White #FFFFFF)
- Navigation items:
  * Dashboard (icon: grid, active state)
  * Invoices (icon: document)
  * Customers (icon: users)
  * Suppliers (icon: building)
  * Reports (icon: chart)
  * Settings (icon: cog)
- Active item: Primary-800 (#2E7D32) background, White #FFFFFF text
- Inactive item: Transparent background, White #FFFFFF text with 70% opacity
- Hover: White #FFFFFF background with 10% opacity
- User profile at bottom (avatar + name + role)

TOP HEADER:
- Breadcrumb: "Dashboard" (14px, Gray-600 #757575)
- Search bar (right):
  * Width: 300px
  * Placeholder: "Search invoices, customers..." (Gray-500 #9E9E9E)
  * Search icon on left (Gray-600 #757575)
- Notification bell icon (right, with red badge showing "3")
- User avatar dropdown (right, 40x40px)

MAIN CONTENT:
- Page title: "Dashboard" (32px, bold, Gray-900 #212121)
- Date range picker (right): "Last 30 days" dropdown
- KPI Cards row (4 cards, 280px width each):
  * Total Revenue: $125,430 (32px, bold, Primary-800 #2E7D32)
    - Label: "Total Revenue" (14px, Gray-600 #757575)
    - Trend: "+12.5%" (Success-500 #4CAF50, up arrow)
    - Icon: dollar sign (48px, Primary-800 #2E7D32, 20% opacity)
  
  * Total Invoices: 156 (32px, bold, Primary-800 #2E7D32)
    - Label: "Total Invoices" (14px, Gray-600 #757575)
    - Trend: "+8.2%" (Success-500 #4CAF50, up arrow)
    - Icon: document (48px, Primary-800 #2E7D32, 20% opacity)
  
  * Active Customers: 42 (32px, bold, Primary-800 #2E7D32)
    - Label: "Active Customers" (14px, Gray-600 #757575)
    - Trend: "+5.1%" (Success-500 #4CAF50, up arrow)
    - Icon: users (48px, Primary-800 #2E7D32, 20% opacity)
  
  * Overdue Invoices: 8 (32px, bold, Error-500 #F44336)
    - Label: "Overdue Invoices" (14px, Gray-600 #757575)
    - Trend: "-2.3%" (Success-500 #4CAF50, down arrow)
    - Icon: warning (48px, Error-500 #F44336, 20% opacity)

- Charts row (2 columns):
  * Revenue Chart (left, 60% width):
    - Title: "Revenue Trend" (18px, bold, Gray-900 #212121)
    - Line chart showing monthly revenue
    - X-axis: Jan, Feb, Mar, Apr, May, Jun
    - Y-axis: $0 to $150,000
    - Primary-800 (#2E7D32) line with area fill
    - Tooltip on hover showing values
  
  * Invoice Status Chart (right, 40% width):
    - Title: "Invoice Status" (18px, bold, Gray-900 #212121)
    - Donut chart showing:
      - Sent: 65% (Primary-800 #2E7D32)
      - Draft: 20% (Info-500 #2196F3)
      - Overdue: 15% (Error-500 #F44336)
    - Legend with percentages

- Recent Invoices table (full width):
  * Title: "Recent Invoices" (18px, bold, Gray-900 #212121)
  * "View All" button (right, Primary-800 #2E7D32 text)
  * Table columns:
    - Invoice Number (INV-2026-0001)
    - Customer (Tomato King)
    - Amount ($1,250.00)
    - Status (Sent badge - Success-50 #E8F5E9 background, Success-700 #2E7D32 text)
    - Date (Feb 23, 2026)
    - Actions (View, Edit, Delete icons)
  * 5 rows visible
  * Hover: row background Gray-100 (#F5F5F5)
  * Sortable columns

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

TYPOGRAPHY:
- Font family: Inter
- Page title: 32px, bold, Gray-900 (#212121)
- Card title: 18px, bold, Gray-900 (#212121)
- KPI value: 32px, bold
- KPI label: 14px, regular, Gray-600 (#757575)
- Table header: 14px, medium weight, Gray-900 (#212121)
- Table body: 14px, regular, Gray-900 (#212121)

COMPONENTS:
- Cards: White (#FFFFFF) background, 12px border radius, subtle shadow
- Buttons: 8px border radius, 12px padding
- Badges: 12px border radius, 4px padding
- Table: 12px border radius, 56px row height

RESPONSIVE:
- Mobile: Sidebar hidden (hamburger menu), KPI cards stacked, charts stacked
- Tablet: Sidebar collapsed (icons only), 2x2 KPI grid
- Desktop: Full layout as described

INTERACTIONS:
- Hover: Cards lift slightly, buttons darken
- Click: Navigation changes active state
- Chart: Tooltip shows values on hover
- Table: Row highlights on hover, sortable headers

ACCESSIBILITY:
- All interactive elements have focus states
- Keyboard navigation supported
- Contrast ratio WCAG AA
- Screen reader labels
```

### 🔴 P0-3: Invoice Creation Form

```
Create a comprehensive invoice creation form for Hago Produce B2B fresh produce management system.

LAYOUT:
- Sidebar navigation (left, 240px width, dark background)
- Top header (top, 64px height, White #FFFFFF background)
- Main content area (right, remaining space, Gray-100 #F5F5F5 background)

TOP HEADER:
- Breadcrumb: "Invoices > Create Invoice" (14px, Gray-600 #757575)
- Page title: "Create Invoice" (32px, bold, Gray-900 #212121)
- Actions (right):
  * "Save as Draft" button (secondary style)
  * "Create & Send" button (primary style)

MAIN CONTENT:
- Two-column layout (60% left, 40% right)

LEFT COLUMN - Invoice Details:
- Card: "Invoice Details" (White #FFFFFF background, 24px padding, 12px border radius)
  
  * Customer Selection:
    - Label: "Customer" (12px, medium weight, Gray-900 #212121)
    - Dropdown: "Select customer..." (Gray-500 #9E9E9E)
    - Full width, 48px height
    - Border: 1px solid Gray-300 (#E0E0E0)
    - Border radius: 8px
    - Searchable dropdown with customer names
  
  * Invoice Number:
    - Label: "Invoice Number" (12px, medium weight, Gray-900 #212121)
    - Input: "INV-2026-0001" (auto-generated, read-only, Gray-900 #212121)
    - Full width, 48px height
    - Border: 1px solid Gray-300 (#E0E0E0)
    - Border radius: 8px
  
  * Invoice Date:
    - Label: "Invoice Date" (12px, medium weight, Gray-900 #212121)
    - Date picker: Today's date (Gray-900 #212121)
    - Full width, 48px height
    - Border: 1px solid Gray-300 (#E0E0E0)
    - Border radius: 8px
  
  * Due Date:
    - Label: "Due Date" (12px, medium weight, Gray-900 #212121)
    - Date picker: 30 days from invoice date (Gray-900 #212121)
    - Full width, 48px height
    - Border: 1px solid Gray-300 (#E0E0E0)
    - Border radius: 8px
  
  * Send Channel:
    - Label: "Send Channel" (12px, medium weight, Gray-900 #212121)
    - Radio buttons:
      - Email (icon: email, color: #1976D2)
      - WhatsApp (icon: whatsapp, color: #25D366)
      - Telegram (icon: telegram, color: #0088CC)
      - None (don't send automatically)
    - Horizontal layout, 4 options
  
  * Notes:
    - Label: "Notes" (12px, medium weight, Gray-900 #212121)
    - Textarea: "Additional notes..." (Gray-500 #9E9E9E)
    - Full width, 120px height
    - Border: 1px solid Gray-300 (#E0E0E0)
    - Border radius: 8px

RIGHT COLUMN - Line Items:
- Card: "Line Items" (White #FFFFFF background, 24px padding, 12px border radius)
  
  * Add Item button:
    - "Add Item" button (primary style, full width)
    - Background: Primary-800 (#2E7D32)
    - Text: "Add Item" (White #FFFFFF)
    - Icon: plus sign (White #FFFFFF)
  
  * Items table:
    - Columns:
      - Product (dropdown, searchable)
      - Quantity (number input)
      - Unit (dropdown: kg, lb, box, case)
      - Unit Price (currency input, auto-filled)
      - Total (calculated, read-only)
      - Actions (delete icon)
    - 3 rows visible
    - Add row button at bottom
  
  * Totals section:
    - Subtotal: $1,250.00 (right-aligned, 18px, Gray-900 #212121)
    - Tax (13%): $162.50 (right-aligned, 14px, Gray-600 #757575)
    - Total: $1,412.50 (right-aligned, 24px, bold, Primary-800 #2E7D32)

BOTTOM SECTION - Preview:
- Card: "Invoice Preview" (White #FFFFFF background, 24px padding, 12px border radius)
  * "Preview Invoice" button (secondary style)
  * Mini preview of invoice showing:
    - Customer name
    - Invoice number
    - Line items summary
    - Total amount

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

TYPOGRAPHY:
- Font family: Inter
- Page title: 32px, bold, Gray-900 (#212121)
- Card title: 18px, bold, Gray-900 (#212121)
- Labels: 12px, medium weight, Gray-900 (#212121)
- Body: 14px, regular, Gray-900 #212121)
- Button: 14px, medium weight, White #FFFFFF

COMPONENTS:
- Cards: White (#FFFFFF) background, 12px border radius, subtle shadow
- Inputs: 8px border radius, 48px height
- Buttons: 8px border radius, 12px padding
- Table: 12px border radius, 56px row height

STATES:
- Default: Clean form
- Focus: Primary-800 (#2E7D32) border + shadow
- Error: Error-500 (#F44336) border + error message below field
- Loading: Button shows spinner
- Success: Success toast notification

VALIDATION:
- Customer required
- At least one line item required
- Quantity must be positive number
- Unit price must be positive number
- Due date must be after invoice date

RESPONSIVE:
- Mobile: Single column, cards stacked
- Tablet: Two-column layout
- Desktop: Full layout as described

INTERACTIONS:
- Customer selection: Auto-fills customer email/phone
- Product selection: Auto-fills unit price
- Quantity change: Auto-recalculates line item total
- Unit price change: Auto-recalculates line item total
- Add item: Adds new row to table
- Delete item: Removes row, recalculates totals
- Save as Draft: Saves invoice as DRAFT status
- Create & Send: Creates invoice as SENT, sends via selected channel

ACCESSIBILITY:
- All form elements have labels
- Focus states visible
- Keyboard navigation supported
- Contrast ratio WCAG AA
- Error messages specific and actionable
```

### 🟡 P1-3: Chatbot Interface

```
Create a modern chatbot interface for Hago Produce B2B fresh produce management system.

FLOATING CHAT BUTTON:
- Position: Fixed, bottom right, 24px from right, 24px from bottom
- Size: 60px diameter
- Shape: Circle
- Background: Primary-800 (#2E7D32)
- Icon: Chat bubble (White #FFFFFF, 32px)
- Shadow: 0 4px 12px rgba(0,0,0,0.2)
- Border radius: 50%
- Hover state: Scale 1.1, shadow increases
- Active state: Scale 0.95
- Animation: Subtle bounce on page load

CHAT WINDOW:
- Position: Fixed, bottom right, 24px from right, 100px from bottom
- Width: 400px
- Height: 600px
- Background: White (#FFFFFF)
- Border radius: 16px
- Shadow: 0 8px 32px rgba(0,0,0,0.2)
- Animation: Fade in + slide up from bottom

HEADER:
- Height: 64px
- Background: Primary-800 (#2E7D32)
- Border radius: 16px 16px 0 0
- Padding: 16px
- Layout: Flex row, space between

  * Left section:
    - Avatar: 40x40px, White #FFFFFF circle with chatbot icon
    - Title: "Hago Assistant" (16px, bold, White #FFFFFF)
    - Subtitle: "Online" (12px, White #FFFFFF, 80% opacity)
  
  * Right section:
    - Minimize button (White #FFFFFF icon, 24px)
    - Close button (White #FFFFFF icon, 24px)

MESSAGES AREA:
- Height: 440px (600 - 64 - 96)
- Background: Gray-100 (#F5F5F5)
- Padding: 16px
- Overflow-y: auto
- Scrollbar: Thin, Primary-800 (#2E7D32)

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
    - Three dots animation (Primary-800 #2E7D32)
    - Avatar: 32x32px, left of indicator

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
    - Placeholder: "Type your message..." (Gray-500 #9E9E9E)
    - Font: 14px, regular, Gray-900 (#212121)
    - Focus: Primary-800 (#2E7D32) border + shadow
    - Resize: none
  
  * Send button:
    - Position: Absolute, right, 16px from right
    - Size: 40px diameter
    - Shape: Circle
    - Background: Primary-800 (#2E7D32)
    - Icon: Send (White #FFFFFF, 20px)
    - Border radius: 50%
    - Hover: Primary-900 (#1B5E20)
    - Active: Scale 0.95
  
  * Voice input button (optional):
    - Position: Absolute, right, 64px from right
    - Size: 40px diameter
    - Shape: Circle
    - Background: Transparent
    - Icon: Microphone (Primary-800 #2E7D32, 20px)
    - Border radius: 50%
    - Hover: Background Gray-100 (#F5F5F5)

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

TYPOGRAPHY:
- Font family: Inter
- Header title: 16px, bold, White #FFFFFF
- Message: 14px, regular
- Timestamp: 11px, regular, Gray-600 (#757575)
- Placeholder: 14px, regular, Gray-500 #9E9E9E
- Quick action: 12px, medium weight

STATES:
- Closed: Only floating button visible
- Opening: Chat window fades in + slides up
- Open: Full chat window visible
- Minimized: Chat window collapses to header only
- Typing: Typing indicator visible
- Sending: Send button shows spinner
- Error: Error message in Error-500 (#F44336)

RESPONSIVE:
- Mobile: Full width, height 100vh, border radius 0
- Tablet: 400px width, 600px height
- Desktop: 400px width, 600px height

INTERACTIONS:
- Floating button click: Opens chat window
- Close button click: Closes chat window
- Minimize button click: Minimizes chat window
- Send button click: Sends message
- Enter key: Sends message
- Quick action click: Sends predefined message
- Voice input click: Activates voice recognition

ACCESSIBILITY:
- All interactive elements have focus states
- Keyboard navigation supported
- Contrast ratio WCAG AA
- Screen reader labels
- ARIA labels for buttons
- Focus trap in chat window when open

ANIMATIONS:
- Fade in: 300ms ease-in-out
- Slide up: 300ms ease-in-out
- Scale: 200ms ease-in-out
- Typing dots: 1.5s infinite loop
- Message appear: 200ms ease-in-out

EXAMPLE CONVERSATION:
Bot: "Hi! I'm Hago Assistant. How can I help you today?"
User: "Create an invoice for Tomato King"
Bot: "Sure! I'll help you create an invoice for Tomato King. What products would you like to include?"
User: "5 boxes of mango"
Bot: "Got it! 5 boxes of mango at $25.00 each = $125.00. Would you like to add more items?"
User: "No, that's all"
Bot: "Perfect! Here's the summary:
Customer: Tomato King
Items: 5 boxes of mango @ $25.00 = $125.00
Subtotal: $125.00
Tax (13%): $16.25
Total: $141.25

Would you like to send this invoice via email, WhatsApp, or Telegram?"
```

---

## 📊 RESUMEN DE CAMBIOS

### Cambios Principales:

1. **Actualización de colores de marca:**
   - Primary: `#2E7D32` (verde forestal)
   - Primary Dark: `#1B5E20` (verde más oscuro)
   - Primary Light: `#E8F5E9` (verde muy claro)

2. **Actualización de colores secundarios:**
   - Secondary: `#FF6F00` (ámbar)
   - Secondary Light: `#FFF3E0` (ámbar muy claro)

3. **Actualización de neutrales:**
   - Text Primary: `#212121` (gris muy oscuro)
   - Text Secondary: `#757575` (gris medio)
   - Background: `#F5F5F5` (gris muy claro)
   - Surface: `#FFFFFF` (blanco puro)

4. **Actualización de colores semánticos:**
   - Success: `#4CAF50` (verde)
   - Warning: `#FF9800` (naranja)
   - Error: `#F44336` (rojo)
   - Info: `#2196F3` (azul)

5. **Actualización de colores de canales:**
   - WhatsApp: `#25D366` (verde WhatsApp)
   - Telegram: `#0088CC` (azul Telegram)
   - Email: `#1976D2` (azul corporativo)

### Cambios Específicos por Prompt:

- **Login Page:** Actualizados todos los colores de inputs, botones y texto
- **Admin Dashboard:** Actualizados KPI cards, badges y gráficos
- **Invoice Creation Form:** Actualizados colores de canales (Email, WhatsApp, Telegram)
- **Chatbot Interface:** Actualizados colores de mensajes del bot y usuario, quick actions

---

## 🚀 PRÓXIMOS PASOS

1. **Revisar los prompts actualizados** para asegurar que todos los colores son correctos
2. **Generar diseños en Figma MAKE** usando los prompts actualizados
3. **Validar los diseños** con stakeholders
4. **Ajustar según feedback** si es necesario
5. **Implementar en código** usando las variables CSS o Tailwind config proporcionadas

---

**Generado por:** SuperNinja AI Agent  
**Fecha:** 2026-02-24  
**Versión:** 1.0  
**Fuente:** Midjourney Brand Identity