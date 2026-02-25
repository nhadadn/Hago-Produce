'use client';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from './ChartWrapper';

ChartJS.register(ArcElement, Tooltip, Legend);

interface InvoiceStatusDoughnutProps {
  data: { status: string; count: number }[];
}

export function InvoiceStatusDoughnut({ data }: InvoiceStatusDoughnutProps) {
  // Mapeo de colores según Design System
  const statusColors: Record<string, string> = {
    PAID: '#2E7D32',    // hago-primary-800
    SENT: '#2196F3',    // hago-info
    OVERDUE: '#F44336', // hago-error
    DRAFT: '#BDBDBD',   // hago-gray-400
    PENDING: '#FF9800', // hago-warning
    VOID: '#616161',    // hago-gray-700
  };

  const labels = data.map(d => d.status);
  const counts = data.map(d => d.count);
  const backgroundColors = data.map(d => statusColors[d.status] || '#9E9E9E');

  const chartData = {
    labels,
    datasets: [
      {
        data: counts,
        backgroundColor: backgroundColors,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: { size: 12 },
          color: '#424242', // hago-gray-800
        },
      },
      tooltip: {
        backgroundColor: '#424242',
        padding: 12,
        callbacks: {
          label: (ctx: any) => ` ${ctx.label}: ${ctx.raw} facturas`,
        },
      },
    },
    cutout: '70%', // Donut thickness
  };

  // @ts-ignore
  return <Doughnut data={chartData} options={options} />;
}
