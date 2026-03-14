'use client';

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
import { es, enUS, fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n/useLanguage";

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
  const { t, language } = useLanguage();
  const tp = t.prices;
  
  const locales = { es, en: enUS, fr };
  const currentLocale = locales[language];
  const currencyLocale = language === 'en' ? 'en-US' : language === 'es' ? 'es-MX' : 'fr-FR';

  if (isLoading) {
    return (
      <div className="w-full flex justify-center p-8">
        {tp.loadingPrices}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tp.product}</TableHead>
            <TableHead>{tp.supplier}</TableHead>
            <TableHead>{tp.costPrice}</TableHead>
            <TableHead>{tp.sellPrice}</TableHead>
            <TableHead>{tp.effectiveDate}</TableHead>
            <TableHead>{t.common.status}</TableHead>
            {canEdit && <TableHead className="text-right">{t.common.actions}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {prices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canEdit ? 7 : 6} className="h-24 text-center">
                {tp.noRegistered}
              </TableCell>
            </TableRow>
          ) : (
            prices.map((price) => (
              <TableRow key={price.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{price.product?.name || t.common.notAvailable}</span>
                    <span className="text-xs text-muted-foreground">{price.product?.sku}</span>
                  </div>
                </TableCell>
                <TableCell>{price.supplier?.name || t.common.notAvailable}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat(currencyLocale, {
                    style: "currency",
                    currency: price.currency,
                  }).format(price.costPrice)}
                </TableCell>
                <TableCell>
                  {price.sellPrice
                    ? new Intl.NumberFormat(currencyLocale, {
                        style: "currency",
                        currency: price.currency,
                      }).format(price.sellPrice)
                    : "-"}
                </TableCell>
                <TableCell>
                  {price.effectiveDate
                    ? format(new Date(price.effectiveDate), "PP", { locale: currentLocale })
                    : "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={price.isCurrent ? "default" : "secondary"}>
                    {price.isCurrent ? tp.badgeCurrent : tp.badgeHistoric}
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
