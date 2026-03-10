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
import type { TranslationKeys } from "@/lib/i18n/translations/es";

export interface NavItem {
  title: string;
  href: string;
  icon: any;
  roles: Role[];
}

export function getNavigation(t: TranslationKeys): NavItem[] {
  return [
    {
      title: t.nav.dashboard,
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: [Role.ADMIN, Role.ACCOUNTING, Role.MANAGEMENT, Role.CUSTOMER],
    },
    {
      title: t.nav.invoices,
      href: "/invoices",
      icon: FileText,
      roles: [Role.ADMIN, Role.ACCOUNTING, Role.MANAGEMENT],
    },
    {
      title: t.nav.myInvoices,
      href: "/my-invoices",
      icon: FileText,
      roles: [Role.CUSTOMER],
    },
    {
      title: t.nav.suppliers,
      href: "/suppliers",
      icon: Truck,
      roles: [Role.ADMIN, Role.ACCOUNTING],
    },
    {
      title: t.nav.customers,
      href: "/customers",
      icon: Contact,
      roles: [Role.ADMIN, Role.ACCOUNTING],
    },
    {
      title: t.nav.products,
      href: "/products",
      icon: Package,
      roles: [Role.ADMIN, Role.ACCOUNTING, Role.MANAGEMENT],
    },
    {
      title: t.nav.prices,
      href: "/product-prices",
      icon: DollarSign,
      roles: [Role.ADMIN, Role.ACCOUNTING],
    },
    {
      title: t.nav.users,
      href: "/users",
      icon: Users,
      roles: [Role.ADMIN],
    },
    {
      title: t.nav.reports,
      href: "/reports",
      icon: PieChart,
      roles: [Role.ADMIN, Role.ACCOUNTING, Role.MANAGEMENT],
    },
    {
      title: t.nav.settings,
      href: "/settings",
      icon: Settings,
      roles: [Role.ADMIN, Role.ACCOUNTING, Role.MANAGEMENT, Role.CUSTOMER],
    },
  ];
}
