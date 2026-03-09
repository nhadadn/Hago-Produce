import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Ban, CheckCircle, Phone } from "lucide-react"
import { Role } from "@prisma/client"
import { User } from "@/lib/api/users"
import { Badge } from "@/components/ui/badge"

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onEditPhone: (user: User) => void;
  onDelete: (user: User) => void;
  isLoading?: boolean;
}

export function UsersTable({ users, onEdit, onEditPhone, onDelete, isLoading }: UsersTableProps) {
  if (isLoading) {
    return <div className="text-center p-8">Cargando usuarios...</div>;
  }

  if (users.length === 0) {
    return <div className="text-center p-8 border rounded-lg">No se encontraron usuarios.</div>;
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.firstName} {user.lastName}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm">
                    {user.phone || "—"}
                  </span>
                  {user.phone ? (
                    <Badge variant="outline" className="w-fit bg-green-50 text-green-700 border-green-200">
                      WhatsApp ✓
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="w-fit text-gray-500">
                      Sin WhatsApp
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                  {user.role}
                </span>
              </TableCell>
              <TableCell>
                {user.isActive ? (
                  <span className="flex items-center text-hago-primary-700 text-sm">
                    <CheckCircle className="w-4 h-4 mr-1" /> Activo
                  </span>
                ) : (
                  <span className="flex items-center text-hago-error text-sm">
                    <Ban className="w-4 h-4 mr-1" /> Inactivo
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => onEditPhone(user)} title="Editar Teléfono">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onEdit(user)} title="Editar Usuario">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => onDelete(user)} title="Eliminar Usuario">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
