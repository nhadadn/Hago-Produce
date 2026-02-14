"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { ProductPricesTable } from "@/components/product-prices/ProductPricesTable";
import { ProductPriceModal } from "@/components/product-prices/ProductPriceModal";
import { ProductPricesBulkUpdateModal } from "@/components/product-prices/ProductPricesBulkUpdateModal";
import {
  fetchProductPrices,
  createProductPrice,
  updateProductPrice,
  deleteProductPrice,
  ProductPrice,
} from "@/lib/api/product-prices";
import { ProductPriceInput } from "@/lib/validation/product-price";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchProducts } from "@/lib/api/products";
import { fetchSuppliers } from "@/lib/api/suppliers";
import { useAuth } from "@/lib/hooks/useAuth";

export default function ProductPricesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<ProductPrice | undefined>(undefined);
  
  const [filterProduct, setFilterProduct] = useState<string>("all");
  const [filterSupplier, setFilterSupplier] = useState<string>("all");
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const canEdit = user?.role === "ADMIN" || user?.role === "ACCOUNTING";

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [p, s] = await Promise.all([
          fetchProducts({ limit: 100, isActive: true }),
          fetchSuppliers({ limit: 100, isActive: true })
        ]);
        setProducts(p.data);
        setSuppliers(s.data);
      } catch (error) {
        console.error("Error loading filters", error);
      }
    };
    loadFilters();
  }, []);

  const loadPrices = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchProductPrices({ 
        limit: 100,
        productId: filterProduct !== "all" ? filterProduct : undefined,
        supplierId: filterSupplier !== "all" ? filterSupplier : undefined,
      });
      setPrices(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los precios",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, filterProduct, filterSupplier]);

  useEffect(() => {
    loadPrices();
  }, [loadPrices]);

  const handleCreate = () => {
    if (!canEdit) return;
    setSelectedPrice(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (price: ProductPrice) => {
    if (!canEdit) return;
    setSelectedPrice(price);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!canEdit) return;
    if (!confirm("¿Estás seguro de que quieres eliminar este precio?")) return;

    try {
      await deleteProductPrice(id);
      toast({
        title: "Éxito",
        description: "Precio eliminado correctamente",
      });
      loadPrices();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el precio",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (data: ProductPriceInput) => {
    try {
      if (selectedPrice) {
        await updateProductPrice(selectedPrice.id, data);
        toast({
          title: "Éxito",
          description: "Precio actualizado correctamente",
        });
      } else {
        await createProductPrice(data);
        toast({
          title: "Éxito",
          description: "Precio creado correctamente",
        });
      }
      loadPrices();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el precio",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Precios</h1>
          <p className="text-muted-foreground">
            Gestión de precios por producto y proveedor
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button onClick={() => setIsBulkModalOpen(true)} variant="outline">
              <Upload className="mr-2 h-4 w-4" /> Importar Masivo
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Precio
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Select value={filterProduct} onValueChange={setFilterProduct}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por Producto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los productos</SelectItem>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterSupplier} onValueChange={setFilterSupplier}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por Proveedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los proveedores</SelectItem>
            {suppliers.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ProductPricesTable
        prices={prices}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        canEdit={canEdit}
      />

      <ProductPriceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={selectedPrice}
      />

      <ProductPricesBulkUpdateModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={loadPrices}
      />
    </div>
  );
}
