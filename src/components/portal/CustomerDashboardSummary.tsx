"use client";

import { useEffect, useState } from "react";
import { useCustomerAuth } from "@/lib/hooks/useCustomerAuth";
import { fetchInvoices, InvoicesResponse } from "@/lib/api/invoices";
import { InvoiceStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertTriangle, Clock } from "lucide-react";

interface DashboardTotals {
	totalInvoiced: number;
	totalPaid: number;
	totalPending: number;
	totalOverdue: number;
}

export function CustomerDashboardSummary() {
	const { customer } = useCustomerAuth();
	const [totals, setTotals] = useState<DashboardTotals | null>(null);
	const [pendingInvoices, setPendingInvoices] = useState<InvoicesResponse["data"]["data"]>([]);
	const [overdueInvoices, setOverdueInvoices] = useState<InvoicesResponse["data"]["data"]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!customer) return;

		const load = async () => {
			try {
				setIsLoading(true);
				setError(null);

				const res = await fetchInvoices({ page: 1, limit: 100 });
				const invoices = res.data.data;

				const totalInvoiced = invoices.reduce((acc, inv) => acc + Number(inv.total), 0);
				const totalPaid = invoices
					.filter((inv) => inv.status === InvoiceStatus.PAID)
					.reduce((acc, inv) => acc + Number(inv.total), 0);
				const totalPendingInvoices = invoices.filter((inv) =>
					[InvoiceStatus.PENDING, InvoiceStatus.SENT].includes(inv.status as InvoiceStatus),
				);
				const totalPending = totalPendingInvoices.reduce((acc, inv) => acc + Number(inv.total), 0);

				const overdue = invoices.filter((inv) => inv.status === InvoiceStatus.OVERDUE);
				const totalOverdue = overdue.reduce((acc, inv) => acc + Number(inv.total), 0);

				setTotals({ totalInvoiced, totalPaid, totalPending, totalOverdue });
				setPendingInvoices(totalPendingInvoices.slice(0, 5));
				setOverdueInvoices(overdue.slice(0, 5));
			} catch (err: any) {
				setError(err.message || "Error al cargar dashboard");
			} finally {
				setIsLoading(false);
			}
		};

		load();
	}, [customer]);

	if (!customer) return null;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl md:text-3xl font-bold tracking-tight">
					Hola, {customer.companyName}
				</h1>
				<p className="text-sm md:text-base text-muted-foreground">
					Resumen de tu estado de cuenta y facturas.
				</p>
			</div>

			{error && <p className="text-sm text-destructive">{error}</p>}

			<div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Total facturado</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">
							${totals ? totals.totalInvoiced.toFixed(2) : "-"}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Total pagado</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-emerald-600">
							${totals ? totals.totalPaid.toFixed(2) : "-"}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Pendiente de pago</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-amber-600">
							${totals ? totals.totalPending.toFixed(2) : "-"}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium flex items-center gap-2">
							<AlertTriangle className="h-4 w-4 text-red-500" />
							Vencido
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-red-600">
							${totals ? totals.totalOverdue.toFixed(2) : "-"}
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium flex items-center gap-2">
							<Clock className="h-4 w-4" />
							Facturas pendientes
						</CardTitle>
						<Button variant="ghost" size="sm" asChild>
							<a href="/portal/customer/invoices" className="flex items-center gap-1 text-xs">
								Ver todas
								<ArrowRight className="h-3 w-3" />
							</a>
						</Button>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<p className="text-sm text-muted-foreground">Cargando...</p>
						) : pendingInvoices.length === 0 ? (
							<p className="text-sm text-muted-foreground">No hay facturas pendientes.</p>
						) : (
							<ul className="space-y-2 text-sm">
								{pendingInvoices.map((inv) => (
									<li
										key={inv.id}
										className="flex items-center justify-between border-b last:border-b-0 pb-1"
									>
										<div>
											<div className="font-medium">{inv.number}</div>
											<div className="text-xs text-muted-foreground">
												Vence el {new Date(inv.dueDate).toLocaleDateString()}
											</div>
										</div>
										<div className="text-right">
											<div className="font-semibold">${Number(inv.total).toFixed(2)}</div>
											<Badge variant="outline">{inv.status}</Badge>
										</div>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium flex items-center gap-2">
							<AlertTriangle className="h-4 w-4 text-red-500" />
							Pagos vencidos
						</CardTitle>
						<Button variant="ghost" size="sm" asChild>
							<a href="/portal/customer/invoices?status=OVERDUE" className="flex items-center gap-1 text-xs">
								Ver vencidos
								<ArrowRight className="h-3 w-3" />
							</a>
						</Button>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<p className="text-sm text-muted-foreground">Cargando...</p>
						) : overdueInvoices.length === 0 ? (
							<p className="text-sm text-muted-foreground">No hay pagos vencidos.</p>
						) : (
							<ul className="space-y-2 text-sm">
								{overdueInvoices.map((inv) => (
									<li
										key={inv.id}
										className="flex items-center justify-between border-b last:border-b-0 pb-1"
									>
										<div>
											<div className="font-medium">{inv.number}</div>
											<div className="text-xs text-muted-foreground">
												Venció el {new Date(inv.dueDate).toLocaleDateString()}
											</div>
										</div>
										<div className="text-right">
											<div className="font-semibold">${Number(inv.total).toFixed(2)}</div>
											<Badge variant="destructive">{inv.status}</Badge>
										</div>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

