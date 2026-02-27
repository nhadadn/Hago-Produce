import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger/logger.service';
import { DEFAULT_TAX_FALLBACK } from '@/lib/constants/taxes';

export enum TransactionType {
  SALE = 'SALE',
  PURCHASE = 'PURCHASE',
}

export interface TaxBreakdown {
  gst: Prisma.Decimal;
  pst: Prisma.Decimal;
  hst: Prisma.Decimal;
  qst: Prisma.Decimal;
}

export interface TaxResult {
  taxAmount: Prisma.Decimal;
  taxRate: Prisma.Decimal;
  breakdown: TaxBreakdown;
}

export interface ITaxCalculator {
  calculateTax(province: string, amount: Prisma.Decimal | number, type: TransactionType): TaxResult;
}

interface ProvinceTaxRates {
  gst: number;
  pst: number;
  hst: number;
  qst: number;
}

// 2025/2026 Canadian Tax Rates
const PROVINCIAL_TAX_RATES: Record<string, ProvinceTaxRates> = {
  'AB': { gst: 0.05, pst: 0.00, hst: 0.00, qst: 0.00 }, // Alberta: 5% GST
  'BC': { gst: 0.05, pst: 0.07, hst: 0.00, qst: 0.00 }, // British Columbia: 5% GST + 7% PST
  'MB': { gst: 0.05, pst: 0.07, hst: 0.00, qst: 0.00 }, // Manitoba: 5% GST + 7% RST
  'NB': { gst: 0.00, pst: 0.00, hst: 0.15, qst: 0.00 }, // New Brunswick: 15% HST
  'NL': { gst: 0.00, pst: 0.00, hst: 0.15, qst: 0.00 }, // Newfoundland and Labrador: 15% HST
  'NT': { gst: 0.05, pst: 0.00, hst: 0.00, qst: 0.00 }, // Northwest Territories: 5% GST
  'NS': { gst: 0.00, pst: 0.00, hst: 0.14, qst: 0.00 }, // Nova Scotia: 14% HST (Effective April 1, 2025)
  'NU': { gst: 0.05, pst: 0.00, hst: 0.00, qst: 0.00 }, // Nunavut: 5% GST
  'ON': { gst: 0.00, pst: 0.00, hst: 0.13, qst: 0.00 }, // Ontario: 13% HST
  'PE': { gst: 0.00, pst: 0.00, hst: 0.15, qst: 0.00 }, // Prince Edward Island: 15% HST
  'QC': { gst: 0.05, pst: 0.00, hst: 0.00, qst: 0.09975 }, // Quebec: 5% GST + 9.975% QST
  'SK': { gst: 0.05, pst: 0.06, hst: 0.00, qst: 0.00 }, // Saskatchewan: 5% GST + 6% PST
  'YT': { gst: 0.05, pst: 0.00, hst: 0.00, qst: 0.00 }, // Yukon: 5% GST
};

/**
 * Extracts a valid Canadian province code from an address string.
 * Returns null if no province is found.
 * @param address Address string to parse
 * @returns Two-letter province code (e.g., 'ON', 'BC') or null if not found
 */
export function extractProvinceFromAddress(address: string | null | undefined): string | null {
  if (!address) return null;

  const upperAddress = address.toUpperCase();
  const provinces = Object.keys(PROVINCIAL_TAX_RATES);

  // 1. Check for exact 2-letter codes with boundaries
  for (const province of provinces) {
    const regex = new RegExp(`\\b${province}\\b`);
    if (regex.test(upperAddress)) {
      return province;
    }
  }

  // 2. Check for full names
  const provinceNames: Record<string, string> = {
    'ALBERTA': 'AB',
    'BRITISH COLUMBIA': 'BC',
    'MANITOBA': 'MB',
    'NEW BRUNSWICK': 'NB',
    'NEWFOUNDLAND': 'NL',
    'LABRADOR': 'NL',
    'NORTHWEST TERRITORIES': 'NT',
    'NOVA SCOTIA': 'NS',
    'NUNAVUT': 'NU',
    'ONTARIO': 'ON',
    'PRINCE EDWARD ISLAND': 'PE',
    'QUEBEC': 'QC',
    'QUÉBEC': 'QC',
    'SASKATCHEWAN': 'SK',
    'YUKON': 'YT',
  };

  for (const [name, code] of Object.entries(provinceNames)) {
    if (upperAddress.includes(name)) {
      return code;
    }
  }

  return null;
}

export class TaxCalculationService implements ITaxCalculator {
  /**
   * Calculates tax based on province and amount.
   * Rates are hardcoded for 2025/2026 compliance.
   * NOTE: Rates are updated annually or as per legislation changes.
   * Currently using rates effective April 1, 2025.
   * 
   * @param province Two-letter province code (e.g., 'ON', 'BC')
   * @param amount The amount to calculate tax on
   * @param type Transaction type (SALE or PURCHASE) - currently uses same rates but allows for future differentiation
   * @returns TaxResult with detailed breakdown
   * @throws Error if province is invalid
   */
  public calculateTax(province: string | null | undefined, amount: Prisma.Decimal | number, type: TransactionType): TaxResult {
    if (!province) {
      const fallback = DEFAULT_TAX_FALLBACK;
      logger.warn(`Province is null/undefined in calculateTax. Defaulting to ${fallback.province} (${fallback.rate * 100}% ${fallback.code}).`, { amount: Number(amount), type });
      province = fallback.province;
    }

    const upperProvince = province.toUpperCase();
    const rates = PROVINCIAL_TAX_RATES[upperProvince];

    if (!rates) {
      const errorMsg = `Invalid province code: ${province}. Must be one of: ${Object.keys(PROVINCIAL_TAX_RATES).join(', ')}`;
      const error = new Error(errorMsg);
      logger.error('Tax calculation failed: Invalid province', error, { province, type, amount: Number(amount) });
      throw error;
    }

    const amountDecimal = new Prisma.Decimal(amount);

    // Calculate individual components
    const gstAmount = amountDecimal.times(rates.gst);
    const pstAmount = amountDecimal.times(rates.pst);
    const hstAmount = amountDecimal.times(rates.hst);
    const qstAmount = amountDecimal.times(rates.qst);

    // Calculate total tax amount
    const totalTaxAmount = gstAmount.plus(pstAmount).plus(hstAmount).plus(qstAmount);

    // Calculate effective tax rate (Total Tax / Amount)
    // Avoid division by zero if amount is 0
    let effectiveRate = new Prisma.Decimal(0);
    if (!amountDecimal.isZero()) {
        effectiveRate = totalTaxAmount.div(amountDecimal);
    } else {
        // If amount is 0, effective rate is sum of rates
        effectiveRate = new Prisma.Decimal(rates.gst + rates.pst + rates.hst + rates.qst);
    }

    logger.debug('Tax calculated successfully', {
      province: upperProvince,
      type,
      amount: amountDecimal.toNumber(),
      totalTax: totalTaxAmount.toNumber(),
      effectiveRate: effectiveRate.toNumber()
    });

    return {
      taxAmount: totalTaxAmount,
      taxRate: effectiveRate,
      breakdown: {
        gst: gstAmount,
        pst: pstAmount,
        hst: hstAmount,
        qst: qstAmount,
      },
    };
  }
}

export const taxCalculationService = new TaxCalculationService();
