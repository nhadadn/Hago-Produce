# Wireframe: Invoice Detail (Phase 1B)

## Layout Structure
- **Top Bar:** Breadcrumb: "Invoices > INV-2024-001" | Status Badge (e.g., "PAID" in Green)
- **Actions Bar (Right):**
    - [Button] Edit (if Draft)
    - [Button] Download PDF
    - [Button] Send Email
    - [Dropdown] More (Void, Duplicate, Delete)

## Main Content Area (2 Columns)

### Left Column (Main Info - 2/3 width)
**1. Document Header**
- **Logo:** Hago Produce
- **Invoice #:** INV-2024-001
- **Date Issued:** Oct 24, 2024
- **Due Date:** Nov 24, 2024 (Net 30)

**2. Parties**
- **From:** Hago Produce Inc. (Address, Tax ID)
- **Bill To:** Supermercado Del Valle (Address, RFC, Contact)

**3. Line Items Table**
- **Headers:** Item | Description | Qty | Unit Price | Tax | Total
- **Row 1:** Apple Gala | Fresh crop, box of 18kg | 10 | $25.00 | 0% | $250.00
- **Row 2:** Logistics | Delivery fee | 1 | $50.00 | 16% | $50.00

**4. Totals Section (Right Aligned)**
- **Subtotal:** $300.00
- **Tax (16%):** $8.00
- **Total:** $308.00

**5. Notes & Terms**
- **Notes:** "Thank you for your business."
- **Terms:** "Payment due within 30 days."

### Right Column (Context & Metadata - 1/3 width)
**1. Status History (Timeline)**
- [Dot] Created by Admin (Oct 24, 10:00 AM)
- [Dot] Sent to client@example.com (Oct 24, 10:05 AM)
- [Dot] Viewed by Client (Oct 25, 09:00 AM)
- [Dot] Payment Recorded (Oct 26, 02:00 PM)

**2. Internal Notes**
- **Input:** "Add a private note..."
- **List:**
    - "Client requested split payment next time." - *User A, Oct 25*

**3. Attachments**
- [Icon] Signed_Delivery_Note.pdf
- [Button] + Upload File

## Visual Notes
- The "Paper" visual: The Left Column should look like a digital representation of the paper document (White background, shadow).
- The Right Column is the "System" context (Gray background, standard UI controls).
