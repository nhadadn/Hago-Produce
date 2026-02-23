"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Product } from "@/lib/api/products";
import { Edit, Trash, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProductsTableProps {
  products: Product[];
  isLoading: boolean;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  userRole: string;
}

export function ProductsTable({
  products,
  isLoading,
  onEdit,
  onDelete,
  userRole,
}: ProductsTableProps) {
  if (isLoading) {
    return <div>Cargando productos...</div>;
  }

  if (products.length === 0) {
    return <div className="text-center py-4">No se encontraron productos.</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Nombre (ES)</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Unidad</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.nameEs || "-"}</TableCell>
              <TableCell>{product.category || "-"}</TableCell>
              <TableCell>{product.unit}</TableCell>
              <TableCell>{product.sku || "-"}</TableCell>
              <TableCell>
                {product.isActive ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Check className="w-3 h-3 mr-1" /> Activo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <X className="w-3 h-3 mr-1" /> Inactivo
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(product)}
                    disabled={userRole === 'MANAGEMENT' && false /* Management can edit? Task says: Permisos admin, accounting, management. Assuming all can read, but maybe write restricted? */}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {userRole === 'ADMIN' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(product.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
