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
import { useLanguage } from "@/lib/i18n";

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
  const { t } = useLanguage();

  if (isLoading) {
    return <div>{t.products.loadingProducts}</div>;
  }

  if (products.length === 0) {
    return <div className="text-center py-4">{t.products.noProducts}</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.products.name}</TableHead>
            <TableHead>{t.products.nameEs}</TableHead>
            <TableHead>{t.products.category}</TableHead>
            <TableHead>{t.products.unit}</TableHead>
            <TableHead>{t.products.sku}</TableHead>
            <TableHead>{t.products.status}</TableHead>
            <TableHead className="text-right">{t.common.actions}</TableHead>
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
                  <Badge variant="outline" className="bg-hago-primary-50 text-hago-primary-700 border-hago-primary-100">
                    <Check className="w-3 h-3 mr-1" /> {t.common.active}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-hago-error/10 text-hago-error border-hago-error/20">
                    <X className="w-3 h-3 mr-1" /> {t.common.inactive}
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
