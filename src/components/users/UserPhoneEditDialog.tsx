import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, updateUserPhone } from "@/lib/api/users"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface UserPhoneEditDialogProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function UserPhoneEditDialog({
  user,
  isOpen,
  onClose,
  onSuccess,
}: UserPhoneEditDialogProps) {
  const { toast } = useToast()
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      setPhone(user.phone || "")
    }
  }, [isOpen, user])

  const handleSave = async () => {
    if (!user) return

    // Allow empty string to mean null (remove phone)
    const phoneValue = phone.trim() === "" ? null : phone.trim()

    // Basic validation if value is present
    if (phoneValue && !/^\+\d{10,}$/.test(phoneValue)) {
      toast({
        title: "Error de validación",
        description: "El número debe comenzar con + y tener al menos 10 dígitos.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await updateUserPhone(user.id, phoneValue)
      toast({
        title: "Éxito",
        description: "El número de teléfono ha sido actualizado correctamente.",
      })
      onSuccess()
      onClose()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el teléfono",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Teléfono</DialogTitle>
          <DialogDescription>
            Actualiza el número de teléfono para {user?.firstName} {user?.lastName}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Teléfono
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+521XXXXXXXXXX"
              className="col-span-3"
            />
          </div>
          <p className="text-sm text-muted-foreground ml-[25%]">
            Deje en blanco para eliminar el número.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
