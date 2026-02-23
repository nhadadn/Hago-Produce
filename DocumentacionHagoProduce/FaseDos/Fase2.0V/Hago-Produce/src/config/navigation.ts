import {
  LayoutDashboard,
  Users,
  Truck,
  FileText,
  Settings,
  Package,
  DollarSign,
  Contact,
  PieChart
} from "lucide-react";
import { Role } from "@prisma/client";

export interface NavItem {
  title: string;
  href: string;
  icon: any;
  roles: Role[];
}

export const navigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: [Role.ADMIN, Role.ACCOUNTING, Role.MANAGEMENT, Role.CUSTOMER],
  },
  {
    title: "Facturas",
    href: "/invoices",
    icon: FileText,
    roles: [Role.ADMIN, Role.ACCOUNTING, Role.MANAGEMENT],
  },
  {
    title: "Mis Facturas",
    href: "/my-invoices",
    icon: FileText,
    roles: [Role.CUSTOMER],
  },
  {
    title: "Proveedores",
    href: "/suppliers",
    icon: Truck,
    roles: [Role.ADMIN, Role.ACCOUNTING],
  },
  {
    title: "Clientes",
    href: "/customers",
    icon: Contact,
    roles: [Role.ADMIN, Role.ACCOUNTING],
  },
  {
    title: "Productos",
    href: "/products",
    icon: Package,
    roles: [Role.ADMIN, Role.ACCOUNTING, Role.MANAGEMENT],
  },
  {
    title: "Precios",
    href: "/product-prices",
    icon: DollarSign,
    roles: [Role.ADMIN, Role.ACCOUNTING],
  },
  {
    title: "Usuarios",
    href: "/users",
    icon: Users,
    roles: [Role.ADMIN],
  },
  {
    title: "Reportes",
    href: "/reports",
    icon: PieChart,
    roles: [Role.ADMIN, Role.ACCOUNTING, Role.MANAGEMENT],
  },
  {
    title: "Configuración",
    href: "/settings",
    icon: Settings,
    roles: [Role.ADMIN, Role.ACCOUNTING, Role.MANAGEMENT, Role.CUSTOMER],
  },
];
