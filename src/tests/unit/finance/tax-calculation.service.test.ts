import { TaxCalculationService, TransactionType, extractProvinceFromAddress } from '@/lib/services/finance/tax-calculation.service';
import { Prisma } from '@prisma/client';
import { DEFAULT_TAX_FALLBACK } from '@/lib/constants/taxes';

describe('TaxCalculationService', () => {
  let service: TaxCalculationService;

  beforeEach(() => {
    service = new TaxCalculationService();
  });

  describe('extractProvinceFromAddress', () => {
    it('should extract province code from exact 2-letter code', () => {
      expect(extractProvinceFromAddress('Toronto, ON, Canada')).toBe('ON');
      expect(extractProvinceFromAddress('Vancouver BC')).toBe('BC');
      expect(extractProvinceFromAddress('Halifax, NS')).toBe('NS');
    });

    it('should extract province from full name', () => {
      expect(extractProvinceFromAddress('Calgary, Alberta')).toBe('AB');
      expect(extractProvinceFromAddress('Montreal, Quebec')).toBe('QC');
      expect(extractProvinceFromAddress('Winnipeg, Manitoba')).toBe('MB');
    });

    it('should return null if no province found', () => {
      expect(extractProvinceFromAddress('New York, NY')).toBe(null);
      expect(extractProvinceFromAddress('')).toBe(null);
      expect(extractProvinceFromAddress(null)).toBe(null);
      expect(extractProvinceFromAddress(undefined)).toBe(null);
    });

    it('should be case insensitive', () => {
      expect(extractProvinceFromAddress('ontario')).toBe('ON');
      expect(extractProvinceFromAddress('bc')).toBe('BC');
      expect(extractProvinceFromAddress('british columbia')).toBe('BC');
    });
  });

  describe('calculateTax', () => {
    it('should use default fallback when province is null/undefined', () => {
      const amount = new Prisma.Decimal(100);
      const result = service.calculateTax(null, amount, TransactionType.SALE);
      
      expect(result.taxRate.toNumber()).toBe(DEFAULT_TAX_FALLBACK.rate);
      expect(result.taxAmount.toNumber()).toBe(100 * DEFAULT_TAX_FALLBACK.rate);
      // Default fallback is usually ON (0.13)
      if (DEFAULT_TAX_FALLBACK.province === 'ON') {
        expect(result.breakdown.hst.toNumber()).toBe(100 * DEFAULT_TAX_FALLBACK.rate);
      }
    });

    it('should calculate Ontario tax (13% HST) correctly', () => {
      const amount = new Prisma.Decimal(100);
      const result = service.calculateTax('ON', amount, TransactionType.SALE);

      expect(result.taxAmount.toNumber()).toBe(13);
      expect(result.taxRate.toNumber()).toBe(0.13);
      expect(result.breakdown.hst.toNumber()).toBe(13);
      expect(result.breakdown.gst.toNumber()).toBe(0);
      expect(result.breakdown.pst.toNumber()).toBe(0);
      expect(result.breakdown.qst.toNumber()).toBe(0);
    });

    it('should calculate BC tax (5% GST + 7% PST) correctly', () => {
      const amount = new Prisma.Decimal(100);
      const result = service.calculateTax('BC', amount, TransactionType.SALE);

      expect(result.taxAmount.toNumber()).toBe(12);
      expect(result.taxRate.toNumber()).toBe(0.12);
      expect(result.breakdown.gst.toNumber()).toBe(5);
      expect(result.breakdown.pst.toNumber()).toBe(7);
      expect(result.breakdown.hst.toNumber()).toBe(0);
      expect(result.breakdown.qst.toNumber()).toBe(0);
    });

    it('should calculate Quebec tax (5% GST + 9.975% QST) correctly', () => {
      const amount = new Prisma.Decimal(100);
      const result = service.calculateTax('QC', amount, TransactionType.SALE);

      expect(result.taxAmount.toNumber()).toBe(14.975);
      expect(result.taxRate.toNumber()).toBe(0.14975);
      expect(result.breakdown.gst.toNumber()).toBe(5);
      expect(result.breakdown.qst.toNumber()).toBe(9.975);
      expect(result.breakdown.hst.toNumber()).toBe(0);
      expect(result.breakdown.pst.toNumber()).toBe(0);
    });

    it('should calculate Alberta tax (5% GST) correctly', () => {
      const amount = new Prisma.Decimal(100);
      const result = service.calculateTax('AB', amount, TransactionType.SALE);

      expect(result.taxAmount.toNumber()).toBe(5);
      expect(result.taxRate.toNumber()).toBe(0.05);
      expect(result.breakdown.gst.toNumber()).toBe(5);
      expect(result.breakdown.hst.toNumber()).toBe(0);
      expect(result.breakdown.pst.toNumber()).toBe(0);
      expect(result.breakdown.qst.toNumber()).toBe(0);
    });

    it('should throw error for invalid province', () => {
      const amount = new Prisma.Decimal(100);
      expect(() => {
        service.calculateTax('XX', amount, TransactionType.SALE);
      }).toThrow('Invalid province code: XX');
    });

    it('should handle zero amount correctly', () => {
      const amount = new Prisma.Decimal(0);
      const result = service.calculateTax('ON', amount, TransactionType.SALE);

      expect(result.taxAmount.toNumber()).toBe(0);
      expect(result.taxRate.toNumber()).toBe(0.13); // Should still return the rate
      expect(result.breakdown.hst.toNumber()).toBe(0);
    });

    it('should handle large amounts correctly', () => {
      const amount = new Prisma.Decimal(1000000);
      const result = service.calculateTax('ON', amount, TransactionType.SALE);

      expect(result.taxAmount.toNumber()).toBe(130000);
    });

    it('should calculate tax correctly when amount is passed as number', () => {
        const amount = 100;
        const result = service.calculateTax('ON', amount, TransactionType.SALE);
        expect(result.taxAmount.toNumber()).toBe(13);
    });

    it('should calculate tax correctly when amount is passed as Decimal', () => {
        const amount = new Prisma.Decimal(100);
        const result = service.calculateTax('ON', amount, TransactionType.SALE);
        expect(result.taxAmount.toNumber()).toBe(13);
    });

    // Test all provinces to ensure coverage
    const provinces = [
      { code: 'AB', rate: 0.05 },
      { code: 'BC', rate: 0.12 },
      { code: 'MB', rate: 0.12 },
      { code: 'NB', rate: 0.15 },
      { code: 'NL', rate: 0.15 },
      { code: 'NT', rate: 0.05 },
      { code: 'NS', rate: 0.14 },
      { code: 'NU', rate: 0.05 },
      { code: 'ON', rate: 0.13 },
      { code: 'PE', rate: 0.15 },
      { code: 'QC', rate: 0.14975 },
      { code: 'SK', rate: 0.11 },
      { code: 'YT', rate: 0.05 },
    ];

    provinces.forEach(({ code, rate }) => {
      it(`should calculate correct tax for ${code}`, () => {
        const amount = new Prisma.Decimal(100);
        const result = service.calculateTax(code, amount, TransactionType.SALE);
        expect(result.taxRate.toNumber()).toBeCloseTo(rate, 5);
        expect(result.taxAmount.toNumber()).toBeCloseTo(100 * rate, 5);
      });
    });

    it('should be case insensitive for province code', () => {
      const amount = new Prisma.Decimal(100);
      const result = service.calculateTax('on', amount, TransactionType.SALE);
      expect(result.taxRate.toNumber()).toBe(0.13);
    });
  });
});
