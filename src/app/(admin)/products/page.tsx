"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { ProductsTable } from "@/components/products/ProductsTable";
import { ProductModal } from "@/components/products/ProductModal";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  Product,
  ProductFilters,
} from "@/lib/api/products";
import { useAuth } from "@/lib/hooks/useAuth";
import { ProductInput, PRODUCT_CATEGORIES } from "@/lib/validation/product";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/lib/i18n";

export default function ProductsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 20,
    search: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(
    undefined
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchProducts(filters);
      setProducts(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: t.products.errorLoad,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleCreate = () => {
    setSelectedProduct(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.products.confirmDelete)) return;

    try {
      await deleteProduct(id);
      toast({
        title: t.products.success,
        description: t.products.successDelete,
      });
      loadProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: t.products.errorDelete,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (data: ProductInput) => {
    setIsSubmitting(true);
    try {
      if (selectedProduct) {
        await updateProduct(selectedProduct.id, data);
        toast({
          title: t.products.success,
          description: t.products.successUpdate,
        });
      } else {
        await createProduct(data);
        toast({
          title: t.products.success,
          description: t.products.successCreate,
        });
      }
      setIsModalOpen(false);
      loadProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: t.products.errorCreate,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t.products.title}</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> {t.products.newProduct}
          </Button>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.products.searchPlaceholder}
            value={filters.search}
            onChange={handleSearch}
            className="pl-8"
          />
        </div>
        <Select
          value={filters.category || "all"}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              category: value === "all" ? undefined : value,
              page: 1,
            }))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t.products.categoryPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.products.allCategories}</SelectItem>
            {PRODUCT_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {t.products.categories[category as keyof typeof t.products.categories] || category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ProductsTable
        products={products}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        userRole={user?.role || "GUEST"}
      />
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />
    </div>
  );
}
