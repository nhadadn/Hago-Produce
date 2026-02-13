# Wireframe: Reports & Analytics (Phase 3)

## Layout Structure
- **Top Bar:** Breadcrumb: "Dashboard > Reports"
- **Sidebar:** Standard Navigation

## Main Content Area

### 1. Reports Dashboard (Overview)
**Grid of Pre-defined Reports:**
- **Sales Performance:** Revenue over time, by customer, by product.
- **Inventory Analysis:** Turnover rate, low stock frequency, wastage.
- **Financial Health:** Outstanding receivables, cash flow forecast.
- **Supplier Rating:** Delivery time, price stability, quality issues.

### 2. Report Detail View (e.g., Sales Performance)
**Header:**
- **Title:** "Sales Performance"
- **Controls:**
    - Date Range Picker (Last 30 days, YTD, Custom)
    - Filter by: Product Category, Region
    - [Button] Export PDF/CSV

**Charts:**
- **Main Chart (Line):** Daily Revenue vs. Target.
- **Secondary Chart (Donut):** Sales by Product Category (Fruit vs. Veg vs. Dry).
- **Tertiary Chart (Bar):** Top 5 Customers by Volume.

**Data Table:**
- Detailed breakdown of the data shown in charts.
- Columns: Date | Category | Revenue | Cost | Profit | Margin %

## Visual Notes
- **Charts:** Use a consistent color palette (Brand colors).
- **Interactivity:** Hovering on charts shows tooltips with exact numbers. Clicking a chart segment filters the table below.
