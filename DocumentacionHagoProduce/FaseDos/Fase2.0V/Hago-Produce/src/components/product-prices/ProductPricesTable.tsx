import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { ProductPrice } from "@/lib/api/product-prices";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface ProductPricesTableProps {
  prices: ProductPrice[];
  onEdit: (price: ProductPrice) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
  canEdit?: boolean;
}

export function ProductPricesTable({
  prices,
  onEdit,
  onDelete,
  isLoading,
  canEdit = false,
}: ProductPricesTableProps) {
  if (isLoading) {
    return (
      <div className="w-full flex justify-center p-8">
        Cargando precios...
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Costo</TableHead>
            <TableHead>Venta</TableHead>
            <TableHead>Fecha Efectiva</TableHead>
            <TableHead>Estado</TableHead>
            {canEdit && <TableHead className="text-right">Acciones</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {prices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canEdit ? 7 : 6} className="h-24 text-center">
                No hay precios registrados.
              </TableCell>
            </TableRow>
          ) : (
            prices.map((price) => (
              <TableRow key={price.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{price.product?.name || "N/A"}</span>
                    <span className="text-xs text-muted-foreground">{price.product?.sku}</span>
                  </div>
                </TableCell>
                <TableCell>{price.supplier?.name || "N/A"}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: price.currency,
                  }).format(price.costPrice)}
                </TableCell>
                <TableCell>
                  {price.sellPrice
                    ? new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: price.currency,
                      }).format(price.sellPrice)
                    : "-"}
                </TableCell>
                <TableCell>{price.effectiveDate ? format(new Date(price.effectiveDate), "PP") : "-"}</TableCell>
                <TableCell>
                  <Badge variant={price.isCurrent ? "default" : "secondary"}>
                    {price.isCurrent ? "Actual" : "Histórico"}
                  </Badge>
                </TableCell>
                {canEdit && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(price)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(price.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
