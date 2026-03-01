'use client';
import { useState, useEffect } from 'react';
import { clientLogger as logger } from '@/lib/logger/client-logger';

export interface DashboardData {
  summary: {
    totalRevenue: number;
    pendingBalance: number;
    overdueCount: number;
    totalInvoices: number;
    revenueGrowth: number; // Porcentaje vs mes anterior
  };
  revenueHistory: { month: string; revenue: number }[];
  statusDistribution: { status: string; count: number }[];
}

export function useCustomerDashboardData(customerId?: string) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Si no hay customerId (ej. admin view), usar mock o esperar
    // Para demo MVP usaremos datos mockeados si no hay API real conectada aún
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Simulación de API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // MOCK DATA - Reemplazar con fetch real a /api/v1/reports/revenue
        // TODO: Conectar con endpoint real cuando esté listo en S4-P04
        const mockData: DashboardData = {
          summary: {
            totalRevenue: 125430.50,
            pendingBalance: 4520.00,
            overdueCount: 2,
            totalInvoices: 145,
            revenueGrowth: 12.5,
          },
          revenueHistory: [
            { month: 'Sep', revenue: 15000 },
            { month: 'Oct', revenue: 18500 },
            { month: 'Nov', revenue: 12000 },
            { month: 'Dic', revenue: 22000 },
            { month: 'Ene', revenue: 28000 },
            { month: 'Feb', revenue: 29930 },
          ],
          statusDistribution: [
            { status: 'PAID', count: 85 },
            { status: 'SENT', count: 15 },
            { status: 'OVERDUE', count: 2 },
            { status: 'DRAFT', count: 5 },
          ]
        };

        setData(mockData);
        setError(null);
      } catch (err) {
        logger.error('Error fetching dashboard data:', err);
        setError('No se pudieron cargar los datos del dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [customerId]);

  return { data, loading, error };
}
