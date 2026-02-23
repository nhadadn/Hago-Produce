"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, ProductInput } from "@/lib/validation/product";
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
import { useEffect } from "react";
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

// Common units
const PRODUCT_UNITS = [
  { value: "unit", label: "Unidad" },
  { value: "kg", label: "Kilogramo" },
  { value: "lb", label: "Libra" },
  { value: "box", label: "Caja" },
  { value: "pallet", label: "Pallet" },
  { value: "bunch", label: "Manojo" },
  { value: "bag", label: "Bolsa" },
] as const;

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
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customUnits, setCustomUnits] = useState<{ value: string; label: string }[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [newUnit, setNewUnit] = useState("");
  
  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
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
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del producto" {...field} />
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
                <FormLabel>Nombre (Español)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nombre en español"
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
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input
                  placeholder="Descripción"
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
                <FormLabel>Categoría</FormLabel>
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
                          ? allCategories.find(
                              (category) => category === field.value
                            ) || field.value
                          : "Seleccionar categoría"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Buscar categoría..." 
                        onValueChange={(value) => setNewCategory(value)}
                      />
                      <CommandList>
                        <CommandEmpty className="p-2">
                          <p className="text-sm text-muted-foreground mb-2">No encontrada.</p>
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
                            Crear "{newCategory}"
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
                              {category}
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
                <FormLabel>Unidad</FormLabel>
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
                          : "Seleccionar unidad"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Buscar unidad..." 
                        onValueChange={(value) => setNewUnit(value)}
                      />
                      <CommandList>
                        <CommandEmpty className="p-2">
                          <p className="text-sm text-muted-foreground mb-2">No encontrada.</p>
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
                            Crear "{newUnit}"
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
              <FormLabel>SKU</FormLabel>
              <FormControl>
                <Input
                  placeholder="SKU"
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
                <FormLabel>Activo</FormLabel>
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
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : product ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
