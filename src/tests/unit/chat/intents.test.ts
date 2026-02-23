import { analyzeIntent } from '@/lib/services/chat/intents';

describe('chat intents - analyzeIntent', () => {
  it('detects price_lookup in Spanish', async () => {
    const result = await analyzeIntent('¿Cuál es el precio de la manzana?', 'es');
    expect(result.intent).toBe('price_lookup');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('detects best_supplier in English', async () => {
    const result = await analyzeIntent('Who is the best supplier for avocados?', 'en');
    expect(result.intent).toBe('best_supplier');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('detects invoice_status with number', async () => {
    const result = await analyzeIntent('Estado de factura #INV-123', 'es');
    expect(result.intent).toBe('invoice_status');
    expect(result.params.invoiceNumber).toBe('inv-123');
  });

  it('falls back to price_lookup with low confidence when unknown', async () => {
    const result = await analyzeIntent('Hola', 'es');
    expect(result.intent).toBe('price_lookup');
    expect(result.confidence).toBeLessThanOrEqual(0.5);
  });
});

