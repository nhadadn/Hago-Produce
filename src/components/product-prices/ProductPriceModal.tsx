'use client';

import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductPrice } from "@/lib/api/product-prices";
import { fetchProducts } from "@/lib/api/products";
import { fetchSuppliers } from "@/lib/api/suppliers";
import { clientLogger as logger } from "@/lib/logger/client-logger";

interface ProductPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: ProductPrice;
}

export function ProductPriceModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: ProductPriceModalProps) {
  const { t } = useLanguage();
  const tp = t.prices;
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Localized schema
  const formSchema = useMemo(() => {
    return z.object({
      id: z.string().uuid().optional(),
      productId: z
        .string()
        .min(1, t.validation.fieldRequired)
        .uuid({ message: t.validation.invalidUuid }),
      supplierId: z
        .string()
        .min(1, t.validation.fieldRequired)
        .uuid({ message: t.validation.invalidUuid }),
      costPrice: z.number().min(0, { message: t.validation.valueNonNegative }),
      sellPrice: z.number().min(0, { message: t.validation.valueNonNegative }).optional(),
      currency: z.string().default('USD'),
      effectiveDate: z.coerce.date(),
      isCurrent: z.boolean().default(true),
      source: z.string().optional().default('manual'),
    });
  }, [t]);

  type FormInput = z.input<typeof formSchema>;
  type FormOutput = z.output<typeof formSchema>;

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: "",
      supplierId: "",
      costPrice: 0,
      sellPrice: 0,
      currency: "USD",
      isCurrent: true,
      source: "manual",
      effectiveDate: new Date(),
    },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsRes, suppliersRes] = await Promise.all([
          fetchProducts({ limit: 1000 }),
          fetchSuppliers({ limit: 1000 }),
        ]);
        setProducts(productsRes.data);
        setSuppliers(suppliersRes.data);
      } catch (error) {
        logger.error("Error loading products/suppliers", error);
      }
    };
    if (isOpen) loadData();
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      form.reset({
        productId: initialData.productId,
        supplierId: initialData.supplierId,
        costPrice: Number(initialData.costPrice),
        sellPrice: initialData.sellPrice ? Number(initialData.sellPrice) : undefined,
        currency: initialData.currency,
        isCurrent: initialData.isCurrent,
        source: initialData.source,
        effectiveDate: new Date(initialData.effectiveDate),
      });
    } else {
      form.reset({
        productId: "",
        supplierId: "",
        costPrice: 0,
        sellPrice: 0,
        currency: "USD",
        isCurrent: true,
        source: "manual",
        effectiveDate: new Date(),
      });
    }
  }, [initialData, form, isOpen]);

  const handleSubmit = async (values: FormOutput) => {
    setIsLoading(true);
    try {
      await onSubmit(values);
      onClose();
    } catch (error) {
      logger.error('Error submitting product price', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? tp.editPrice : tp.newPrice}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tp.product}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                    disabled={!!initialData}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={tp.selectProduct} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tp.supplier}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                    disabled={!!initialData}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={tp.selectSupplier} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tp.costPrice}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sellPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tp.sellPriceOptional}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tp.currency}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={tp.currency} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                        <SelectItem value="MXN">MXN</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="effectiveDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tp.effectiveDate}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(new Date(e.target.valueAsNumber))} // handle date input correctly
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isCurrent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>{tp.currentPriceLabel}</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {t.common.cancel}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t.common.saving : t.common.save}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
