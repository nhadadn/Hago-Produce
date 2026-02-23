# Wireframe: AI Chat Interface (Phase 1C)

## Layout Structure
- **Global:** Accessible via a floating button (bottom-right) OR a dedicated Sidebar item "AI Assistant".
- **Dedicated View:** Full height chat window.

## Main Content Area

### 1. Empty State (Welcome)
- **Avatar:** AI Bot Icon
- **Greeting:** "Hello! I can help you check prices, find invoices, or analyze supplier data."
- **Suggested Queries (Chips):**
    - "Price of Avocados?"
    - "Status of Invoice #1023?"
    - "Who sells best Apples?"
    - "Total sales this week?"

### 2. Conversation Flow
**User:** "What is the current price for Apple Gala?"
**AI:**
- **Text:** "Here are the current prices for Apple Gala:"
- **Rich Widget (Table):**
    | Supplier | Price/kg | Last Updated |
    |----------|----------|--------------|
    | Fresh Farms | $1.20 | Today |
    | Green Valley| $1.25 | Yesterday |
- **Follow-up:** "Would you like to create an invoice with these items?"

**User:** "Yes, for Supermercado Del Valle, 500kg from Fresh Farms."
**AI:**
- **Action:** "I've drafted invoice #DRAFT-101."
- **Rich Widget (Invoice Preview Card):**
    - Customer: Supermercado Del Valle
    - Item: Apple Gala (Fresh Farms) x 500kg
    - Total: $600.00
    - [Button] Edit Draft | [Button] Confirm & Send

### 3. Input Area
- **Text Area:** Multiline, auto-expand.
- **Microphone Icon:** For voice input (future).
- **Send Button:** Active only when text exists.

## Visual Notes
- **Bubbles:**
    - User: Right aligned, Blue background, White text.
    - AI: Left aligned, Gray background, Dark text.
- **Widgets:** AI responses should not just be text; they should render mini-tables, cards, or links to actual system entities.
