import { parseValues } from '../../../../scripts/google-sheets-migration/client';

describe('GoogleSheetsClient parseValues', () => {
  it('returns empty structure when no values', () => {
    const result = parseValues(null);
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
    expect(result.rowCount).toBe(0);
  });

  it('parses header row and data rows into objects', () => {
    const values = [
      ['id', 'name', 'price'],
      ['1', 'Product A', '10.5'],
      ['2', 'Product B', '20'],
    ];

    const result = parseValues(values);

    expect(result.headers).toEqual(['id', 'name', 'price']);
    expect(result.rowCount).toBe(2);
    expect(result.rows).toEqual([
      { id: '1', name: 'Product A', price: '10.5' },
      { id: '2', name: 'Product B', price: '20' },
    ]);
  });

  it('fills missing columns with null', () => {
    const values = [
      ['id', 'name', 'price'],
      ['1', 'Product A'],
    ];

    const result = parseValues(values);

    expect(result.rows[0]).toEqual({ id: '1', name: 'Product A', price: null });
  });
});
