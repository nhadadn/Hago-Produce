'use client';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from './ChartWrapper';

// Registrar componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface RevenueBarChartProps {
  data: { month: string; revenue: number }[];
}

export function RevenueBarChart({ data }: RevenueBarChartProps) {
  const chartData = {
    labels: data.map(d => d.month),
    datasets: [{
      label: 'Facturación',
      data: data.map(d => d.revenue),
      backgroundColor: '#2E7D32',  // hago-primary-800
      borderColor: '#1B5E20',       // hago-primary-900
      borderWidth: 1,
      borderRadius: 6,
      hoverBackgroundColor: '#388E3C', // hago-primary-700
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1B5E20',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        callbacks: {
          label: (ctx: any) => ` $${ctx.raw.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        },
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { 
          callback: (v: any) => `$${(v/1000).toFixed(0)}k`,
          color: '#757575', // hago-gray-600
          font: { size: 11 }
        },
        grid: { 
          color: '#E0E0E0',  // hago-gray-300
          drawBorder: false,
        },
        border: { display: false }
      },
      x: { 
        grid: { display: false },
        ticks: {
          color: '#424242', // hago-gray-800
          font: { size: 12, weight: '500' }
        },
        border: { display: false }
      },
    },
    layout: {
      padding: 10
    }
  };

  // @ts-ignore - Chart.js types compatibility
  return <Bar data={chartData} options={options} />;
}
