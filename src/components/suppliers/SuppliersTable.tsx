'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Ban, CheckCircle } from "lucide-react"
import { Supplier } from "@/lib/api/suppliers"
import { useLanguage } from "@/lib/i18n"

interface SuppliersTableProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  isLoading?: boolean;
}

export function SuppliersTable({ suppliers, onEdit, onDelete, isLoading }: SuppliersTableProps) {
  const { t } = useLanguage();

  if (isLoading) {
    return <div className="text-center p-8">{t.suppliers.loadingSuppliers}</div>;
  }

  if (suppliers.length === 0) {
    return <div className="text-center p-8 border rounded-lg">{t.suppliers.noSuppliers}</div>;
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.suppliers.name}</TableHead>
            <TableHead>{t.suppliers.contact}</TableHead>
            <TableHead>{t.suppliers.email}</TableHead>
            <TableHead>{t.suppliers.phone}</TableHead>
            <TableHead>{t.suppliers.status}</TableHead>
            <TableHead className="text-right">{t.suppliers.actionsHeader}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((supplier) => (
            <TableRow key={supplier.id}>
              <TableCell className="font-medium">
                {supplier.name}
              </TableCell>
              <TableCell>{supplier.contactName || '-'}</TableCell>
              <TableCell>{supplier.email || '-'}</TableCell>
              <TableCell>{supplier.phone || '-'}</TableCell>
              <TableCell>
                {supplier.isActive ? (
                  <span className="flex items-center text-hago-primary-700 text-sm">
                    <CheckCircle className="w-4 h-4 mr-1" /> {t.common.active}
                  </span>
                ) : (
                  <span className="flex items-center text-hago-error text-sm">
                    <Ban className="w-4 h-4 mr-1" /> {t.common.inactive}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(supplier)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => onDelete(supplier)}>
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
