"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductForm } from "./ProductForm";
import { Product } from "@/lib/api/products";
import { ProductInput } from "@/lib/validation/product";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  onSubmit: (data: ProductInput) => void;
  isLoading?: boolean;
}

export function ProductModal({
  isOpen,
  onClose,
  product,
  onSubmit,
  isLoading,
}: ProductModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {product ? "Editar Producto" : "Nuevo Producto"}
          </DialogTitle>
          <DialogDescription>
            {product
              ? "Modifica los datos del producto aquí."
              : "Ingresa los datos para crear un nuevo producto."}
          </DialogDescription>
        </DialogHeader>
        <ProductForm
          product={product}
          onSubmit={onSubmit}
          isLoading={isLoading}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
