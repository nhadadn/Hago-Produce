"use client";

import { CustomerDashboardSummary } from "@/components/portal/CustomerDashboardSummary";

export default function CustomerDashboardPage() {
	return (
		<div className="flex-1 space-y-6 p-4 md:p-6">
			<CustomerDashboardSummary />
		</div>
	);
}

