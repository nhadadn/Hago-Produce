# Design System

## 🎨 Colors

### Primary Palette
- **Primary:** `#0F172A` (Slate 900) - Headers, Primary Buttons, Sidebar
- **Secondary:** `#64748B` (Slate 500) - Secondary Text, Borders, Icons
- **Accent:** `#2563EB` (Blue 600) - Active States, Links, Highlights
- **Background:** `#F8FAFC` (Slate 50) - App Background
- **Surface:** `#FFFFFF` (White) - Cards, Tables, Modals

### Status Colors (Critical for Compliance)
- **Valid / Compliant:** `#16A34A` (Green 600)
- **Warning / Near Expiry:** `#D97706` (Amber 600)
- **Error / Non-Compliant:** `#DC2626` (Red 600)
- **Info / Draft:** `#3B82F6` (Blue 500)

## 🔤 Typography

**Font Family:** Inter (Sans-serif) - Optimized for UI readability.

### Scale
- **H1:** 30px / 36px (Bold) - Page Titles
- **H2:** 24px / 32px (SemiBold) - Section Headers
- **H3:** 20px / 28px (Medium) - Card Titles
- **Body:** 14px / 20px (Regular) - Standard Text (Optimized for data density)
- **Small:** 12px / 16px (Regular) - Metadata, Table secondary info
- **Mono:** 13px / 20px - Codes (Pedimento numbers, HS Codes)

## 🧱 Components (shadcn/ui)

We utilize **shadcn/ui** components customized with TailwindCSS, focusing on **Data Density** and **Accessibility**.

### Core Components
- **Data Table:** Advanced filtering, sorting, pagination, and row actions. Sticky headers for long lists.
- **Forms:** `react-hook-form` + `zod` validation. Layouts: Grid-based for efficient data entry.
- **Tabs:** Used heavily in Detail views to organize complex information (General, Partidas, Anexos).
- **Cards:** Dashboard widgets and summary sections.
- **Badges:** Visual indicators for Status (Valid, Error, Warning).
- **Dialogs:** Confirmation steps (e.g., "Confirm Adjustment") and quick edits.

## 📐 Spacing & Layout

Based on 4px grid (Tailwind defaults).
- **Compact Density:** `p-2`, `gap-2` used in tables and dense lists.
- **Standard Density:** `p-4`, `gap-4` used in page layout and cards.
- **Sectioning:** `m-6` or `m-8` to separate major logical blocks.

### Layout Structure
- **Sidebar (Left):** Navigation (Collapsible).
- **Top Bar:** Breadcrumbs, User Profile, Global Search, Tenant Switcher.
- **Main Content:** Padding `p-6`, Max-width constraint for readability on large screens (e.g., `max-w-7xl`).
