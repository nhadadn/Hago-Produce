# Wireframe: Product List & Detail

## Layout Structure
- **Top Bar:** Breadcrumb: "Dashboard > Products"
- **Sidebar:** Standard Navigation

## Main Content Area

### 1. Product Catalog (List View)
- **Header:** "Product Catalog" | [Button] + Add Product
- **Filters:** Category (Fruits, Vegetables, etc.), Supplier, Status (Active/Archived)
- **Grid/List Toggle:** View as Cards (Image focus) or Table (Data focus)

#### Table View Columns
- **Image** (Thumbnail)
- **SKU / Code**
- **Product Name**
- **Category**
- **Stock Level** (Progress bar or number)
- **Unit Price**
- **Supplier**
- **Status**

### 2. Product Detail View
- **Header:** "Manzana Gala (Imported)" | [Button] Edit
- **Top Section:**
    - **Image Gallery** (Left)
    - **Info Card** (Right): SKU, Category, Base Price, Current Stock
- **Tabs:**
    - **[ Overview ]** Description, Specifications
    - **[ Pricing ]** Historical Pricing, Supplier Costs
    - **[ Stock History ]** In/Out movements log
- **Pricing Tab Detail:**
    - Chart: Price fluctuation over last 6 months
    - Table: Supplier price comparison (if multiple suppliers)

## Visual Notes
- Use high-quality placeholders for product images.
- Stock levels should use color coding (Red < 10, Yellow < 50, Green > 50).
