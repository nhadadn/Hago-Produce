'use client';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface InvoiceStatusDoughnutInnerProps {
  data: { status: string; count: number }[];
}

// Color mapping matches original Design System colors
const STATUS_COLORS: Record<string, string> = {
  PAID: '#2E7D32',    // hago-primary-800
  SENT: '#2196F3',    // hago-info
  OVERDUE: '#F44336', // hago-error
  DRAFT: '#BDBDBD',   // hago-gray-400
  PENDING: '#FF9800', // hago-warning
  VOID: '#616161',    // hago-gray-700
};

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const { name, value } = payload[0];
    return (
      <div
        style={{
          backgroundColor: '#424242',
          color: '#FFFFFF',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '13px',
        }}
      >
        <p style={{ margin: 0 }}>
          {name}: {value} facturas
        </p>
      </div>
    );
  }
  return null;
}

function CustomLegend({ payload }: any) {
  if (!payload) return null;
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {payload.map((entry: any, index: number) => (
        <li
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '10px',
            fontSize: '12px',
            color: '#424242',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: entry.color,
              marginRight: '8px',
              flexShrink: 0,
            }}
          />
          {entry.value}
        </li>
      ))}
    </ul>
  );
}

export function InvoiceStatusDoughnutInner({ data }: InvoiceStatusDoughnutInnerProps) {
  const chartData = data.map(d => ({
    name: d.status,
    value: d.count,
    fill: STATUS_COLORS[d.status] || '#9E9E9E',
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="40%"
          cy="50%"
          innerRadius="55%"
          outerRadius="75%"
          paddingAngle={2}
          dataKey="value"
          stroke="#FFFFFF"
          strokeWidth={2}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          content={<CustomLegend />}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
