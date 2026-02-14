
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { bulkUpdateProductPrices } from "@/lib/api/product-prices";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ProductPricesBulkUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EXAMPLE_JSON = `[
  {
    "product_sku": "APP-001",
    "supplier_email": "supplier@example.com",
    "cost_price": 15.50,
    "currency": "USD",
    "effective_date": "2024-03-20"
  },
  {
    "product_name": "Manzana Gala",
    "supplier_name": "Frutas Selectas",
    "cost_price": 18.00,
    "currency": "MXN"
  }
]`;

export function ProductPricesBulkUpdateModal({
  isOpen,
  onClose,
  onSuccess,
}: ProductPricesBulkUpdateModalProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);

    try {
      let parsedPrices;
      try {
        parsedPrices = JSON.parse(jsonInput);
      } catch (e) {
        throw new Error("El formato JSON no es válido");
      }

      if (!Array.isArray(parsedPrices)) {
        throw new Error("El input debe ser un array de objetos");
      }

      await bulkUpdateProductPrices({
        source: "manual_ui",
        prices: parsedPrices,
      });

      toast({
        title: "Actualización masiva completada",
        description: `Se procesaron ${parsedPrices.length} registros`,
      });

      onSuccess();
      onClose();
      setJsonInput("");
    } catch (err: any) {
      setError(err.message || "Error al procesar la actualización");
      toast({
        title: "Error",
        description: err.message || "Falló la actualización masiva",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Actualización Masiva de Precios</DialogTitle>
          <DialogDescription>
            Pega un array JSON con los precios a actualizar. Se buscará por SKU/Email o Nombre.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Formato esperado:</h4>
            <pre className="rounded-md bg-slate-950 p-4 overflow-x-auto">
              <code className="text-white text-xs">{EXAMPLE_JSON}</code>
            </pre>
          </div>
          
          <Textarea
            placeholder="Pega tu JSON aquí..."
            className="h-[200px] font-mono text-sm"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
          />

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !jsonInput.trim()}>
            {isLoading ? "Procesando..." : "Actualizar Precios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
