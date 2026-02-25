'use client';

import { useEffect, useState } from "react";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { IncomeChart } from "@/components/dashboard/IncomeChart";
import { RecentInvoices } from "@/components/dashboard/RecentInvoices";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/hooks/useAuth";
import { Role } from "@prisma/client";

interface DashboardStatsClient {
  totalInvoiced: number;
  pendingInvoices: number;
  overdueInvoices: number;
  activeCustomers?: number;
  monthlyIncome: { name: string; total: number }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStatsClient | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/v1/dashboard');
        const json = await res.json();
        
        if (json.success) {
          setStats(json.data);
        } else {
          console.error('Failed to load stats:', json.error);
          toast({
            title: "Error",
            description: "No se pudieron cargar las métricas del dashboard.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard:', error);
        toast({
          title: "Error",
          description: "Error de conexión al cargar dashboard.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [toast]);

  const isCustomer = user?.role === Role.CUSTOMER;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-hago-primary-900">Dashboard</h2>
      </div>
      <SummaryCards stats={stats} isLoading={loading} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <IncomeChart data={stats?.monthlyIncome} isLoading={loading} />
        {!isCustomer && <RecentInvoices />}
      </div>
    </div>
  );
}
