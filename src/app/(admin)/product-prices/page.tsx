"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Upload, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
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

        <div className="flex items-center justify-between px-2">
          <div className="flex-1 text-sm text-muted-foreground">
            Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, total)} de {total} registros
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Filas por página</p>
              <Select
                value={`${limit}`}
                onValueChange={(value) => {
                  setLimit(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={limit} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 25, 50, 100].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                <span className="sr-only">Ir a la primera página</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <span className="sr-only">Página anterior</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {paginationRange.map((pageNumber, idx) => {
                if (pageNumber === '...') {
                  return <span key={idx} className="px-2 text-muted-foreground">...</span>;
                }
                return (
                  <Button
                    key={idx}
                    variant={pageNumber === page ? "default" : "outline"}
                    className="h-8 w-8 p-0"
                    onClick={() => setPage(Number(pageNumber))}
                  >
                    {pageNumber}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <span className="sr-only">Página siguiente</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
              >
                <span className="sr-only">Ir a la última página</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
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
