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

export default function ProductPricesPage() {
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

      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-4">
          <Select value={filterProduct} onValueChange={(v) => { setFilterProduct(v); setPage(1); }}>
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

          <Select value={filterSupplier} onValueChange={(v) => { setFilterSupplier(v); setPage(1); }}>
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
        <div className="flex items-center gap-2">
          <label htmlFor="limit" className="text-sm text-muted-foreground">Registros por página</label>
          <select
            id="limit"
            value={limit}
            onChange={handleLimitChange}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        renderSkeleton()
      ) : (
        <ProductPricesTable
          prices={prices}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={false}
          canEdit={canEdit}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          Página {Math.min(page, Math.max(totalPages, 1))} de {Math.max(totalPages, 1)} ({total} registros)
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50"
          >
            ← Anterior
          </button>
          {paginationRange.map((p, idx) =>
            typeof p === "number" ? (
              <button
                key={`${p}-${idx}`}
                type="button"
                onClick={() => setPage(p)}
                className={[
                  "px-3 py-1.5 rounded-md border text-sm",
                  p === page ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                ].join(" ")}
                disabled={p === page}
              >
                {p}
              </button>
            ) : (
              <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">…</span>
            )
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={page >= totalPages || totalPages === 0}
            className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50"
          >
            Siguiente →
          </button>
        </div>
      </div>

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
