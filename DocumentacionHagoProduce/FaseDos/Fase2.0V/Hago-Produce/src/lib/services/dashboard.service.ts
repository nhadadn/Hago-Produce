import prisma from '@/lib/db';
import { InvoiceStatus } from '@prisma/client';

export interface DashboardStats {
  totalInvoiced: number;
  pendingInvoices: number;
  overdueInvoices: number;
  activeCustomers?: number; // Only for admin
  monthlyIncome: { name: string; total: number }[];
}

export class DashboardService {
  async getStats(customerId?: string): Promise<DashboardStats> {
    const whereClause = customerId ? { customerId } : {};

    // 1. Total Invoiced (All time or current year? Let's do all time for now)
    const totalInvoicedAgg = await prisma.invoice.aggregate({
      where: {
        ...whereClause,
        status: { not: InvoiceStatus.DRAFT } // Exclude drafts
      },
      _sum: {
        total: true
      }
    });

    // 2. Pending Invoices
    const pendingCount = await prisma.invoice.count({
      where: {
        ...whereClause,
        status: { in: [InvoiceStatus.SENT, InvoiceStatus.PENDING] }
      }
    });

    // 3. Overdue Invoices
    const overdueCount = await prisma.invoice.count({
      where: {
        ...whereClause,
        status: InvoiceStatus.OVERDUE
      }
    });

    // 4. Active Customers (Admin only)
    let activeCustomers = 0;
    if (!customerId) {
      activeCustomers = await prisma.customer.count({
        where: { isActive: true }
      });
    }

    // 5. Monthly Income (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const invoices = await prisma.invoice.findMany({
      where: {
        ...whereClause,
        status: { not: InvoiceStatus.DRAFT },
        issueDate: { gte: sixMonthsAgo }
      },
      select: {
        issueDate: true,
        total: true
      },
      orderBy: { issueDate: 'asc' }
    });

    // Group by Month
    const incomeMap = new Map<string, number>();
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    invoices.forEach(inv => {
      const date = new Date(inv.issueDate);
      const monthName = months[date.getMonth()];
      const current = incomeMap.get(monthName) || 0;
      incomeMap.set(monthName, current + Number(inv.total));
    });

    const monthlyIncome = Array.from(incomeMap.entries()).map(([name, total]) => ({
      name,
      total
    }));

    return {
      totalInvoiced: Number(totalInvoicedAgg._sum.total || 0),
      pendingInvoices: pendingCount,
      overdueInvoices: overdueCount,
      activeCustomers: customerId ? undefined : activeCustomers,
      monthlyIncome
    };
  }
}

export const dashboardService = new DashboardService();
