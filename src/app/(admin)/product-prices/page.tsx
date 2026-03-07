"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import { clientLogger as logger } from "@/lib/logger/client-logger";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Suspense } from "react";

function ProductPricesContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<ProductPrice | undefined>(undefined);
  
  const [filterProduct, setFilterProduct] = useState<string>("all");
  const [filterSupplier, setFilterSupplier] = useState<string>("all");
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(50);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const canEdit = user?.role === "ADMIN" || user?.role === "ACCOUNTING";

  useEffect(() => {
    const p = Number(searchParams.get("page")) || 1;
    const l = Number(searchParams.get("limit")) || 50;
    setPage(p);
    setLimit(l);
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    params.set("limit", String(limit));
    const next = `${pathname}?${params.toString()}`;
    router.replace(next, { scroll: false });
  }, [page, limit, pathname, router]); // eslint-disable-line react-hooks/exhaustive-deps

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
        logger.error("Error loading filters", error);
      }
    };
    loadFilters();
  }, []);

  const loadPrices = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchProductPrices({ 
        page,
        limit,
        productId: filterProduct !== "all" ? filterProduct : undefined,
        supplierId: filterSupplier !== "all" ? filterSupplier : undefined,
      });
      setPrices(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages || 1);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los precios",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, filterProduct, filterSupplier, page, limit]);

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

  const paginationRange = useMemo<(number | string)[]>(() => {
    const pages: (number | string)[] = [];
    const tp = Math.max(totalPages, 1);
    if (tp <= 7) {
      for (let i = 1; i <= tp; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    const left = Math.max(2, page - 1);
    const right = Math.min(tp - 1, page + 1);
    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < tp - 1) pages.push("...");
    pages.push(tp);
    return pages;
  }, [page, totalPages]);

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = Number(e.target.value);
    setLimit(newLimit);
    setPage(1);
  };

  const handlePrev = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const renderSkeleton = () => {
    const rows = Array.from({ length: 8 });
    const cols = canEdit ? 7 : 6;
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
            {rows.map((_, idx) => (
              <TableRow key={idx}>
                {Array.from({ length: cols }).map((__, cidx) => (
                  <TableCell key={cidx}>
                    <div className="h-4 w-full max-w-[180px] rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col space-y-4 p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Product Prices</h2>
          <p className="text-muted-foreground">
            Manage your product prices and suppliers
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {canEdit && (
            <>
              <Button onClick={() => setIsBulkModalOpen(true)} variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Bulk Update
              </Button>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Price
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Select
          value={filterProduct}
          onValueChange={setFilterProduct}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {products.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterSupplier}
          onValueChange={setFilterSupplier}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Supplier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            {suppliers.map((s: any) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="h-full flex-1 flex-col space-y-8 md:flex">
        <ProductPricesTable
          prices={prices}
          onEdit={(price) => {
            setSelectedPrice(price);
            setIsModalOpen(true);
          }}
          onDelete={handleDelete}
          isLoading={isLoading}
          canEdit={canEdit}
        />
      </div>

      {isModalOpen && (
        <ProductPriceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPrice(undefined);
          }}
          onSubmit={handleSubmit}
          initialData={selectedPrice}
        />
      )}

      {isBulkModalOpen && (
        <ProductPricesBulkUpdateModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          onSuccess={loadPrices}
        />
      )}
    </div>
  );
}

export default function ProductPricesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductPricesContent />
    </Suspense>
  );
}
