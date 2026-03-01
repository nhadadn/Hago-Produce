import { Prisma } from '@prisma/client';
import { TaxCalculationService, TransactionType, extractProvinceFromAddress } from '../tax-calculation.service';
import { DEFAULT_TAX_FALLBACK } from '@/lib/constants/taxes';

// Mock logger to avoid console noise
jest.mock('@/lib/logger/logger.service', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('TaxCalculationService', () => {
  let service: TaxCalculationService;

  beforeEach(() => {
    service = new TaxCalculationService();
    jest.clearAllMocks();
  });

  describe('extractProvinceFromAddress', () => {
    it('should return null for null/undefined/empty address', () => {
      expect(extractProvinceFromAddress(null)).toBeNull();
      expect(extractProvinceFromAddress(undefined)).toBeNull();
      expect(extractProvinceFromAddress('')).toBeNull();
    });

    it('should extract 2-letter province code', () => {
      expect(extractProvinceFromAddress('123 Main St, Toronto, ON, M5V 2H1')).toBe('ON');
      expect(extractProvinceFromAddress('Vancouver, BC')).toBe('BC');
    });

    it('should extract full province name', () => {
      expect(extractProvinceFromAddress('Calgary, Alberta')).toBe('AB');
      expect(extractProvinceFromAddress('Montreal, Québec')).toBe('QC'); // Special char
      expect(extractProvinceFromAddress('Halifax, Nova Scotia')).toBe('NS');
    });

    it('should be case insensitive', () => {
      expect(extractProvinceFromAddress('winnipeg, mb')).toBe('MB');
      expect(extractProvinceFromAddress('SASKATOON, SASKATCHEWAN')).toBe('SK');
    });

    it('should return null if no province found', () => {
      expect(extractProvinceFromAddress('123 Main St, New York, NY')).toBeNull();
      expect(extractProvinceFromAddress('Unknown Place')).toBeNull();
    });
  });

  describe('calculateTax', () => {
    it('should calculate correct tax for Ontario (HST 13%)', () => {
      const amount = 100;
      const result = service.calculateTax('ON', amount, TransactionType.SALE);

      expect(result.taxAmount.toNumber()).toBe(13); // 13% of 100
      expect(result.taxRate.toNumber()).toBe(0.13);
      expect(result.breakdown.hst.toNumber()).toBe(13);
      expect(result.breakdown.gst.toNumber()).toBe(0);
      expect(result.breakdown.pst.toNumber()).toBe(0);
      expect(result.breakdown.qst.toNumber()).toBe(0);
    });

    it('should calculate correct tax for Alberta (GST 5%)', () => {
      const amount = 200;
      const result = service.calculateTax('AB', amount, TransactionType.PURCHASE);

      expect(result.taxAmount.toNumber()).toBe(10); // 5% of 200
      expect(result.taxRate.toNumber()).toBe(0.05);
      expect(result.breakdown.gst.toNumber()).toBe(10);
      expect(result.breakdown.hst.toNumber()).toBe(0);
    });

    it('should calculate correct tax for British Columbia (GST 5% + PST 7%)', () => {
      const amount = 100;
      const result = service.calculateTax('BC', amount, TransactionType.SALE);

      // GST 5 + PST 7 = 12
      expect(result.taxAmount.toNumber()).toBe(12);
      expect(result.breakdown.gst.toNumber()).toBe(5);
      expect(result.breakdown.pst.toNumber()).toBe(7);
    });

    it('should calculate correct tax for Quebec (GST 5% + QST 9.975%)', () => {
      const amount = 1000;
      const result = service.calculateTax('QC', amount, TransactionType.SALE);

      // GST 50 + QST 99.75 = 149.75
      expect(result.taxAmount.toNumber()).toBe(149.75);
      expect(result.breakdown.gst.toNumber()).toBe(50);
      expect(result.breakdown.qst.toNumber()).toBe(99.75);
    });

    it('should use default fallback if province is null', () => {
      // Assuming DEFAULT_TAX_FALLBACK is defined in constants/taxes
      // We can't easily mock the constant import directly without more setup,
      // but we can verify it logs a warning and returns a result.
      const amount = 100;
      const result = service.calculateTax(null, amount, TransactionType.SALE);

      expect(result).toBeDefined();
      // It should rely on whatever DEFAULT_TAX_FALLBACK is (likely ON or BC)
    });

    it('should throw error for invalid province code', () => {
      expect(() => {
        service.calculateTax('XX', 100, TransactionType.SALE);
      }).toThrow('Invalid province code');
    });

    it('should handle zero amount correctly', () => {
      const result = service.calculateTax('ON', 0, TransactionType.SALE);
      expect(result.taxAmount.toNumber()).toBe(0);
      expect(result.taxRate.toNumber()).toBe(0.13); // Should return the rate even if amount is 0
    });
  });
});
