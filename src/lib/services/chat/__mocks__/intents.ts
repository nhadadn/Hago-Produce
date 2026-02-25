
export const analyzeIntent = jest.fn().mockImplementation(
  async (message: string, language: string) => {
    // Simulación básica de detección de intents
    const msg = message.toLowerCase();
    if (msg.includes('precio') || msg.includes('price')) {
      return { intent: 'price_lookup', confidence: 0.9, params: { productName: 'manzana' } };
    }
    if (msg.includes('proveedor') || msg.includes('supplier')) {
      return { intent: 'best_supplier', confidence: 0.85, params: {} };
    }
    if (msg.includes('factura') || msg.includes('invoice')) {
      return { intent: 'invoice_status', confidence: 0.88, params: { invoiceNumber: 'inv-123' } };
    }
    if (msg.includes('inventario') || msg.includes('inventory')) {
      return { intent: 'inventory_summary', confidence: 0.82, params: {} };
    }
    return { intent: 'price_lookup', confidence: 0.3, params: {} };
  }
);
