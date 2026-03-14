"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductInput } from "@/lib/validation/product";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Product } from "@/lib/api/products";
import { useEffect, useMemo } from "react";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { PRODUCT_CATEGORIES } from "@/lib/validation/product";
import { useLanguage } from "@/lib/i18n/useLanguage";

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductInput) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function ProductForm({
  product,
  onSubmit,
  isLoading,
  onCancel,
}: ProductFormProps) {
  const { t } = useLanguage();
  const tp = t.products;

  // Localized schema
  const formSchema = useMemo(() => {
    return z.object({
      name: z.string().min(1, t.validation.nameRequired).max(255),
      nameEs: z.string().max(255).optional().nullable(),
      description: z.string().optional().nullable(),
      category: z.string().optional().nullable(),
      unit: z.string().min(1, t.validation.fieldRequired),
      sku: z.string().optional().nullable(),
      isActive: z.boolean(),
    });
  }, [t]);

  const PRODUCT_UNITS = [
    { value: "unit", label: tp.units.unit },
    { value: "kg", label: tp.units.kg },
    { value: "lb", label: tp.units.lb },
    { value: "box", label: tp.units.box },
    { value: "pallet", label: tp.units.pallet },
    { value: "bunch", label: tp.units.bunch },
    { value: "bag", label: tp.units.bag },
  ];

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customUnits, setCustomUnits] = useState<{ value: string; label: string }[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [newUnit, setNewUnit] = useState("");
  
  const form = useForm<ProductInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      nameEs: "",
      description: "",
      category: "",
      unit: "unit",
      sku: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        nameEs: product.nameEs || "",
        description: product.description || "",
        category: product.category || "",
        unit: product.unit,
        sku: product.sku || "",
        isActive: product.isActive,
      });
    }
  }, [product, form]);

  const allCategories = [...PRODUCT_CATEGORIES, ...customCategories];
  const allUnits = [...PRODUCT_UNITS, ...customUnits];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tp.name}</FormLabel>
                <FormControl>
                  <Input placeholder={tp.name} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nameEs"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tp.nameEs}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={tp.nameEs}
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tp.description}</FormLabel>
              <FormControl>
                <Input
                  placeholder={tp.description}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{tp.category}</FormLabel>
                <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? tp.categories[field.value as keyof typeof tp.categories] || field.value
                          : tp.selectCategory}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput 
                        placeholder={tp.searchCategory} 
                        onValueChange={(value) => setNewCategory(value)}
                      />
                      <CommandList>
                        <CommandEmpty className="p-2">
                          <p className="text-sm text-muted-foreground mb-2">{tp.notFound}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              if (newCategory) {
                                setCustomCategories([...customCategories, newCategory]);
                                form.setValue("category", newCategory);
                                setCategoryOpen(false);
                              }
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            {t.common.create} &quot;{newCategory}&quot;
                          </Button>
                        </CommandEmpty>
                        <CommandGroup>
                          {allCategories.map((category) => (
                            <CommandItem
                              value={category}
                              key={category}
                              onSelect={() => {
                                form.setValue("category", category);
                                setCategoryOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  category === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {tp.categories[category as keyof typeof tp.categories] || category}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{tp.unit}</FormLabel>
                <Popover open={unitOpen} onOpenChange={setUnitOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? allUnits.find(
                              (unit) => unit.value === field.value
                            )?.label || field.value
                          : tp.selectUnit}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput 
                        placeholder={tp.searchUnit} 
                        onValueChange={(value) => setNewUnit(value)}
                      />
                      <CommandList>
                        <CommandEmpty className="p-2">
                          <p className="text-sm text-muted-foreground mb-2">{tp.notFound}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              if (newUnit) {
                                const unitValue = newUnit.toLowerCase().replace(/\s+/g, '-');
                                setCustomUnits([...customUnits, { value: unitValue, label: newUnit }]);
                                form.setValue("unit", unitValue);
                                setUnitOpen(false);
                              }
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            {t.common.create} &quot;{newUnit}&quot;
                          </Button>
                        </CommandEmpty>
                        <CommandGroup>
                          {allUnits.map((unit) => (
                            <CommandItem
                              value={unit.label}
                              key={unit.value}
                              onSelect={() => {
                                form.setValue("unit", unit.value);
                                setUnitOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  unit.value === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {unit.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tp.sku}</FormLabel>
              <FormControl>
                <Input
                  placeholder={tp.sku}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>{t.common.active}</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              {t.common.cancel}
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t.common.saving : product ? t.common.update : t.common.create}
          </Button>
        </div>
      </form>
    </Form>
  );
}
