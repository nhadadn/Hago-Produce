import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  RefreshCw,
  Key,
  Activity,
  CheckCircle,
  Clock,
  Server,
  AlertTriangle,
  Download,
  Ban
} from 'lucide-react';

interface BotSystemStats {
  totalKeys: number;
  activeKeys: number;
  revokedKeys: number;
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  requestsOverTime: { date: string; count: number }[];
  requestsByStatus: { status: string; count: number }[];
  topKeys: { name: string; requests: number }[];
  range: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const STATUS_COLORS = {
  active: '#10b981', // green-500
  revoked: '#ef4444', // red-500
};

export default function BotStatsDashboard() {
  const [stats, setStats] = useState<BotSystemStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [timeRange, setTimeRange] = useState<string>('30d');

  const fetchStats = useCallback(async () => {
    setLoading(true); // Show loading state on manual refresh or range change
    setError(null);
    try {
      const response = await fetch(`/api/bot/keys/stats?range=${timeRange}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudieron cargar las estadísticas`);
      }
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(result.error?.message || 'Error desconocido');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // Initial fetch and polling
  useEffect(() => {
    fetchStats();

    const intervalId = setInterval(() => {
      // Silent refresh (don't set loading state to true for background updates)
      const silentRefresh = async () => {
        try {
          const response = await fetch(`/api/bot/keys/stats?range=${timeRange}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              setStats(result.data);
              setLastUpdated(new Date());
            }
          }
        } catch (e) {
          console.error("Background refresh failed", e);
        }
      };
      silentRefresh();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(intervalId);
  }, [fetchStats, timeRange]);

  const exportToCSV = () => {
    if (!stats) return;

    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Keys', stats.totalKeys],
      ['Active Keys', stats.activeKeys],
      ['Revoked Keys', stats.revokedKeys],
      ['Total Requests', stats.totalRequests],
      ['Success Rate', `${stats.successRate}%`],
      ['Avg Response Time', `${stats.avgResponseTime}ms`],
      ['Range', timeRange],
      ['Generated At', new Date().toISOString()],
    ];

    // Add Top Keys section
    rows.push(['', '']);
    rows.push(['--- Top Keys ---', '']);
    stats.topKeys.forEach(k => rows.push([k.name, k.requests]));

    // Add Requests by Status
    rows.push(['', '']);
    rows.push(['--- Requests by Status ---', '']);
    stats.requestsByStatus.forEach(s => rows.push([s.status, s.count]));

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bot_stats_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-MX').format(num);
  };

  const formatPercent = (num: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(num / 100);
  };

  // Prepare Pie Chart Data
  const keyStatusData = stats ? [
    { name: 'Activas', value: stats.activeKeys, color: STATUS_COLORS.active },
    { name: 'Revocadas', value: stats.revokedKeys, color: STATUS_COLORS.revoked },
  ].filter(d => d.value > 0) : [];

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Cargando estadísticas del bot...</p>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 text-destructive">
        <AlertTriangle className="h-12 w-12" />
        <p className="text-lg font-medium">Error al cargar datos</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={fetchStats} variant="outline">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Panel de Control de Bots</h2>
          <p className="text-muted-foreground">
            Monitoreo en tiempo real de claves API y rendimiento del sistema.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Últimas 24 Horas</SelectItem>
              <SelectItem value="7d">Últimos 7 Días</SelectItem>
              <SelectItem value="30d">Últimos 30 Días</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchStats}
            disabled={loading}
            title="Actualizar ahora"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      {lastUpdated && (
        <div className="text-xs text-right text-muted-foreground">
            Actualizado: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claves</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats ? formatNumber(stats.totalKeys) : '-'}</div>
            <p className="text-xs text-muted-foreground">Registradas en sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Claves Activas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats ? formatNumber(stats.activeKeys) : '-'}</div>
            <p className="text-xs text-muted-foreground">En uso actualmente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitudes</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats ? formatNumber(stats.totalRequests) : '-'}</div>
            <p className="text-xs text-muted-foreground">En el periodo seleccionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats ? formatPercent(stats.successRate) : '-'}</div>
            <p className="text-xs text-muted-foreground">Solicitudes completadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats ? `${Math.round(stats.avgResponseTime)}ms` : '-'}</div>
            <p className="text-xs text-muted-foreground">Latencia estimada</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Requests Over Time - Line Chart */}
        <Card className="col-span-4 lg:col-span-4">
          <CardHeader>
            <CardTitle>Solicitudes ({timeRange})</CardTitle>
            <CardDescription>Volumen de peticiones en el tiempo</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.requestsOverTime || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}`} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    name="Solicitudes"
                    stroke="#2563eb" 
                    strokeWidth={2} 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Requests by Status - Bar Chart */}
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>Códigos de Respuesta HTTP</CardTitle>
            <CardDescription>Distribución de códigos de estado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.requestsByStatus || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="status" 
                    type="category" 
                    width={40}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="count" name="Cantidad" radius={[0, 4, 4, 0]}>
                    {(stats?.requestsByStatus || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Key Status Distribution - Pie Chart */}
        <Card className="col-span-4 lg:col-span-3">
            <CardHeader>
                <CardTitle>Estado de Claves</CardTitle>
                <CardDescription>Proporción de claves activas vs revocadas</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={keyStatusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {keyStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

        {/* Top Keys - Bar Chart */}
        <Card className="col-span-4 lg:col-span-4">
          <CardHeader>
            <CardTitle>Top 5 Claves API Más Usadas</CardTitle>
            <CardDescription>Claves con mayor volumen de peticiones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.topKeys || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip 
                     contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="requests" name="Solicitudes" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
