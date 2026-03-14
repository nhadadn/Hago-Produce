'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Ban, CheckCircle, KeyRound } from "lucide-react";
import { Customer } from "@prisma/client";
import { useLanguage } from "@/lib/i18n";

interface CustomersTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onResetPassword?: (customer: Customer) => void;
  isLoading?: boolean;
}

export function CustomersTable({ customers, onEdit, onResetPassword, isLoading }: CustomersTableProps) {
  const { t } = useLanguage();

  if (isLoading) {
    return <div className="text-center p-8">{t.customers.loadingCustomers}</div>;
  }

  if (!customers || customers.length === 0) {
    return <div className="text-center p-8 border rounded-lg">{t.customers.noCustomers}</div>;
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.customers.nameHeader}</TableHead>
            <TableHead>{t.customers.taxIdHeader}</TableHead>
            <TableHead>{t.customers.emailHeader}</TableHead>
            <TableHead>{t.customers.phoneHeader}</TableHead>
            <TableHead>{t.customers.statusHeader}</TableHead>
            <TableHead className="text-right">{t.customers.actionsHeader}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">{customer.name}</TableCell>
              <TableCell>{customer.taxId}</TableCell>
              <TableCell>{customer.email || '-'}</TableCell>
              <TableCell>{customer.phone || '-'}</TableCell>
              <TableCell>
                {customer.isActive ? (
                  <span className="flex items-center text-hago-primary-700 text-sm">
                    <CheckCircle className="w-4 h-4 mr-1" /> {t.common.active}
                  </span>
                ) : (
                  <span className="flex items-center text-hago-error text-sm">
                    <Ban className="w-4 h-4 mr-1" /> {t.common.inactive}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right space-x-2">
                {onResetPassword && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onResetPassword(customer)}
                    title={t.customers.generateResetAccess}
                  >
                    <KeyRound className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => onEdit(customer)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
