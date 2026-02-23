import React from 'react';
import { 
  FileText, 
  Users, 
  BarChart, 
  Plus, 
  Search, 
  HelpCircle, 
  DollarSign, 
  Truck, 
  Settings 
} from 'lucide-react';
import { Suggestion } from '@/components/chat/QuickSuggestions';

export const getSuggestionsForRoute = (pathname: string): Suggestion[] => {
  const suggestions: Suggestion[] = [];

  // Common/Global suggestions
  const helpSuggestion = { 
    label: 'Ayuda', 
    action: '¿Qué puedes hacer?', 
    icon: <HelpCircle className="w-3 h-3" /> 
  };

  // Dashboard
  if (pathname === '/' || pathname === '/dashboard') {
    suggestions.push(
      { label: 'Reporte Ventas', action: 'Muéstrame el reporte de ventas de hoy', icon: <BarChart className="w-3 h-3" /> },
      { label: 'Crear Factura', action: 'Quiero crear una nueva factura', icon: <Plus className="w-3 h-3" /> },
      { label: 'Clientes Activos', action: 'Listar clientes activos', icon: <Users className="w-3 h-3" /> }
    );
  }
  // Invoices
  else if (pathname.includes('/invoices') || pathname.includes('/facturas')) {
    suggestions.push(
      { label: 'Nueva Factura', action: 'Crear nueva factura', icon: <Plus className="w-3 h-3" /> },
      { label: 'Pendientes', action: 'Ver facturas pendientes de pago', icon: <FileText className="w-3 h-3" /> },
      { label: 'Exportar', action: 'Exportar lista de facturas a CSV', icon: <FileText className="w-3 h-3" /> }
    );
  }
  // Customers
  else if (pathname.includes('/customers') || pathname.includes('/clientes')) {
    suggestions.push(
      { label: 'Buscar Cliente', action: 'Buscar información de un cliente', icon: <Search className="w-3 h-3" /> },
      { label: 'Nuevo Cliente', action: 'Registrar nuevo cliente', icon: <Plus className="w-3 h-3" /> },
      { label: 'Saldos', action: 'Ver saldos de clientes', icon: <DollarSign className="w-3 h-3" /> }
    );
  }
  // Products/Inventory
  else if (pathname.includes('/products') || pathname.includes('/inventory')) {
    suggestions.push(
      { label: 'Consultar Precio', action: 'Consultar precio de producto', icon: <DollarSign className="w-3 h-3" /> },
      { label: 'Stock Bajo', action: 'Ver productos con stock bajo', icon: <BarChart className="w-3 h-3" /> },
      { label: 'Proveedores', action: 'Ver mejores proveedores', icon: <Truck className="w-3 h-3" /> }
    );
  }
  // Admin/Settings
  else if (pathname.includes('/admin') || pathname.includes('/settings')) {
    suggestions.push(
      { label: 'Usuarios', action: 'Gestionar usuarios', icon: <Users className="w-3 h-3" /> },
      { label: 'API Keys', action: 'Administrar API Keys', icon: <Settings className="w-3 h-3" /> },
      { label: 'Logs', action: 'Ver logs del sistema', icon: <FileText className="w-3 h-3" /> }
    );
  }

  // Add help at the end if not present
  if (!suggestions.some(s => s.label === 'Ayuda')) {
    suggestions.push(helpSuggestion);
  }

  return suggestions.slice(0, 5); // Limit to 5 suggestions
};
