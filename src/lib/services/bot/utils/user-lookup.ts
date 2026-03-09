 
import prisma from '@/lib/db';
import { logger } from '@/lib/logger/logger.service';

/**
 * Finds a system User based on a WhatsApp phone number.
 * Strategy:
 * 1. Normalize phone number (remove +, spaces, etc.)
 * 2. Find Customer with this phone number.
 * 3. If Customer found, find a User associated with this Customer.
 * 4. If multiple Users, return the first one (or preferably an ADMIN/MANAGEMENT role if available).
 */
export async function findUserByWhatsAppNumber(phoneNumber: string): Promise<{ userId: string; customerId: string } | null> {
  try {
    // 1. Normalize phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    // Common OR conditions for phone lookup
    const orConditions: any[] = [
      { phone: { contains: cleanPhone } },
      { phone: phoneNumber },
    ];

    // Mexico +521 normalization: if number is +521XXXXXXXXXX, also try +52XXXXXXXXXX (without the 1)
    // cleanPhone starts with 521 and has 13 digits (52 + 1 + 10 digits)
    if (cleanPhone.startsWith('521') && cleanPhone.length === 13) {
      const mexicoAlt = '52' + cleanPhone.substring(3);
      orConditions.push({ phone: { contains: mexicoAlt } });
      // Also try with + prefix just in case
      orConditions.push({ phone: { contains: '+' + mexicoAlt } });
    }
    
    // STRATEGY 1: Find User directly (Staff or Customer with direct phone link)
    // We search for users where phone matches the clean phone or the full phone
    const staffUser = await prisma.user.findFirst({
      where: {
        OR: orConditions,
        isActive: true,
      }
    });

    if (staffUser) {
      return {
        userId: staffUser.id,
        customerId: staffUser.customerId || '', // Staff might not have customerId
      };
    }

    // STRATEGY 2: Find Customer, then linked User (External Customer)
    // We search for customers where phone contains the clean phone or equals it.
    const customer = await prisma.customer.findFirst({
      where: {
        OR: orConditions
      }
    });

    if (!customer) {
      logger.warn(`[UserLookup] No customer found for phone: ${phoneNumber}`);
      return null;
    }

    // 3. Find User linked to Customer
    const user = await prisma.user.findFirst({
      where: {
        customerId: customer.id,
        isActive: true,
      },
      orderBy: {
        createdAt: 'asc',
      }
    });

    if (!user) {
      logger.warn(`[UserLookup] Customer found (${customer.id}) but no active user linked.`);
      return null;
    }

    return {
      userId: user.id,
      customerId: customer.id,
    };

  } catch (error) {
    logger.error('[UserLookup] Error finding user by phone', error);
    return null;
  }
}
