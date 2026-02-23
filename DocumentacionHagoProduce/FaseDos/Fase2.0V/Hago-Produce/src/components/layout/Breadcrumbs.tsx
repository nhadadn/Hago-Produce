"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const routeNameMap: Record<string, string> = {
  dashboard: "Dashboard",
  invoices: "Facturas",
  suppliers: "Proveedores",
  products: "Productos",
  "product-prices": "Precios",
  users: "Usuarios",
  customers: "Clientes",
  settings: "Configuración",
  new: "Nuevo",
  edit: "Editar",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center text-sm text-muted-foreground">
      <Link
        href="/dashboard"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Dashboard</span>
      </Link>
      {segments.map((segment, index) => {
        const path = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;
        
        // Try to get a friendly name, fallback to segment
        let name = routeNameMap[segment] || segment;
        
        // If it looks like a UUID, replace with "Detalle" or shorten it
        if (segment.match(/^[0-9a-fA-F-]{36}$/)) {
            name = "Detalle";
        }

        return (
          <div key={path} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1" />
            {isLast ? (
              <span className="font-medium text-foreground">{name}</span>
            ) : (
              <Link
                href={path}
                className="hover:text-foreground transition-colors"
              >
                {name}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
